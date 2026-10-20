import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { CURRICULUM_API_BASE } from '@/constants/curriculumSync';

const MAP_KEY = 'offline_file_map_v1';
const OFFLINE_DIR = `${FileSystem.documentDirectory || ''}edu_offline/`;

type OfflineFileMap = Record<string, string>;

let mapCache: OfflineFileMap | null = null;

function remoteUploadUrl(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${CURRICULUM_API_BASE}${normalized}`;
}

async function ensureDir() {
  if (!FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(OFFLINE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
  }
}

async function readMap(): Promise<OfflineFileMap> {
  if (mapCache) return mapCache;
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    mapCache = parsed && typeof parsed === 'object' ? (parsed as OfflineFileMap) : {};
  } catch {
    mapCache = {};
  }
  return mapCache;
}

async function writeMap(map: OfflineFileMap) {
  mapCache = map;
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export async function hydrateOfflineFiles(): Promise<number> {
  const map = await readMap();
  return Object.keys(map).length;
}

function mapKeysFor(pathOrUrl: string): string[] {
  const keys = new Set<string>([pathOrUrl]);
  const absolute = remoteUploadUrl(pathOrUrl);
  if (absolute) keys.add(absolute);
  if (pathOrUrl.startsWith('/')) keys.add(pathOrUrl.slice(1));
  return Array.from(keys);
}

/** Prefer a locally downloaded file; fall back to the remote upload URL. */
export function resolveOfflineUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  const map = mapCache || {};
  for (const key of mapKeysFor(pathOrUrl)) {
    if (map[key]) return map[key];
  }
  return remoteUploadUrl(pathOrUrl);
}

export async function getOfflineFileUri(
  pathOrUrl: string | null | undefined
): Promise<string | null> {
  if (!pathOrUrl) return null;
  const map = await readMap();
  for (const key of mapKeysFor(pathOrUrl)) {
    if (!map[key]) continue;
    const info = await FileSystem.getInfoAsync(map[key]);
    if (info.exists) return map[key];
  }
  return null;
}

function safeFileName(remoteUrl: string) {
  const cleaned = remoteUrl.split('?')[0];
  const parts = cleaned.split('/');
  const last = parts[parts.length - 1] || `file_${Date.now()}`;
  return last.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-96);
}

/**
 * Download a remote file into app documents and remember the mapping.
 * Returns the local file URI, or null if download failed.
 */
export async function downloadOfflineFile(
  pathOrUrl: string
): Promise<string | null> {
  const remoteUrl = remoteUploadUrl(pathOrUrl) || pathOrUrl;
  if (!/^https?:\/\//i.test(remoteUrl)) return null;
  if (!FileSystem.documentDirectory) return null;

  const existing = await getOfflineFileUri(pathOrUrl);
  if (existing) return existing;

  try {
    await ensureDir();
    const localUri = `${OFFLINE_DIR}${safeFileName(remoteUrl)}`;
    const result = await FileSystem.downloadAsync(remoteUrl, localUri);
    if (result.status && result.status >= 400) return null;

    const map = await readMap();
    for (const key of mapKeysFor(pathOrUrl)) {
      map[key] = result.uri;
    }
    map[remoteUrl] = result.uri;
    await writeMap(map);
    return result.uri;
  } catch {
    return null;
  }
}
