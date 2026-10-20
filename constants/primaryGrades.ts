import type { GradeId } from './lessonTypes';
import type { SubjectCategory, SubjectOption } from './curriculum';

/** Grades that use the junior primary subject catalog. */
export const JUNIOR_PRIMARY_GRADES: GradeId[] = [
  'gr0',
  'gr1',
  'gr2',
  'gr3',
  'gr4',
  'gr5',
  'gr6',
  'gr7',
];

/** Topic outlines for Grades 1–3 (Namibian junior primary). */
export const PRIMARY_TOPICS: Record<
  'l1' | 'l2' | 'math_p' | 'enviro' | 'arts' | 'rme' | 'pe',
  Partial<Record<'gr1' | 'gr2' | 'gr3', string[]>>
> = {
  l1: {
    gr1: [
      'Listening and speaking',
      'Reading',
      'Writing',
      'Phonics and vocabulary development',
      'Grammar basics',
    ],
    gr2: [
      'Reading fluency',
      'Writing paragraphs and stories',
      'Grammar and vocabulary',
      'Listening and speaking skills',
    ],
    gr3: [
      'Reading longer texts',
      'Creative writing',
      'Grammar and comprehension',
      'Listening and speaking skills',
    ],
  },
  l2: {
    gr1: [
      'Listening and speaking in English',
      'Basic reading and writing',
      'Vocabulary building',
      'Pronunciation and communication skills',
    ],
    gr2: [
      'Reading and writing in English',
      'Vocabulary development',
      'Communication and comprehension skills',
    ],
    gr3: [
      'Independent reading',
      'Paragraph writing',
      'Vocabulary development',
      'Speaking and listening skills',
    ],
  },
  math_p: {
    gr1: [
      'Counting and number concepts',
      'Addition and subtraction',
      'Measurement (time, money, length, mass)',
      'Shapes and geometry',
      'Data handling and problem solving',
    ],
    gr2: [
      'Numbers up to higher ranges',
      'Addition and subtraction',
      'Introduction to multiplication and division concepts',
      'Measurement, money, time, shapes, and data handling',
    ],
    gr3: [
      'Larger numbers and place value',
      'Addition and subtraction',
      'Multiplication and division',
      'Fractions',
      'Measurement, money, time, and data handling',
      'Problem-solving skills',
    ],
  },
  enviro: {
    gr1: [
      'Myself and my family',
      'Community and culture',
      'Health and safety',
      'Plants, animals, water, weather, environment',
      'Basic science concepts',
    ],
    gr2: [
      'Family and community',
      'Health and nutrition',
      'Safety and technology',
      'Plants, animals, water, weather, and environment',
    ],
    gr3: [
      'Community and citizenship',
      'Environment and conservation',
      'Science investigations',
      'Plants and animals',
      'Weather and natural resources',
      'Technology awareness',
    ],
  },
  arts: {
    gr1: ['Visual Art (drawing, colouring, craft)', 'Music', 'Drama', 'Dance'],
    gr2: ['Visual Arts', 'Music', 'Drama', 'Dance'],
    gr3: ['Visual Arts', 'Music', 'Drama', 'Dance'],
  },
  rme: {
    gr1: [
      'Values and behaviour',
      'Family and community',
      'Rights and responsibilities',
      'Festivals and celebrations',
      'Respect and caring for others',
    ],
    gr2: [
      'Values and ethics',
      'Responsibility',
      'Community and cultural awareness',
      'Religious stories and celebrations',
    ],
    gr3: [
      'Values and ethics',
      'Responsibility and citizenship',
      'Respect for others',
      'Cultural and religious awareness',
    ],
  },
  pe: {
    gr1: [
      'Fitness and exercise',
      'Running, jumping, throwing',
      'Games and sports skills',
      'Coordination and movement skills',
    ],
    gr2: ['Fitness', 'Coordination and movement', 'Sports skills', 'Traditional games'],
    gr3: [
      'Fitness activities',
      'Team games',
      'Movement and coordination',
      'Sports skills development',
    ],
  },
};

function primarySubject(
  partial: Omit<SubjectOption, 'grades' | 'topicsByGrade'> & {
    id: keyof typeof PRIMARY_TOPICS;
    category: SubjectCategory;
  }
): SubjectOption {
  return {
    ...partial,
    grades: [...JUNIOR_PRIMARY_GRADES],
    topicsByGrade: PRIMARY_TOPICS[partial.id],
  };
}

/** Grade 1–3 subjects (Namibian junior primary syllabus). */
export const PRIMARY_SUBJECTS: SubjectOption[] = [
  primarySubject({
    id: 'l1',
    name: 'First Language (L1)',
    code: 'L1',
    category: 'Languages',
    icon: '🗣️',
    namibianImage:
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Mother-tongue literacy & Namibian languages',
    accentColor: '#B45309',
    gradientColors: ['#78350F', '#D97706'],
    availableMaterialsCount: 12,
  }),
  primarySubject({
    id: 'l2',
    name: 'English Second Language (L2)',
    code: 'ENG-L2',
    category: 'Languages',
    icon: '📖',
    namibianImage:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'English communication for young learners',
    accentColor: '#0369A1',
    gradientColors: ['#075985', '#0284C7'],
    availableMaterialsCount: 12,
  }),
  primarySubject({
    id: 'math_p',
    name: 'Mathematics',
    code: 'MATH',
    category: 'Sciences',
    icon: '🔢',
    namibianImage:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Numbers, shapes & everyday problem solving',
    accentColor: '#002B7F',
    gradientColors: ['#002B7F', '#1E40AF'],
    availableMaterialsCount: 14,
  }),
  primarySubject({
    id: 'enviro',
    name: 'Environmental Studies',
    code: 'ENV',
    category: 'Sciences',
    icon: '🌿',
    namibianImage:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Family, community, nature & basic science',
    accentColor: '#059669',
    gradientColors: ['#064E3B', '#059669'],
    availableMaterialsCount: 14,
  }),
  primarySubject({
    id: 'arts',
    name: 'Arts',
    code: 'ARTS',
    category: 'Arts',
    icon: '🎨',
    namibianImage:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Visual art, music, drama & dance',
    accentColor: '#DB2777',
    gradientColors: ['#9D174D', '#DB2777'],
    availableMaterialsCount: 10,
  }),
  primarySubject({
    id: 'rme',
    name: 'Religious and Moral Education',
    code: 'RME',
    category: 'Life Skills',
    icon: '🕊️',
    namibianImage:
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Values, respect & community living',
    accentColor: '#7C3AED',
    gradientColors: ['#5B21B6', '#7C3AED'],
    availableMaterialsCount: 10,
  }),
  primarySubject({
    id: 'pe',
    name: 'Physical Education',
    code: 'PE',
    category: 'Life Skills',
    icon: '⚽',
    namibianImage:
      'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Fitness, games & movement skills',
    accentColor: '#D21034',
    gradientColors: ['#9F1239', '#E11D48'],
    availableMaterialsCount: 8,
  }),
];
