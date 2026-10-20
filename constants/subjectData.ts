// Study data shapes for the mobile app. Content is loaded from the teacher portal.

export interface LessonSubtopic {
  id: string;
  title: string;
  durationMinutes: number;
  completed?: boolean;
  conceptSummary: string;
  workedExample?: {
    problem: string;
    given: string[];
    steps: string[];
    answer: string;
  };
  examTip: string;
  diagramTitle?: string;
  diagramConcept?: string;
  mediaImages?: string[];
  mediaVideos?: string[];
}

export interface ContentModule {
  id: string;
  unitNumber: number;
  unitTitle: string;
  curriculumLevel: string;
  subtopicsCount: number;
  estimatedHours: string;
  subtopics: LessonSubtopic[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  year?: string;
  paper?: string;
  topic: string;
  quizId?: string;
  quizTitle?: string;
}

export interface TextbookItem {
  id: string;
  title: string;
  category: 'Approved Textbook' | 'MoEAC Syllabus' | 'Learner Guide' | 'Past Paper Archive';
  publisher: string;
  pages: number;
  fileSize: string;
  isDownloaded: boolean;
  coverColor: string;
  chapters: { title: string; page: number }[];
  fileUrl?: string | null;
  description?: string | null;
  materialType?: 'textbook' | 'syllabus' | 'learning_guide' | string;
}

export interface SummaryFormula {
  name: string;
  formula: string;
  variables: { symbol: string; meaning: string; unit: string }[];
  examCaution: string;
}

export interface SummaryDefinition {
  term: string;
  definition: string;
  keywordHighlight: string;
  examMarks: number;
}

export interface SummaryMindMap {
  title: string;
  description: string;
  tags: string[];
  nodeCount: number;
}

export interface SubjectStudyData {
  subjectId: string;
  modules: ContentModule[];
  quizQuestions: {
    topicPractice: QuizQuestion[];
    competition: QuizQuestion[];
    pastPapers: QuizQuestion[];
  };
  textbooks: TextbookItem[];
  summaries: {
    formulas: SummaryFormula[];
    definitions: SummaryDefinition[];
    mindMaps: SummaryMindMap[];
    bulletSummaries: { title: string; points: string[]; examFrequency: 'High' | 'Medium' }[];
  };
}

/** Empty study pack — portal sync fills this via resolveSubjectStudyData. */
export function emptySubjectStudyData(subjectId: string): SubjectStudyData {
  return {
    subjectId,
    modules: [],
    quizQuestions: {
      topicPractice: [],
      competition: [],
      pastPapers: [],
    },
    textbooks: [],
    summaries: {
      formulas: [],
      definitions: [],
      mindMaps: [],
      bulletSummaries: [],
    },
  };
}

/** @deprecated Prefer resolveSubjectStudyData from curriculumSync — returns empty local packs only. */
export function getSubjectStudyData(
  subjectId: string,
  _subjectName?: string,
  _category?: string
): SubjectStudyData {
  return emptySubjectStudyData(subjectId);
}
