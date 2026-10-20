import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getGradeLabel } from '@/constants/curriculum';
import type { GradeId } from '@/constants/lessonTypes';
import {
  emptySubjectStudyData,
  type ContentModule,
  type QuizQuestion,
  type SubjectStudyData,
  type TextbookItem,
} from '@/constants/subjectData';

export type CurriculumPack = {
  grade_key: string;
  grade_label: string;
  subject_key: string;
  subject_label: string;
  modules: ContentModule[];
  quizzes: QuizQuestion[];
  materials: TextbookItem[];
};

type CurriculumMeta = {
  version: number;
  updated_at?: string | null;
};

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

export const CURRICULUM_API_BASE = resolveApiBase();

const CACHE_KEY = 'curriculum_packs_cache_v1';
const VERSION_KEY = 'curriculum_packs_version_v1';

let packsCache: CurriculumPack[] = [];

function normalizeSubject(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function gradeNumber(value: string) {
  const match = String(value || '').match(/(\d+)/);
  return match ? match[1] : '';
}

function subjectsMatch(a: string, b: string) {
  const left = normalizeSubject(a);
  const right = normalizeSubject(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

async function readCache(): Promise<CurriculumPack[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CurriculumPack[]) : [];
  } catch {
    return [];
  }
}

async function writeCache(packs: CurriculumPack[], version: number) {
  packsCache = packs;
  await AsyncStorage.multiSet([
    [CACHE_KEY, JSON.stringify(packs)],
    [VERSION_KEY, String(version)],
  ]);
}

export async function hydrateCurriculumFromCache(): Promise<number> {
  packsCache = await readCache();
  return packsCache.length;
}

export function getCurriculumPack(
  gradeId: string,
  subjectName: string
): CurriculumPack | null {
  const wantedGrade = gradeNumber(gradeId) || gradeNumber(getGradeLabel(gradeId));
  const packs = packsForSubject(subjectName);
  if (!packs.length) return null;

  return (
    packs.find((pack) => !wantedGrade || pack.grade_key === wantedGrade) ||
    packs[0] ||
    null
  );
}

function packsForSubject(subjectName: string): CurriculumPack[] {
  return packsCache.filter((pack) => subjectsMatch(pack.subject_label, subjectName));
}

/** Merge materials from every pack that matches this subject (grade + subject-only). */
export function getSubjectMaterials(subjectName: string): TextbookItem[] {
  const byId = new Map<string, TextbookItem>();
  for (const pack of packsForSubject(subjectName)) {
    for (const item of pack.materials || []) {
      if (!item?.id) continue;
      byId.set(String(item.id), item);
    }
  }
  return Array.from(byId.values());
}

export function absoluteUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${CURRICULUM_API_BASE}${normalized}`;
}

/** Study data for a subject — portal packs only (no hardcoded fallback). */
export function resolveSubjectStudyData(
  subjectId: string,
  subjectName: string,
  _category: string,
  gradeId?: string | GradeId
): SubjectStudyData {
  const empty = emptySubjectStudyData(subjectId);
  const subjectPacks = packsForSubject(subjectName);
  if (!subjectPacks.length) return empty;

  const pack = gradeId
    ? getCurriculumPack(String(gradeId), subjectName)
    : subjectPacks[0];
  if (!pack) return empty;

  const portalQuizzes = Array.isArray(pack.quizzes) ? pack.quizzes : [];
  const portalModules = Array.isArray(pack.modules) ? pack.modules : [];
  const portalMaterials = getSubjectMaterials(subjectName);

  return {
    ...empty,
    modules: portalModules,
    quizQuestions: {
      topicPractice: portalQuizzes,
      competition: portalQuizzes,
      pastPapers: [],
    },
    textbooks: portalMaterials,
  };
}

/**
 * Sync portal curriculum (topics/units/tips, quizzes, materials) for the mobile app.
 */
export async function syncCurriculum(force = false): Promise<{
  updated: boolean;
  count: number;
  version: number;
  error?: string;
}> {
  try {
    await hydrateCurriculumFromCache();

    const metaRes = await fetch(`${CURRICULUM_API_BASE}/api/curriculum/meta`);
    if (!metaRes.ok) {
      throw new Error(`Curriculum meta HTTP ${metaRes.status}`);
    }
    const meta = (await metaRes.json()) as CurriculumMeta;
    const remoteVersion = Number(meta.version) || 1;
    const localVersion = Number((await AsyncStorage.getItem(VERSION_KEY)) || '0');

    if (!force && localVersion === remoteVersion && packsCache.length > 0) {
      return { updated: false, count: packsCache.length, version: localVersion };
    }

    const packsRes = await fetch(`${CURRICULUM_API_BASE}/api/curriculum/packs`);
    if (!packsRes.ok) {
      throw new Error(`Curriculum packs HTTP ${packsRes.status}`);
    }
    const payload = (await packsRes.json()) as { packs?: CurriculumPack[]; version?: number };
    const packs = Array.isArray(payload.packs) ? payload.packs : [];
    const version = Number(payload.version) || remoteVersion;

    await writeCache(packs, version);
    return { updated: true, count: packs.length, version };
  } catch (error) {
    packsCache = await readCache();
    return {
      updated: false,
      count: packsCache.length,
      version: Number((await AsyncStorage.getItem(VERSION_KEY)) || '0'),
      error: error instanceof Error ? error.message : 'Curriculum sync failed',
    };
  }
}
