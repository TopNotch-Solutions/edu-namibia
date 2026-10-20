import type { GradeId, GradeSubjectContent, Lesson, LessonUnit } from '@/constants/lessonTypes';

/**
 * Bundled lesson content is intentionally empty — lessons come from the portal only.
 * Remote packs are merged via mergeRemoteLessonPacks().
 */
const BUNDLED: Partial<Record<GradeId, Record<string, GradeSubjectContent>>> = {};

/** Portal-published packs, keyed the same way as bundled content. */
let remoteContent: Partial<Record<GradeId, Record<string, GradeSubjectContent>>> = {};

export type RemoteLessonPack = GradeSubjectContent;

function clonePack(pack: GradeSubjectContent): GradeSubjectContent {
  return {
    ...pack,
    units: pack.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({ ...lesson })),
    })),
  };
}

/** Replace the in-memory remote registry (called after sync / cache hydrate). */
export function mergeRemoteLessonPacks(packs: RemoteLessonPack[]) {
  const next: Partial<Record<GradeId, Record<string, GradeSubjectContent>>> = {};
  for (const pack of packs) {
    if (!pack?.gradeId || !pack?.subjectId || !Array.isArray(pack.units)) continue;
    const gradeId = pack.gradeId as GradeId;
    if (!next[gradeId]) next[gradeId] = {};
    next[gradeId]![pack.subjectId] = clonePack(pack);
  }
  remoteContent = next;
}

export function getGradeSubjectContent(
  gradeId: GradeId,
  subjectId: string
): GradeSubjectContent | undefined {
  return remoteContent[gradeId]?.[subjectId] ?? BUNDLED[gradeId]?.[subjectId];
}

export function hasLessonContent(gradeId: GradeId, subjectId: string): boolean {
  return Boolean(getGradeSubjectContent(gradeId, subjectId));
}

export function getLessonUnits(gradeId: GradeId, subjectId: string): LessonUnit[] {
  return getGradeSubjectContent(gradeId, subjectId)?.units ?? [];
}

/** Every lesson for a grade + subject, in unit then order sequence. */
export function getAllLessons(gradeId: GradeId, subjectId: string): Lesson[] {
  return getLessonUnits(gradeId, subjectId).flatMap((unit) => unit.lessons);
}

function findLessonInStore(
  store: Partial<Record<GradeId, Record<string, GradeSubjectContent>>>,
  lessonId: string
): Lesson | undefined {
  for (const bySubject of Object.values(store)) {
    if (!bySubject) continue;
    for (const content of Object.values(bySubject)) {
      for (const unit of content.units) {
        const found = unit.lessons.find((lesson) => lesson.id === lessonId);
        if (found) return found;
      }
    }
  }
  return undefined;
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return (
    findLessonInStore(remoteContent, lessonId) ?? findLessonInStore(BUNDLED, lessonId)
  );
}

export function getUnitForLesson(lesson: Lesson): LessonUnit | undefined {
  return getLessonUnits(lesson.gradeId, lesson.subjectId).find(
    (unit) => unit.id === lesson.unitId
  );
}

/** The next lesson in sequence, or undefined if this is the last one. */
export function getNextLesson(lesson: Lesson): Lesson | undefined {
  const all = getAllLessons(lesson.gradeId, lesson.subjectId);
  const index = all.findIndex((item) => item.id === lesson.id);
  return index >= 0 ? all[index + 1] : undefined;
}
