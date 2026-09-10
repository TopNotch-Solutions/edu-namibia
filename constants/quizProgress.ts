import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuizQuestion } from '@/constants/subjectData';

export type QuizModeKey = 'topicPractice' | 'competition' | 'pastPapers';

export interface QuizTopicProgress {
  /** Best completed score (correct answers) */
  bestScore: number;
  /** Total questions when best score was achieved */
  bestTotal: number;
  /** Last completed score */
  lastScore: number;
  lastTotal: number;
  /** Saved answers from last completed attempt (for review) */
  lastAnswers: (number | null)[] | null;
  /** In-progress session (null if none / completed) */
  inProgress: {
    currentIndex: number;
    score: number;
    selectedOptionIndex: number | null;
    hasAnswered: boolean;
    answers: (number | null)[];
  } | null;
  updatedAt: string;
}

export type SubjectQuizProgressMap = Record<string, QuizTopicProgress>;

export interface TopicQuizSet {
  quizId: string;
  quizTitle: string;
  topic: string;
  questions: QuizQuestion[];
}

function storageKey(subjectId: string): string {
  return `quiz_progress_${subjectId}`;
}

export function sessionKey(mode: QuizModeKey, topic: string, quizId?: string): string {
  if (quizId) return `${mode}::${topic}::${quizId}`;
  return `${mode}::${topic || mode}`;
}

export async function loadSubjectQuizProgress(
  subjectId: string
): Promise<SubjectQuizProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(subjectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveSubjectQuizProgress(
  subjectId: string,
  map: SubjectQuizProgressMap
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(subjectId), JSON.stringify(map));
  } catch {}
}

export async function upsertTopicProgress(
  subjectId: string,
  key: string,
  patch: Partial<QuizTopicProgress>
): Promise<SubjectQuizProgressMap> {
  const map = await loadSubjectQuizProgress(subjectId);
  const existing = map[key] || {
    bestScore: 0,
    bestTotal: 0,
    lastScore: 0,
    lastTotal: 0,
    lastAnswers: null,
    inProgress: null,
    updatedAt: new Date().toISOString(),
  };
  map[key] = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveSubjectQuizProgress(subjectId, map);
  return map;
}

export function getTopicEntries(
  questions: QuizQuestion[]
): { topic: string; count: number; quizCount: number }[] {
  const byTopic = new Map<string, QuizQuestion[]>();
  for (const q of questions) {
    const list = byTopic.get(q.topic) || [];
    list.push(q);
    byTopic.set(q.topic, list);
  }
  return Array.from(byTopic.entries()).map(([topic, qs]) => ({
    topic,
    count: qs.length,
    quizCount: getQuizSetsForTopic(questions, topic).length,
  }));
}

/** Build quiz sets for a topic (uses quizId when present, otherwise chunks of 3). */
export function getQuizSetsForTopic(
  questions: QuizQuestion[],
  topic: string
): TopicQuizSet[] {
  const topicQs = questions.filter((q) => q.topic === topic);
  if (topicQs.length === 0) return [];

  const hasExplicit = topicQs.some((q) => q.quizId);
  if (hasExplicit) {
    const map = new Map<string, TopicQuizSet>();
    for (const q of topicQs) {
      const quizId = q.quizId || 'quiz-1';
      const existing = map.get(quizId);
      if (existing) {
        existing.questions.push(q);
      } else {
        map.set(quizId, {
          quizId,
          quizTitle: q.quizTitle || `Quiz ${map.size + 1}`,
          topic,
          questions: [q],
        });
      }
    }
    return Array.from(map.values());
  }

  const chunkSize = 3;
  const sets: TopicQuizSet[] = [];
  for (let i = 0; i < topicQs.length; i += chunkSize) {
    const chunk = topicQs.slice(i, i + chunkSize);
    const n = sets.length + 1;
    sets.push({
      quizId: `auto-${n}`,
      quizTitle: `Quiz ${n}`,
      topic,
      questions: chunk,
    });
  }
  // Ensure at least 2 quiz cards when only one chunk exists by splitting if possible
  if (sets.length === 1 && topicQs.length >= 2) {
    const mid = Math.ceil(topicQs.length / 2);
    return [
      {
        quizId: 'auto-1',
        quizTitle: 'Quiz 1 · Warm-up',
        topic,
        questions: topicQs.slice(0, mid),
      },
      {
        quizId: 'auto-2',
        quizTitle: 'Quiz 2 · Practice',
        topic,
        questions: topicQs.slice(mid),
      },
    ];
  }
  return sets;
}

export function getTopicBestSummary(
  map: SubjectQuizProgressMap,
  mode: QuizModeKey,
  topic: string,
  quizSets: TopicQuizSet[]
): { completedCount: number; bestLabel: string | null } {
  let completedCount = 0;
  let bestScore = -1;
  let bestTotal = 0;
  for (const set of quizSets) {
    const entry = map[sessionKey(mode, topic, set.quizId)];
    if (entry && entry.lastTotal > 0) {
      completedCount += 1;
      if (entry.bestScore > bestScore) {
        bestScore = entry.bestScore;
        bestTotal = entry.bestTotal;
      }
    }
  }
  return {
    completedCount,
    bestLabel: bestScore >= 0 ? `${bestScore}/${bestTotal}` : null,
  };
}

/** Flatten all quiz sets across topics (used by Competition hub). */
export function getAllQuizSets(questions: QuizQuestion[]): TopicQuizSet[] {
  const topics: string[] = [];
  for (const q of questions) {
    if (!topics.includes(q.topic)) topics.push(q.topic);
  }
  return topics.flatMap((topic) => getQuizSetsForTopic(questions, topic));
}

export function isQuizCompleted(
  map: SubjectQuizProgressMap,
  mode: QuizModeKey,
  topic: string,
  quizId: string
): boolean {
  const entry = map[sessionKey(mode, topic, quizId)];
  return Boolean(entry && entry.lastTotal > 0 && !entry.inProgress);
}
