// Did-you-know facts are disabled until supplied by the portal.
// Kept as a thin stub so existing subject screen imports keep working.

export interface SubjectFact {
  id: string;
  subjectId: string;
  title: string;
  fact: string;
  icon: string;
  syllabusTag: string;
  namibianLocationOrContext: string;
}

export const SUBJECT_FACTS: SubjectFact[] = [];

export function getSubjectFacts(_subjectId: string): SubjectFact[] {
  return [];
}

export async function getNextUnrepeatedFact(
  _subjectId: string,
  _AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  }
): Promise<{
  fact: SubjectFact | null;
  isFirstTime: boolean;
  totalFactsCount: number;
  remainingCount: number;
}> {
  return {
    fact: null,
    isFirstTime: true,
    totalFactsCount: 0,
    remainingCount: 0,
  };
}
