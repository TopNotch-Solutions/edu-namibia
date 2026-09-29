import AsyncStorage from '@react-native-async-storage/async-storage';
import { addXp } from '@/constants/learnerStats';
import type { GradeId } from '@/constants/lessonTypes';

/**
 * Per-lesson progress for the Read → Try → Check flow.
 *
 * XP is paid once per component. Redoing a lesson is always allowed, but it
 * never pays twice — the learner has to reset the lesson to earn it again.
 */

export type LessonComponent = 'read' | 'lab' | 'check';

export interface LessonProgress {
  readDone: boolean;
  labDone: boolean;
  checkDone: boolean;
  checkScore: number | null;
  checkTotal: number | null;
  xpAwarded: Record<LessonComponent, number>;
  completedAt: string | null;
  updatedAt: string;
}

export type LessonProgressMap = Record<string, LessonProgress>;

export interface AwardResult {
  xpEarned: number;
  isNewXp: boolean;
  progress: LessonProgress;
}

// Serialised so two awards fired close together can't read the same old map
// and overwrite each other — same approach as constants/learnerStats.ts.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function storageKey(gradeId: GradeId, subjectId: string): string {
  return `lesson_progress_${gradeId}_${subjectId}`;
}

export function emptyProgress(): LessonProgress {
  return {
    readDone: false,
    labDone: false,
    checkDone: false,
    checkScore: null,
    checkTotal: null,
    xpAwarded: { read: 0, lab: 0, check: 0 },
    completedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function normalise(value: unknown): LessonProgress {
  const base = emptyProgress();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<LessonProgress>;
  return {
    ...base,
    ...raw,
    xpAwarded: { ...base.xpAwarded, ...(raw.xpAwarded ?? {}) },
  };
}

async function readMap(gradeId: GradeId, subjectId: string): Promise<LessonProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(gradeId, subjectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const map: LessonProgressMap = {};
    for (const [lessonId, entry] of Object.entries(parsed as Record<string, unknown>)) {
      map[lessonId] = normalise(entry);
    }
    return map;
  } catch {
    return {};
  }
}

async function writeMap(
  gradeId: GradeId,
  subjectId: string,
  map: LessonProgressMap
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(gradeId, subjectId), JSON.stringify(map));
  } catch {}
}

export function loadLessonProgressMap(
  gradeId: GradeId,
  subjectId: string
): Promise<LessonProgressMap> {
  return enqueue(() => readMap(gradeId, subjectId));
}

export function loadLessonProgress(
  gradeId: GradeId,
  subjectId: string,
  lessonId: string
): Promise<LessonProgress> {
  return enqueue(async () => {
    const map = await readMap(gradeId, subjectId);
    return map[lessonId] ?? emptyProgress();
  });
}

/**
 * Marks a component done and pays its XP — but only the first time.
 * A second call for the same component returns `isNewXp: false` and pays nothing.
 */
export function awardComponent(
  gradeId: GradeId,
  subjectId: string,
  lessonId: string,
  component: LessonComponent,
  amount: number,
  extra?: { checkScore?: number; checkTotal?: number }
): Promise<AwardResult> {
  return enqueue(async () => {
    const map = await readMap(gradeId, subjectId);
    const current = map[lessonId] ?? emptyProgress();
    const alreadyPaid = current.xpAwarded[component] > 0;

    const next: LessonProgress = {
      ...current,
      readDone: component === 'read' ? true : current.readDone,
      labDone: component === 'lab' ? true : current.labDone,
      checkDone: component === 'check' ? true : current.checkDone,
      checkScore: extra?.checkScore ?? current.checkScore,
      checkTotal: extra?.checkTotal ?? current.checkTotal,
      xpAwarded: {
        ...current.xpAwarded,
        [component]: alreadyPaid ? current.xpAwarded[component] : amount,
      },
      updatedAt: new Date().toISOString(),
    };

    if (next.checkDone && !next.completedAt) {
      next.completedAt = new Date().toISOString();
    }

    map[lessonId] = next;
    await writeMap(gradeId, subjectId, map);

    if (!alreadyPaid && amount > 0) {
      await addXp(amount);
    }

    return {
      xpEarned: alreadyPaid ? 0 : amount,
      isNewXp: !alreadyPaid,
      progress: next,
    };
  });
}

/** Clears a lesson and takes back every XP it paid, so it can be earned again. */
export function resetLesson(
  gradeId: GradeId,
  subjectId: string,
  lessonId: string
): Promise<LessonProgress> {
  return enqueue(async () => {
    const map = await readMap(gradeId, subjectId);
    const current = map[lessonId];
    const refund = current
      ? current.xpAwarded.read + current.xpAwarded.lab + current.xpAwarded.check
      : 0;

    const cleared = emptyProgress();
    map[lessonId] = cleared;
    await writeMap(gradeId, subjectId, map);

    if (refund > 0) {
      await addXp(-refund);
    }
    return cleared;
  });
}

export function isLessonComplete(progress: LessonProgress | undefined): boolean {
  return Boolean(progress?.checkDone);
}

export function lessonXpEarned(progress: LessonProgress | undefined): number {
  if (!progress) return 0;
  return progress.xpAwarded.read + progress.xpAwarded.lab + progress.xpAwarded.check;
}
