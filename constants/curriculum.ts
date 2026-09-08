export interface GradeOption {
  id: string;
  name: string;
  phase: string;
  icon: string;
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
  category: 'Sciences' | 'Languages' | 'Commercials' | 'Humanities';
  icon: string;
  namibianImage: string;
  namibianContext: string;
  accentColor: string;
  gradientColors: [string, string];
  availableMaterialsCount: number;
}

export const GRADE_OPTIONS: GradeOption[] = [
  { id: 'gr12', name: 'Grade 12 (NSSCAS)', phase: 'Advanced Subsidiary Level', icon: '🎓' },
  { id: 'gr11', name: 'Grade 11 (NSSCO)', phase: 'Ordinary Level', icon: '📚' },
  { id: 'gr10', name: 'Grade 10', phase: 'Senior Secondary', icon: '📖' },
  { id: 'gr9', name: 'Grade 9', phase: 'Junior Secondary', icon: '📐' },
  { id: 'gr8', name: 'Grade 8', phase: 'Junior Secondary', icon: '🎒' },
  { id: 'primary', name: 'Primary (Grades 1 – 7)', phase: 'Primary Education', icon: '✏️' },
];

export const CURRICULUM_SUBJECTS: SubjectOption[] = [
  // Sciences & Tech
  {
    id: 'math',
    name: 'Mathematics',
    code: 'MATH',
    category: 'Sciences',
    icon: '📐',
    namibianImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Namib Solar Arrays & Applied Geometry',
    accentColor: '#002B7F',
    gradientColors: ['#002B7F', '#1E40AF'],
    availableMaterialsCount: 36,
  },
  {
    id: 'phys',
    name: 'Physical Science',
    code: 'PHYS',
    category: 'Sciences',
    icon: '⚗️',
    namibianImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Khomas H.E.S.S. Observatory & Clean Energy',
    accentColor: '#4338CA',
    gradientColors: ['#1E1B4B', '#3730A3'],
    availableMaterialsCount: 28,
  },
  {
    id: 'bio',
    name: 'Biology / Life Science',
    code: 'BIO',
    category: 'Sciences',
    icon: '🔬',
    namibianImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Etosha National Park & Living Flora',
    accentColor: '#009A44',
    gradientColors: ['#064E3B', '#047857'],
    availableMaterialsCount: 32,
  },
  {
    id: 'agri',
    name: 'Agricultural Science',
    code: 'AGRI',
    category: 'Sciences',
    icon: '🌾',
    namibianImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Kavango Green Scheme & Omaheke Cattle Country',
    accentColor: '#15803D',
    gradientColors: ['#14532D', '#16A34A'],
    availableMaterialsCount: 22,
  },
  {
    id: 'cs',
    name: 'Computer Studies',
    code: 'CS',
    category: 'Sciences',
    icon: '💻',
    namibianImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Windhoek Tech Innovation & Digital Namibia',
    accentColor: '#0284C7',
    gradientColors: ['#0C4A6E', '#0284C7'],
    availableMaterialsCount: 19,
  },

  // Languages
  {
    id: 'eng2',
    name: 'English Second Language',
    code: 'ENG-2',
    category: 'Languages',
    icon: '📖',
    namibianImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'UNAM & NUST Central Academic Libraries',
    accentColor: '#0369A1',
    gradientColors: ['#075985', '#0284C7'],
    availableMaterialsCount: 45,
  },
  {
    id: 'eng1',
    name: 'English First Language',
    code: 'ENG-1',
    category: 'Languages',
    icon: '📘',
    namibianImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'National Archives & Namibian Literature',
    accentColor: '#1D4ED8',
    gradientColors: ['#1E3A8A', '#2563EB'],
    availableMaterialsCount: 30,
  },
  {
    id: 'oshk',
    name: 'Oshikwanyama',
    code: 'OSHK',
    category: 'Languages',
    icon: '🗣️',
    namibianImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Northern Makalani Plains & Cultural Roots',
    accentColor: '#B45309',
    gradientColors: ['#78350F', '#D97706'],
    availableMaterialsCount: 20,
  },
  {
    id: 'oshn',
    name: 'Oshindonga',
    code: 'OSHN',
    category: 'Languages',
    icon: '🗣️',
    namibianImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Owambo Heritage & Traditional Knowledge',
    accentColor: '#B45309',
    gradientColors: ['#78350F', '#B45309'],
    availableMaterialsCount: 20,
  },
  {
    id: 'afr',
    name: 'Afrikaans',
    code: 'AFR',
    category: 'Languages',
    icon: '🗣️',
    namibianImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Swakopmund Coast & Atlantic Shoreline',
    accentColor: '#0F766E',
    gradientColors: ['#134E4A', '#0D9488'],
    availableMaterialsCount: 24,
  },
  {
    id: 'her',
    name: 'Otjiherero',
    code: 'HER',
    category: 'Languages',
    icon: '🗣️',
    namibianImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Central Plateau & Historical Monuments',
    accentColor: '#D21034',
    gradientColors: ['#881337', '#BE123C'],
    availableMaterialsCount: 18,
  },
  {
    id: 'sil',
    name: 'Silozi / Rukwangali',
    code: 'LANG',
    category: 'Languages',
    icon: '🗣️',
    namibianImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Zambezi River Basin & Okavango Waterways',
    accentColor: '#0E7490',
    gradientColors: ['#164E63', '#0891B2'],
    availableMaterialsCount: 16,
  },

  // Commercials
  {
    id: 'acc',
    name: 'Accounting',
    code: 'ACC',
    category: 'Commercials',
    icon: '📑',
    namibianImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Windhoek Financial District & Auditing',
    accentColor: '#334155',
    gradientColors: ['#0F172A', '#334155'],
    availableMaterialsCount: 26,
  },
  {
    id: 'econ',
    name: 'Economics',
    code: 'ECON',
    category: 'Commercials',
    icon: '📈',
    namibianImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Bank of Namibia & Port of Walvis Bay',
    accentColor: '#B45309',
    gradientColors: ['#78350F', '#D97706'],
    availableMaterialsCount: 24,
  },
  {
    id: 'bus',
    name: 'Business Studies',
    code: 'BUS',
    category: 'Commercials',
    icon: '💼',
    namibianImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Independence Avenue Corporate Commercial Hubs',
    accentColor: '#002B7F',
    gradientColors: ['#1E3A8A', '#1D4ED8'],
    availableMaterialsCount: 23,
  },
  {
    id: 'ent',
    name: 'Entrepreneurship',
    code: 'ENT',
    category: 'Commercials',
    icon: '💡',
    namibianImage: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Katutura Enterprise & Namibian Youth Innovation',
    accentColor: '#D21034',
    gradientColors: ['#991B1B', '#DC2626'],
    availableMaterialsCount: 17,
  },

  // Humanities
  {
    id: 'geo',
    name: 'Geography',
    code: 'GEO',
    category: 'Humanities',
    icon: '🌍',
    namibianImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Sossusvlei Red Dunes & Fish River Canyon',
    accentColor: '#C2410C',
    gradientColors: ['#7C2D12', '#C2410C'],
    availableMaterialsCount: 34,
  },
  {
    id: 'hist',
    name: 'History',
    code: 'HIST',
    category: 'Humanities',
    icon: '🏛️',
    namibianImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Twyfelfontein UNESCO Rock Art & Heroes Acre',
    accentColor: '#854D0E',
    gradientColors: ['#713F12', '#A16207'],
    availableMaterialsCount: 29,
  },
  {
    id: 'dev',
    name: 'Development Studies',
    code: 'DEV',
    category: 'Humanities',
    icon: '🌱',
    namibianImage: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=900&q=80',
    namibianContext: 'Community Conservancies & Rural Development',
    accentColor: '#009A44',
    gradientColors: ['#065F46', '#059669'],
    availableMaterialsCount: 21,
  },
];

export function getSubjectById(id: string): SubjectOption | undefined {
  return CURRICULUM_SUBJECTS.find((sub) => sub.id === id);
}
