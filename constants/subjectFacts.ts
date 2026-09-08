// Rich repository of Namibian educational "Did You Know?" facts for each curriculum subject
// Contains 100 distinct, curriculum-linked facts per subject across all 19 subjects (1,900 facts total).

const rawFacts = require('./subjectFactsData.json');

export interface SubjectFact {
  id: string;
  subjectId: string;
  title: string;
  fact: string;
  icon: string;
  syllabusTag: string;
  namibianLocationOrContext: string;
}

export const SUBJECT_FACTS: SubjectFact[] = rawFacts as SubjectFact[];

// Helper to get all facts for a specific subject (100 facts)
export function getSubjectFacts(subjectId: string): SubjectFact[] {
  const filtered = SUBJECT_FACTS.filter((f) => f.subjectId === subjectId);
  return filtered.length > 0 ? filtered : SUBJECT_FACTS;
}

// Helper to get an unrepeated fact for a subject
export async function getNextUnrepeatedFact(
  subjectId: string,
  AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  }
): Promise<{ fact: SubjectFact; isFirstTime: boolean; totalFactsCount: number; remainingCount: number }> {
  // 1. Gather all candidate facts for this subject (100 facts per subject)
  let candidates = SUBJECT_FACTS.filter((f) => f.subjectId === subjectId);
  if (candidates.length === 0) {
    candidates = SUBJECT_FACTS;
  }

  const storageKey = `seen_facts_list_${subjectId}`;

  try {
    const rawSeen = await AsyncStorage.getItem(storageKey);
    let seenIds: string[] = [];
    if (rawSeen) {
      try {
        const parsed = JSON.parse(rawSeen);
        if (Array.isArray(parsed)) {
          seenIds = parsed;
        }
      } catch {}
    }

    // Filter out previously seen facts to guarantee non-repetition
    let unshownFacts = candidates.filter((f) => !seenIds.includes(f.id));

    // If all 100 facts have been viewed, reset the cycle
    let isReset = false;
    if (unshownFacts.length === 0) {
      unshownFacts = candidates;
      seenIds = [];
      isReset = true;
    }

    // Pick a random unshown fact from the pool
    const pickedFact = unshownFacts[Math.floor(Math.random() * unshownFacts.length)] || candidates[0];

    // Save updated seenIds
    const updatedSeenIds = [...new Set([...seenIds, pickedFact.id])];
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedSeenIds));

    return {
      fact: pickedFact,
      isFirstTime: seenIds.length === 0 && !isReset,
      totalFactsCount: candidates.length,
      remainingCount: Math.max(0, candidates.length - updatedSeenIds.length),
    };
  } catch {
    return {
      fact: candidates[0],
      isFirstTime: true,
      totalFactsCount: candidates.length,
      remainingCount: candidates.length - 1,
    };
  }
}
