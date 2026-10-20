/**
 * Types for the paced lesson flow: Read → Try → Check → Done.
 *
 * A lesson is one sitting (5–10 min). Theory is an array of small cards rather
 * than one block of text, so the learner meets a single idea per screen.
 */

/** An array the type system guarantees has at least one element. */
export type NonEmptyArray<T> = [T, ...T[]];

export type GradeId =
  | 'gr0'
  | 'gr1'
  | 'gr2'
  | 'gr3'
  | 'gr4'
  | 'gr5'
  | 'gr6'
  | 'gr7'
  | 'gr8'
  | 'gr9'
  | 'gr10'
  | 'gr11'
  | 'gr12';

/**
 * Every interactive lab a lesson may point at.
 *
 * `LabStage` in components/labs/LabStage.tsx switches exhaustively over this
 * union, so adding an id here without writing the component is a build error
 * rather than a blank screen for a learner.
 */
export type LabId = 'PARTICLE_HEATER';

/** Small inline illustrations a read card can show above its text. */
export type VisualId =
  | 'PARTICLE_SOLID'
  | 'PARTICLE_LIQUID'
  | 'PARTICLE_GAS'
  | 'STATE_CHANGE_ARROWS'
  | 'THERMOMETER_FIXED_POINTS';

export interface SymbolMeaning {
  symbol: string;
  meaning: string;
  unit: string;
}

export type ReadCard =
  | { kind: 'idea'; heading: string; body: string; visual?: VisualId }
  | { kind: 'definition'; term: string; meaning: string; inOtherWords?: string }
  | { kind: 'formula'; name: string; formula: string; where: SymbolMeaning[] }
  | { kind: 'example'; problem: string; given: string[]; steps: string[]; answer: string }
  | { kind: 'tip'; heading: string; body: string };

export interface CheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** Shown after answering, whether the learner was right or wrong. */
  explanation: string;
}

export interface LabSpec {
  labId: LabId;
  title: string;
  /** One or two sentences telling the learner what they are about to do. */
  brief: string;
  /** The single thing they must achieve before the Check unlocks. */
  goal: string;
  xp: number;
}

export interface Lesson {
  id: string;
  gradeId: GradeId;
  subjectId: string;
  unitId: string;
  order: number;
  title: string;
  /** One sentence: what the learner will be able to do afterwards. */
  objective: string;
  durationMinutes: number;
  /** At least one card — an empty Read step would dead-end the learner. */
  read: NonEmptyArray<ReadCard>;
  lab: LabSpec | null;
  /** At least one question, for the same reason. */
  check: NonEmptyArray<CheckQuestion>;
  readXp: number;
  checkXp: number;
  /** True until a teacher has checked this against the MoEAC syllabus. */
  draft?: boolean;
}

export interface LessonUnit {
  id: string;
  unitNumber: number;
  title: string;
  summary: string;
  lessons: Lesson[];
}

export interface GradeSubjectContent {
  gradeId: GradeId;
  subjectId: string;
  /** e.g. 'MoEAC Junior Secondary' — shown under the subject title. */
  syllabusLabel: string;
  draft?: boolean;
  units: LessonUnit[];
}

/** One item in a lab's goal checklist. */
export interface LabGoalStep {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
}

/**
 * The entire contract between a lab and the lesson screen. A lab owns its own
 * success condition and reports upward; the lesson never inspects lab internals.
 */
export interface LabProps {
  /** Call once the lab's goal has been met. Safe to call more than once. */
  onGoalReached: () => void;
  /** Optional running checklist, rendered by the lesson screen. */
  onProgress?: (steps: LabGoalStep[]) => void;
}

export function totalLessonXp(lesson: Lesson): number {
  return lesson.readXp + (lesson.lab?.xp ?? 0) + lesson.checkXp;
}
