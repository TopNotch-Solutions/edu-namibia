import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  mergeRemoteLessonPacks,
  type RemoteLessonPack,
} from '@/constants/content';

function resolveApiBase(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

  if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return envUrl || 'http://localhost:5000';
}

const API_BASE = resolveApiBase();
const CACHE_KEY = 'lesson_packs_cache_v1';
const VERSION_KEY = 'lesson_packs_version_v1';

type LessonMeta = {
  version: number;
  updated_at?: string | null;
};

async function readCache(): Promise<RemoteLessonPack[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RemoteLessonPack[]) : [];
  } catch {
    return [];
  }
}

async function writeCache(packs: RemoteLessonPack[], version: number) {
  await AsyncStorage.multiSet([
    [CACHE_KEY, JSON.stringify(packs)],
    [VERSION_KEY, String(version)],
  ]);
}

/** Apply cached packs into the in-memory lesson registry (bundled content still wins as fallback). */
export async function hydrateLessonsFromCache(): Promise<number> {
  const packs = await readCache();
  mergeRemoteLessonPacks(packs);
  return packs.length;
}

/**
 * Sync published lesson modules from the portal backend.
 * Same pattern as Explore: version check → fetch packs → cache → merge.
 */
export async function syncLessons(force = false): Promise<{
  updated: boolean;
  count: number;
  version: number;
  error?: string;
}> {
  try {
    await hydrateLessonsFromCache();

    const metaRes = await fetch(`${API_BASE}/api/lessons/meta`);
    if (!metaRes.ok) {
      throw new Error(`Lesson meta HTTP ${metaRes.status}`);
    }
    const meta = (await metaRes.json()) as LessonMeta;
    const remoteVersion = Number(meta.version) || 1;
    const localVersion = Number((await AsyncStorage.getItem(VERSION_KEY)) || '0');

    if (!force && localVersion === remoteVersion) {
      const packs = await readCache();
      mergeRemoteLessonPacks(packs);
      return { updated: false, count: packs.length, version: localVersion };
    }

    const packsRes = await fetch(`${API_BASE}/api/lessons/packs`);
    if (!packsRes.ok) {
      throw new Error(`Lesson packs HTTP ${packsRes.status}`);
    }
    const payload = (await packsRes.json()) as { packs?: RemoteLessonPack[] };
    const packs = Array.isArray(payload.packs) ? payload.packs : [];

    await writeCache(packs, remoteVersion);
    mergeRemoteLessonPacks(packs);

    return { updated: true, count: packs.length, version: remoteVersion };
  } catch (error) {
    const packs = await readCache();
    mergeRemoteLessonPacks(packs);
    return {
      updated: false,
      count: packs.length,
      version: Number((await AsyncStorage.getItem(VERSION_KEY)) || '0'),
      error: error instanceof Error ? error.message : 'Lesson sync failed',
    };
  }
}

export { API_BASE as LESSON_API_BASE };
