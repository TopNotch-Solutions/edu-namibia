import type { GradeId, GradeSubjectContent, Lesson, LessonUnit } from '@/constants/lessonTypes';
import { GR8_PHYSICAL_SCIENCE } from './gr8-phys';

/**
 * Lesson content, keyed by grade and then subject.
 *
 * Grades that have no entry here fall back to the legacy accordion driven by
 * constants/subjectData.ts, so nothing regresses while content is written.
 */
const CONTENT: Partial<Record<GradeId, Record<string, GradeSubjectContent>>> = {
  gr8: {
    phys: GR8_PHYSICAL_SCIENCE,
  },
};

export function getGradeSubjectContent(
  gradeId: GradeId,
  subjectId: string
): GradeSubjectContent | undefined {
  return CONTENT[gradeId]?.[subjectId];
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

export function getLessonById(lessonId: string): Lesson | undefined {
  for (const bySubject of Object.values(CONTENT)) {
    for (const content of Object.values(bySubject)) {
      for (const unit of content.units) {
        const found = unit.lessons.find((lesson) => lesson.id === lessonId);
        if (found) return found;
      }
    }
  }
  return undefined;
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
