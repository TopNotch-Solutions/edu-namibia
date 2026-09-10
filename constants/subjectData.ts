// Rich study data for Namibian curriculum subjects

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
}

export interface ContentModule {
  id: string;
  unitNumber: number;
  unitTitle: string;
  curriculumLevel: string; // e.g. 'JS / NSSCO Unit 2'
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
  /** Groups questions into multiple quizzes under one topic */
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

export const PHYSICAL_SCIENCE_DATA: SubjectStudyData = {
  subjectId: 'phys',
  modules: [
    {
      id: 'mod-1',
      unitNumber: 1,
      unitTitle: 'Topic 1: Mechanics, Motion & Force',
      curriculumLevel: 'JS / NSSCO Unit 1',
      subtopicsCount: 3,
      estimatedHours: '2.5 hrs',
      subtopics: [
        {
          id: 'sub-1-1',
          title: 'Speed, Velocity & Acceleration',
          durationMinutes: 4,
          completed: true,
          conceptSummary:
            'Speed is a scalar quantity denoting distance over time (s = d/t). Velocity is speed with a specified direction (vector). Acceleration is the rate of change of velocity (a = (v - u) / t).',
          workedExample: {
            problem: 'A car travelling along the B1 highway accelerates uniformly from 15 m/s to 35 m/s in 8.0 seconds. Calculate its acceleration and the distance covered.',
            given: ['Initial velocity (u) = 15 m/s', 'Final velocity (v) = 35 m/s', 'Time (t) = 8.0 s'],
            steps: [
              'Formula: a = (v - u) / t',
              'Calculation: a = (35 - 15) / 8.0 = 20 / 8.0 = 2.5 m/s²',
              'Distance formula: s = ut + ½at²',
              'Calculation: s = (15 × 8.0) + ½(2.5 × 64) = 120 + 80 = 200 m',
            ],
            answer: 'Acceleration = 2.5 m/s² (in direction of motion); Distance = 200 m',
          },
          examTip:
            'Common JS/NSSCO exam mistake: Forgetting to square time (t²) in the kinematic equation s = ut + ½at² or omitting units (m/s²).',
          diagramTitle: 'Velocity-Time Graph Interpretation',
          diagramConcept: 'Gradient = Acceleration; Area under curve = Total Distance travelled.',
        },
        {
          id: 'sub-1-2',
          title: "Newton's Laws of Motion in Action",
          durationMinutes: 5,
          conceptSummary:
            "1st Law: An object remains at rest or constant velocity unless acted upon by a net resultant force. 2nd Law: F_net = m × a. 3rd Law: For every action, there is an equal and opposite reaction.",
          workedExample: {
            problem: 'A heavy crate of 45 kg is pushed on a flat school laboratory surface with a force of 180 N against a friction force of 45 N. Find the crate acceleration.',
            given: ['Mass (m) = 45 kg', 'Applied force (F) = 180 N', 'Frictional force (f) = 45 N'],
            steps: [
              'Net force: F_net = F_applied - f_friction = 180 - 45 = 135 N',
              'Formula: a = F_net / m',
              'Calculation: a = 135 / 45 = 3.0 m/s²',
            ],
            answer: 'Acceleration = 3.0 m/s² forward',
          },
          examTip:
            'Examiners always look for the word "RESULTANT" or "NET" force when asking for Newton’s Second Law statement.',
        },
        {
          id: 'sub-1-3',
          title: 'Work, Kinetic Energy & Power',
          durationMinutes: 4,
          conceptSummary:
            'Work done is force multiplied by distance moved in the direction of the force (W = F × d, in Joules). Power is work done per unit time (P = W / t, in Watts). Kinetic Energy = ½mv².',
          examTip:
            'Always verify if work is done against gravity (W = mgh). In past NSSCO papers, mass is often given in grams—always convert to kg first!',
        },
      ],
    },
    {
      id: 'mod-2',
      unitNumber: 2,
      unitTitle: 'Topic 2: Stoichiometry & The Mole Concept',
      curriculumLevel: 'JS / NSSCO Unit 2',
      subtopicsCount: 4,
      estimatedHours: '3.0 hrs',
      subtopics: [
        {
          id: 'sub-2-1',
          title: 'The Mole, Molar Mass & Avogadro Constant',
          durationMinutes: 5,
          conceptSummary:
            'One mole is the amount of substance containing 6.022 × 10²³ particles (atoms, molecules, or ions). Number of moles n = m / M, where m is mass in grams and M is molar mass (g/mol).',
          workedExample: {
            problem: 'Calculate the number of moles present in 11.7 g of sodium chloride (NaCl). (A_r: Na = 23.0, Cl = 35.5).',
            given: ['Mass (m) = 11.7 g', 'M_r of NaCl = 23.0 + 35.5 = 58.5 g/mol'],
            steps: [
              'Formula: n = m / M',
              'Calculation: n = 11.7 g / 58.5 g/mol',
              'Evaluate: n = 0.200 mol',
            ],
            answer: '0.20 mol of NaCl (or 0.2 mol)',
          },
          examTip:
            'Common NSSCO exam pitfall: Forgetting that diatomic gases like O₂, Cl₂, and N₂ have double molar masses (e.g. O₂ = 32 g/mol, not 16 g/mol)!',
          diagramTitle: 'The Central Mole Conversion Hub',
          diagramConcept: 'Grams ↔ (÷/× Molar Mass) ↔ Moles ↔ (×/÷ 24 dm³) ↔ Gas Volume',
        },
        {
          id: 'sub-2-2',
          title: 'Molar Gas Volume at r.t.p. (24 dm³)',
          durationMinutes: 4,
          conceptSummary:
            'At room temperature and pressure (r.t.p. 25°C and 1 atm), one mole of any gas occupies a volume of 24.0 dm³ (or 24,000 cm³). Volume = moles × 24.0 dm³.',
          workedExample: {
            problem: 'Find the volume of carbon dioxide (CO₂) gas produced when 5.0 g of calcium carbonate reacts completely with excess hydrochloric acid at r.t.p. (CaCO₃ → CO₂ + ...; M_r of CaCO₃ = 100).',
            given: ['Mass of CaCO₃ = 5.0 g', 'Molar mass of CaCO₃ = 100 g/mol', 'Mole ratio CaCO₃ : CO₂ = 1 : 1'],
            steps: [
              'Moles of CaCO₃: n = 5.0 / 100 = 0.05 mol',
              'From stoichiometry: moles of CO₂ = 0.05 mol',
              'Volume of CO₂ at r.t.p.: V = n × 24.0 dm³ = 0.05 × 24.0 = 1.20 dm³ (or 1200 cm³)',
            ],
            answer: 'Volume of CO₂ = 1.2 dm³ (1200 cm³)',
          },
          examTip:
            'Check units requested! If the question asks for cm³, multiply dm³ by 1000. 1 dm³ = 1000 cm³.',
        },
        {
          id: 'sub-2-3',
          title: 'Solution Concentrations & Titration Calculations',
          durationMinutes: 5,
          conceptSummary:
            'Concentration (c) is the amount of solute in moles per volume of solution in dm³: c = n / V (mol/dm³). Concentration in g/dm³ = c(mol/dm³) × M_r.',
          examTip:
            'In volumetric analysis titrations, average only the concordant titres (within 0.10 cm³ of each other) to obtain full marks.',
        },
        {
          id: 'sub-2-4',
          title: 'Empirical & Molecular Formula Determination',
          durationMinutes: 4,
          conceptSummary:
            'The empirical formula is the simplest whole number ratio of atoms in a compound. The molecular formula shows actual numbers of each atom: (Empirical Formula)_x = Molecular Mass.',
          examTip:
            'Always divide percentages by each element’s relative atomic mass FIRST before dividing through by the smallest value.',
        },
      ],
    },
    {
      id: 'mod-3',
      unitNumber: 3,
      unitTitle: 'Topic 3: Acids, Bases, Salts & Qualitative Analysis',
      curriculumLevel: 'JS / NSSCO Unit 3',
      subtopicsCount: 3,
      estimatedHours: '2.0 hrs',
      subtopics: [
        {
          id: 'sub-3-1',
          title: 'Properties of Acids and Alkalis & pH Scale',
          durationMinutes: 4,
          conceptSummary:
            'Acids produce H⁺ ions in aqueous solutions (pH < 7). Alkalis produce OH⁻ ions (pH > 7). Acid + Base → Salt + Water. Acid + Metal → Salt + Hydrogen gas.',
          examTip:
            'Test for Hydrogen gas: Burns with a squeaky pop. Test for Oxygen: Relights a glowing splint. Test for Carbon dioxide: Turns limewater milky.',
        },
        {
          id: 'sub-3-2',
          title: 'Cation and Anion Identification Tests (Paper 3 Guide)',
          durationMinutes: 5,
          conceptSummary:
            'Testing with aqueous NaOH and aqueous NH₃: Cu²⁺ gives light blue precipitate; Fe²⁺ gives dirty green precipitate; Fe³⁺ gives red-brown precipitate; Zn²⁺ white precipitate soluble in excess.',
          examTip:
            'Crucial for Alternative to Practical (Paper 3): Always specify "white precipitate insoluble in excess" rather than just "white".',
        },
      ],
    },
    {
      id: 'mod-4',
      unitNumber: 4,
      unitTitle: 'Topic 4: Electricity, Magnetism & Clean Energy',
      curriculumLevel: 'JS / NSSCO Unit 4',
      subtopicsCount: 3,
      estimatedHours: '2.5 hrs',
      subtopics: [
        {
          id: 'sub-4-1',
          title: "Ohm's Law, Resistance & Circuit Configurations",
          durationMinutes: 5,
          conceptSummary:
            "V = I × R. In series: Current is equal everywhere, resistances add up (R_total = R₁ + R₂). In parallel: Voltage across branches is equal, 1/R_total = 1/R₁ + 1/R₂.",
          examTip:
            'In parallel circuits, adding more resistors reduces the total effective resistance of the circuit.',
        },
        {
          id: 'sub-4-2',
          title: 'Solar Energy & Renewable Power in Namibia',
          durationMinutes: 4,
          conceptSummary:
            'Namibia has among the highest solar irradiance in the world (>300 sunny days/year). Photovoltaic (PV) cells convert light photons directly into electrical potential energy.',
          examTip:
            'NSSCO examiners frequently include real-world contextual questions regarding Ruacana hydroelectric and Southern Namib solar installations.',
        },
      ],
    },
  ],

  quizQuestions: {
    topicPractice: [
      {
        id: 'q-tp-1',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Mole Basics',
        question: 'What is the mass of 0.5 moles of Calcium Carbonate (CaCO₃)? [Ca = 40, C = 12, O = 16]',
        options: ['100 g', '50 g', '25 g', '200 g'],
        correctIndex: 1,
        explanation: 'Molar mass of CaCO₃ = 40 + 12 + (3 × 16) = 100 g/mol. Mass = moles × molar mass = 0.5 × 100 = 50 g.',
      },
      {
        id: 'q-tp-1b',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Mole Basics',
        question: 'How many moles are present in 36 g of water (H₂O)? [H = 1, O = 16]',
        options: ['1.0 mol', '2.0 mol', '0.5 mol', '18 mol'],
        correctIndex: 1,
        explanation: 'Molar mass of H₂O = 18 g/mol. Moles = mass / Mr = 36 / 18 = 2.0 mol.',
      },
      {
        id: 'q-tp-1c',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Mole Basics',
        question: 'What volume does 0.25 mol of an ideal gas occupy at r.t.p.?',
        options: ['6.0 dm³', '22.4 dm³', '24.0 dm³', '12.0 dm³'],
        correctIndex: 0,
        explanation: 'At r.t.p., 1 mol occupies 24.0 dm³. Volume = 0.25 × 24.0 = 6.0 dm³.',
      },
      {
        id: 'q-tp-1d',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Calculations',
        question: 'How many atoms are in 0.5 mol of helium? (N_A = 6.02 × 10²³)',
        options: ['3.01 × 10²³', '6.02 × 10²³', '1.204 × 10²⁴', '0.5'],
        correctIndex: 0,
        explanation: 'Number of atoms = moles × N_A = 0.5 × 6.02 × 10²³ = 3.01 × 10²³.',
      },
      {
        id: 'q-tp-1e',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Calculations',
        question: 'What is the concentration when 0.20 mol solute is dissolved in 0.50 dm³ solution?',
        options: ['0.10 mol/dm³', '0.40 mol/dm³', '0.20 mol/dm³', '2.5 mol/dm³'],
        correctIndex: 1,
        explanation: 'Concentration = n / V = 0.20 / 0.50 = 0.40 mol/dm³.',
      },
      {
        id: 'q-tp-1f',
        topic: 'Stoichiometry & Mole',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Calculations',
        question: 'Empirical formula of a compound with 40% C, 6.7% H, 53.3% O by mass? [C=12, H=1, O=16]',
        options: ['CH₂O', 'C₂H₄O', 'CH₄O', 'C₂H₆O'],
        correctIndex: 0,
        explanation: 'Moles C:H:O ≈ 3.33 : 6.7 : 3.33 → ratio 1:2:1 → CH₂O.',
      },
      {
        id: 'q-tp-2',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Graphs',
        question: 'Which of the following is represented by the gradient of a velocity-time graph?',
        options: ['Total Distance', 'Instantaneous Speed', 'Acceleration', 'Work Done'],
        correctIndex: 2,
        explanation: 'Gradient = Δv / Δt, which is acceleration.',
      },
      {
        id: 'q-tp-2b',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Graphs',
        question: 'A car accelerates from 15 m/s to 35 m/s in 8.0 s. What is its acceleration?',
        options: ['2.5 m/s²', '5.0 m/s²', '20 m/s²', '1.25 m/s²'],
        correctIndex: 0,
        explanation: 'a = (v − u) / t = (35 − 15) / 8.0 = 2.5 m/s².',
      },
      {
        id: 'q-tp-2c',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Graphs',
        question: 'What quantity is given by the area under a velocity-time graph?',
        options: ['Acceleration', 'Force', 'Displacement / distance', 'Momentum'],
        correctIndex: 2,
        explanation: 'Area under a v–t graph equals displacement (or distance if direction is ignored).',
      },
      {
        id: 'q-tp-2d',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Forces',
        question: 'What is the weight of a 5.0 kg mass near Earth? (g = 10 m/s²)',
        options: ['5.0 N', '50 N', '0.5 N', '500 N'],
        correctIndex: 1,
        explanation: 'W = mg = 5.0 × 10 = 50 N.',
      },
      {
        id: 'q-tp-2e',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Forces',
        question: 'A force of 20 N acts on a 4.0 kg object. What is its acceleration?',
        options: ['5.0 m/s²', '80 m/s²', '0.2 m/s²', '24 m/s²'],
        correctIndex: 0,
        explanation: 'a = F / m = 20 / 4.0 = 5.0 m/s².',
      },
      {
        id: 'q-tp-2f',
        topic: 'Mechanics & Motion',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Forces',
        question: 'Which quantity is a vector?',
        options: ['Speed', 'Distance', 'Velocity', 'Time'],
        correctIndex: 2,
        explanation: 'Velocity has magnitude and direction; speed and distance are scalars.',
      },
      {
        id: 'q-tp-3',
        topic: 'Acids & Bases',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Reactions',
        question: 'Which gas is evolved when dilute hydrochloric acid reacts with magnesium ribbon?',
        options: ['Chlorine (Cl₂)', 'Oxygen (O₂)', 'Hydrogen (H₂)', 'Carbon Dioxide (CO₂)'],
        correctIndex: 2,
        explanation: 'Acid + reactive metal → salt + hydrogen.',
      },
      {
        id: 'q-tp-3b',
        topic: 'Acids & Bases',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Reactions',
        question: 'A solution with pH 3 is best described as:',
        options: ['Strongly alkaline', 'Neutral', 'Weakly acidic', 'Strongly acidic'],
        correctIndex: 3,
        explanation: 'pH around 1–3 indicates a strongly acidic solution.',
      },
      {
        id: 'q-tp-3c',
        topic: 'Acids & Bases',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Reactions',
        question: 'Which oxide reacts with both acids and alkalis?',
        options: ['Acidic oxide', 'Basic oxide', 'Amphoteric oxide', 'Neutral oxide'],
        correctIndex: 2,
        explanation: 'Amphoteric oxides (e.g. Al₂O₃, ZnO) react with both acids and bases.',
      },
      {
        id: 'q-tp-3d',
        topic: 'Acids & Bases',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Indicators',
        question: 'Universal indicator turns red in which type of solution?',
        options: ['Strong acid', 'Strong alkali', 'Neutral salt', 'Pure water'],
        correctIndex: 0,
        explanation: 'Red indicates strongly acidic conditions on the universal indicator scale.',
      },
      {
        id: 'q-tp-3e',
        topic: 'Acids & Bases',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Indicators',
        question: 'What is formed when an acid reacts with a base?',
        options: ['Salt and water', 'Only hydrogen', 'Only oxygen', 'Metal and acid'],
        correctIndex: 0,
        explanation: 'Neutralisation: acid + base → salt + water.',
      },
      {
        id: 'q-tp-3f',
        topic: 'Acids & Bases',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Indicators',
        question: 'Which ion is responsible for acidity in aqueous solutions?',
        options: ['OH⁻', 'H⁺ / H₃O⁺', 'Na⁺', 'Cl⁻'],
        correctIndex: 1,
        explanation: 'Acidity is due to hydrogen / hydronium ions in solution.',
      },
      {
        id: 'q-tp-4',
        topic: 'Electricity',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Circuits',
        question: 'Two 6.0 Ω resistors are connected in parallel. What is their combined equivalent resistance?',
        options: ['12.0 Ω', '6.0 Ω', '3.0 Ω', '1.5 Ω'],
        correctIndex: 2,
        explanation: '1/R = 1/6 + 1/6 ⇒ R = 3.0 Ω.',
      },
      {
        id: 'q-tp-4b',
        topic: 'Electricity',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Circuits',
        question: 'An appliance rated 2200 W runs on 220 V. What current does it draw?',
        options: ['0.10 A', '10.0 A', '22.0 A', '484 A'],
        correctIndex: 1,
        explanation: 'I = P / V = 2200 / 220 = 10.0 A.',
      },
      {
        id: 'q-tp-4c',
        topic: 'Electricity',
        quizId: 'quiz-1',
        quizTitle: 'Quiz 1 · Circuits',
        question: 'Which statement about series circuits is correct?',
        options: ['Current is the same through each component', 'Voltage is the same across each component', 'Total resistance is less than the smallest resistor', 'Current increases as more resistors are added'],
        correctIndex: 0,
        explanation: 'In series, current is constant throughout.',
      },
      {
        id: 'q-tp-4d',
        topic: 'Electricity',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Ohm’s Law',
        question: 'A 12 V battery drives 2.0 A through a resistor. What is the resistance?',
        options: ['6.0 Ω', '24 Ω', '10 Ω', '0.17 Ω'],
        correctIndex: 0,
        explanation: 'R = V / I = 12 / 2.0 = 6.0 Ω.',
      },
      {
        id: 'q-tp-4e',
        topic: 'Electricity',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Ohm’s Law',
        question: 'Three 3.0 Ω resistors in series have total resistance:',
        options: ['1.0 Ω', '3.0 Ω', '9.0 Ω', '0.33 Ω'],
        correctIndex: 2,
        explanation: 'Series: R_total = 3 + 3 + 3 = 9.0 Ω.',
      },
      {
        id: 'q-tp-4f',
        topic: 'Electricity',
        quizId: 'quiz-2',
        quizTitle: 'Quiz 2 · Ohm’s Law',
        question: 'Which device measures electric current?',
        options: ['Voltmeter', 'Ammeter', 'Ohmmeter only', 'Barometer'],
        correctIndex: 1,
        explanation: 'An ammeter measures current and is connected in series.',
      },
    ],
    competition: [
      {
        id: 'q-comp-1a',
        topic: 'National Challenge',
        quizId: 'round-1',
        quizTitle: 'Round 1 · Mole Sprint',
        question: 'What volume does 1 mole of any ideal gas occupy at room temperature and pressure (r.t.p.)?',
        options: ['22.4 dm³', '24.0 dm³', '10.0 dm³', '1000 cm³'],
        correctIndex: 1,
        explanation: 'Under r.t.p. conditions (25°C and 1 atm), molar gas volume is 24.0 dm³ (or 24,000 cm³).',
      },
      {
        id: 'q-comp-1b',
        topic: 'National Challenge',
        quizId: 'round-1',
        quizTitle: 'Round 1 · Mole Sprint',
        question: 'What is the mass of 0.25 mol of water (H₂O)? [H=1, O=16]',
        options: ['2.25 g', '4.5 g', '9.0 g', '18 g'],
        correctIndex: 1,
        explanation: 'Mr(H₂O)=18. Mass = 0.25 × 18 = 4.5 g.',
      },
      {
        id: 'q-comp-1c',
        topic: 'National Challenge',
        quizId: 'round-1',
        quizTitle: 'Round 1 · Mole Sprint',
        question: 'How many moles are in 12 g of carbon-12?',
        options: ['0.5 mol', '1.0 mol', '2.0 mol', '12 mol'],
        correctIndex: 1,
        explanation: 'Moles = mass / Mr = 12 / 12 = 1.0 mol.',
      },
      {
        id: 'q-comp-2a',
        topic: 'National Challenge',
        quizId: 'round-2',
        quizTitle: 'Round 2 · Forces & Motion',
        question: 'What is the SI unit of electric current?',
        options: ['Volt (V)', 'Ohm (Ω)', 'Ampere (A)', 'Watt (W)'],
        correctIndex: 2,
        explanation: 'Electric current is measured in Amperes (A).',
      },
      {
        id: 'q-comp-2b',
        topic: 'National Challenge',
        quizId: 'round-2',
        quizTitle: 'Round 2 · Forces & Motion',
        question: 'What is the value of g near Earth’s surface used in NSSCO?',
        options: ['9.8 m/s² (or 10 m/s²)', '3.0 × 10⁸ m/s', '6.67 × 10⁻¹¹ N', '1.6 × 10⁻¹⁹ C'],
        correctIndex: 0,
        explanation: 'In NSSCO / JS curriculum, g is taken as 9.8 m/s² or rounded to 10 m/s².',
      },
      {
        id: 'q-comp-2c',
        topic: 'National Challenge',
        quizId: 'round-2',
        quizTitle: 'Round 2 · Forces & Motion',
        question: 'A force of 10 N acts on a 2.0 kg mass. Acceleration is:',
        options: ['5.0 m/s²', '20 m/s²', '0.2 m/s²', '12 m/s²'],
        correctIndex: 0,
        explanation: 'a = F/m = 10/2.0 = 5.0 m/s².',
      },
      {
        id: 'q-comp-3a',
        topic: 'National Challenge',
        quizId: 'round-3',
        quizTitle: 'Round 3 · Chemistry Spot',
        question: 'Which precipitate forms when aqueous NaOH is added to copper(II) sulfate?',
        options: ['Light blue precipitate', 'Dirty green precipitate', 'Reddish-brown precipitate', 'White precipitate'],
        correctIndex: 0,
        explanation: 'Cu²⁺ forms light blue Cu(OH)₂ precipitate.',
      },
      {
        id: 'q-comp-3b',
        topic: 'National Challenge',
        quizId: 'round-3',
        quizTitle: 'Round 3 · Chemistry Spot',
        question: 'Which gas turns limewater milky?',
        options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'],
        correctIndex: 2,
        explanation: 'CO₂ forms insoluble calcium carbonate in limewater.',
      },
      {
        id: 'q-comp-3c',
        topic: 'National Challenge',
        quizId: 'round-3',
        quizTitle: 'Round 3 · Chemistry Spot',
        question: 'Acid + alkali →',
        options: ['Salt + water', 'Salt + hydrogen only', 'Metal + acid', 'Only water'],
        correctIndex: 0,
        explanation: 'Neutralisation produces a salt and water.',
      },
    ],
    pastPapers: [
      {
        id: 'q-pp-2024-1a',
        year: '2024',
        paper: 'Paper 1',
        topic: 'NSSCO 2024',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'A learner dissolves 4.0 g of sodium hydroxide (NaOH) in water to make 250 cm³ of solution. What is the concentration in mol/dm³? [M_r of NaOH = 40.0]',
        options: ['0.10 mol/dm³', '0.25 mol/dm³', '0.40 mol/dm³', '1.00 mol/dm³'],
        correctIndex: 2,
        explanation: 'Moles = 4.0/40.0 = 0.10. Volume = 0.250 dm³. Concentration = 0.10/0.250 = 0.40 mol/dm³.',
      },
      {
        id: 'q-pp-2024-1b',
        year: '2024',
        paper: 'Paper 1',
        topic: 'NSSCO 2024',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'Which particle has a relative mass of approximately 1 and a charge of +1?',
        options: ['Electron', 'Neutron', 'Proton', 'Photon'],
        correctIndex: 2,
        explanation: 'A proton has relative mass ≈ 1 and charge +1.',
      },
      {
        id: 'q-pp-2024-1c',
        year: '2024',
        paper: 'Paper 1',
        topic: 'NSSCO 2024',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'What is the SI unit of energy?',
        options: ['Newton', 'Joule', 'Watt', 'Pascal'],
        correctIndex: 1,
        explanation: 'Energy is measured in joules (J).',
      },
      {
        id: 'q-pp-2024-2a',
        year: '2024',
        paper: 'Paper 2',
        topic: 'NSSCO 2024',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Calculate the kinetic energy of a 2.0 kg object moving at 3.0 m/s. (KE = ½mv²)',
        options: ['3.0 J', '6.0 J', '9.0 J', '18 J'],
        correctIndex: 2,
        explanation: 'KE = ½ × 2.0 × 9.0 = 9.0 J.',
      },
      {
        id: 'q-pp-2024-2b',
        year: '2024',
        paper: 'Paper 2',
        topic: 'NSSCO 2024',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Which gas turns limewater milky?',
        options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Nitrogen'],
        correctIndex: 2,
        explanation: 'CO₂ reacts with limewater to form insoluble calcium carbonate.',
      },
      {
        id: 'q-pp-2024-2c',
        year: '2024',
        paper: 'Paper 2',
        topic: 'NSSCO 2024',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'In a series circuit with three identical bulbs, what happens if one bulb blows?',
        options: ['All bulbs go out', 'The other two stay lit', 'Current doubles', 'Voltage becomes zero only across the blown bulb'],
        correctIndex: 0,
        explanation: 'Series circuit path is broken if one component fails, so all go out.',
      },
      {
        id: 'q-pp-2023-1a',
        year: '2023',
        paper: 'Paper 1',
        topic: 'NSSCO 2023',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'Which statement correctly defines an isotope of an element?',
        options: ['Atoms with same nucleon number but different proton numbers', 'Atoms of the same element having same proton number but different neutron numbers', 'Molecules with identical molecular mass but different structural formulas', 'Ions with differing electric charges'],
        correctIndex: 1,
        explanation: 'Isotopes have the same proton number but different neutron numbers.',
      },
      {
        id: 'q-pp-2023-1b',
        year: '2023',
        paper: 'Paper 1',
        topic: 'NSSCO 2023',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'What is the relative formula mass of H₂SO₄? [H=1, S=32, O=16]',
        options: ['49', '66', '98', '82'],
        correctIndex: 2,
        explanation: 'Mr = (2×1) + 32 + (4×16) = 98.',
      },
      {
        id: 'q-pp-2023-1c',
        year: '2023',
        paper: 'Paper 1',
        topic: 'NSSCO 2023',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'Which graph has a constant gradient equal to acceleration?',
        options: ['Distance-time graph for constant speed', 'Velocity-time graph for constant acceleration', 'Force-extension for a spring beyond elastic limit', 'Temperature-time during melting only'],
        correctIndex: 1,
        explanation: 'Gradient of a v–t graph is acceleration.',
      },
      {
        id: 'q-pp-2023-2a',
        year: '2023',
        paper: 'Paper 2',
        topic: 'NSSCO 2023',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'A current of 0.50 A flows for 40 s. How much charge passes a point in the circuit? (Q = It)',
        options: ['0.0125 C', '20 C', '80 C', '20.5 C'],
        correctIndex: 1,
        explanation: 'Q = 0.50 × 40 = 20 C.',
      },
      {
        id: 'q-pp-2023-2b',
        year: '2023',
        paper: 'Paper 2',
        topic: 'NSSCO 2023',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Which ion causes a blue flame colour in a flame test?',
        options: ['Na⁺', 'Cu²⁺', 'K⁺', 'Ca²⁺'],
        correctIndex: 1,
        explanation: 'Copper(II) ions give a blue-green / blue flame.',
      },
      {
        id: 'q-pp-2023-2c',
        year: '2023',
        paper: 'Paper 2',
        topic: 'NSSCO 2023',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Power of a device is 60 W. Energy transferred in 2.0 minutes is:',
        options: ['30 J', '120 J', '7200 J', '3600 J'],
        correctIndex: 2,
        explanation: 'E = P t = 60 × 120 = 7200 J.',
      },
      {
        id: 'q-pp-2022-1a',
        year: '2022',
        paper: 'Paper 1',
        topic: 'NSSCO 2022',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'An electric kettle is rated at 2200 W and operates on a 220 V Namibian mains supply. What current flows through the heating element?',
        options: ['0.10 A', '10.0 A', '22.0 A', '484 A'],
        correctIndex: 1,
        explanation: 'I = P / V = 2200 / 220 = 10.0 A.',
      },
      {
        id: 'q-pp-2022-1b',
        year: '2022',
        paper: 'Paper 1',
        topic: 'NSSCO 2022',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'Which process separates crude oil into useful fractions?',
        options: ['Filtration', 'Fractional distillation', 'Chromatography only', 'Electrolysis'],
        correctIndex: 1,
        explanation: 'Fractional distillation separates mixtures by boiling point.',
      },
      {
        id: 'q-pp-2022-1c',
        year: '2022',
        paper: 'Paper 1',
        topic: 'NSSCO 2022',
        quizId: 'p1-set-a',
        quizTitle: 'Paper 1 · Set A',
        question: 'Density of an object of mass 40 g and volume 20 cm³ is:',
        options: ['0.5 g/cm³', '2.0 g/cm³', '20 g/cm³', '800 g/cm³'],
        correctIndex: 1,
        explanation: 'Density = m/V = 40/20 = 2.0 g/cm³.',
      },
      {
        id: 'q-pp-2022-2a',
        year: '2022',
        paper: 'Paper 2',
        topic: 'NSSCO 2022',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Which statement about magnets is correct?',
        options: ['Like poles attract', 'Unlike poles attract', 'North poles only exist alone', 'Magnetic field lines start at south poles'],
        correctIndex: 1,
        explanation: 'Unlike poles attract; like poles repel.',
      },
      {
        id: 'q-pp-2022-2b',
        year: '2022',
        paper: 'Paper 2',
        topic: 'NSSCO 2022',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'Neutralisation of HCl with NaOH produces:',
        options: ['NaCl and water', 'NaCl and hydrogen', 'Only water', 'Chlorine gas only'],
        correctIndex: 0,
        explanation: 'Acid + alkali → salt + water.',
      },
      {
        id: 'q-pp-2022-2c',
        year: '2022',
        paper: 'Paper 2',
        topic: 'NSSCO 2022',
        quizId: 'p2-set-a',
        quizTitle: 'Paper 2 · Set A',
        question: 'A wave has frequency 50 Hz and wavelength 2.0 m. Speed is:',
        options: ['25 m/s', '52 m/s', '100 m/s', '0.04 m/s'],
        correctIndex: 2,
        explanation: 'v = fλ = 50 × 2.0 = 100 m/s.',
      },
    ],
  },

  textbooks: [
    {
      id: 'tb-1',
      title: 'Physical Science for Senior Secondary (NSSCO/NSSCAS)',
      category: 'Approved Textbook',
      publisher: 'MoEAC & NIED Namibia',
      pages: 348,
      fileSize: '32.4 MB',
      isDownloaded: true,
      coverColor: '#002B7F',
      chapters: [
        { title: 'Chapter 1: Measurement & Experimental Techniques', page: 12 },
        { title: 'Chapter 2: Motion, Mass, Weight & Density', page: 44 },
        { title: 'Chapter 3: Forces, Momentum & Energy', page: 86 },
        { title: 'Chapter 4: The Particulate Nature of Matter', page: 128 },
        { title: 'Chapter 5: Stoichiometry & The Mole Concept', page: 164 },
        { title: 'Chapter 6: Acids, Bases, Oxides & Salts', page: 210 },
        { title: 'Chapter 7: Electricity, Magnetism & Solar Circuits', page: 270 },
      ],
    },
    {
      id: 'tb-2',
      title: 'Official NSSCO Physical Science Syllabus (Revised)',
      category: 'MoEAC Syllabus',
      publisher: 'National Institute for Educational Development (NIED)',
      pages: 76,
      fileSize: '4.8 MB',
      isDownloaded: true,
      coverColor: '#009A44',
      chapters: [
        { title: 'Aims & Assessment Objectives', page: 5 },
        { title: 'Physics Section Learning Competencies', page: 18 },
        { title: 'Chemistry Section Learning Competencies', page: 38 },
        { title: 'Alternative to Practical Guidelines (Paper 3)', page: 62 },
      ],
    },
    {
      id: 'tb-3',
      title: 'Namibian Learner Exam Revision & Calculations Guide',
      category: 'Learner Guide',
      publisher: 'Edu-Learning Namibia Open Resources',
      pages: 142,
      fileSize: '16.2 MB',
      isDownloaded: false,
      coverColor: '#D21034',
      chapters: [
        { title: 'Part 1: Master Stoichiometry in 7 Days', page: 8 },
        { title: 'Part 2: Kinematic Equations & Graphs Guide', page: 42 },
        { title: 'Part 3: Qualitative Analysis Table & Anion Tests', page: 88 },
        { title: 'Part 4: Common Exam Traps & Examiner Tips', page: 116 },
      ],
    },
    {
      id: 'tb-4',
      title: 'National Examination Archive (2018 – 2024 Question Papers & Memos)',
      category: 'Past Paper Archive',
      publisher: 'Directorate of National Examinations and Assessment (DNEA)',
      pages: 210,
      fileSize: '28.5 MB',
      isDownloaded: false,
      coverColor: '#7C3AED',
      chapters: [
        { title: '2024 NSSCO Paper 1, 2, 3 + Memos', page: 1 },
        { title: '2023 NSSCO Paper 1, 2, 3 + Memos', page: 35 },
        { title: '2022 NSSCO Paper 1, 2, 3 + Memos', page: 70 },
        { title: '2021 NSSCO Paper 1, 2, 3 + Memos', page: 105 },
        { title: '2020 NSSCO Paper 1, 2, 3 + Memos', page: 140 },
      ],
    },
  ],

  summaries: {
    formulas: [
      {
        name: 'The Mole Formula (Mass)',
        formula: 'n = m / M',
        variables: [
          { symbol: 'n', meaning: 'Number of moles', unit: 'mol' },
          { symbol: 'm', meaning: 'Mass of substance', unit: 'g (grams)' },
          { symbol: 'M', meaning: 'Molar mass of substance', unit: 'g/mol' },
        ],
        examCaution: 'Mass m MUST always be in grams. If given in kg, multiply by 1000 first!',
      },
      {
        name: 'Concentration of Solution',
        formula: 'c = n / V  or  c = m / (M × V)',
        variables: [
          { symbol: 'c', meaning: 'Molar concentration', unit: 'mol/dm³' },
          { symbol: 'n', meaning: 'Moles of solute', unit: 'mol' },
          { symbol: 'V', meaning: 'Volume of solution', unit: 'dm³' },
        ],
        examCaution: 'Volume V must be in dm³! If given in cm³, divide by 1000 (e.g. 250 cm³ = 0.25 dm³).',
      },
      {
        name: 'Kinematic Equations of Motion',
        formula: 'v = u + at   |   s = ut + ½at²   |   v² = u² + 2as',
        variables: [
          { symbol: 'u', meaning: 'Initial velocity', unit: 'm/s' },
          { symbol: 'v', meaning: 'Final velocity', unit: 'm/s' },
          { symbol: 'a', meaning: 'Acceleration', unit: 'm/s²' },
          { symbol: 's', meaning: 'Displacement / Distance', unit: 'm' },
          { symbol: 't', meaning: 'Time taken', unit: 's' },
        ],
        examCaution: 'When an object starts from rest, u = 0. When an object comes to a halt, v = 0.',
      },
      {
        name: "Newton's Second Law & Weight",
        formula: 'F_net = m × a   |   W = m × g',
        variables: [
          { symbol: 'F_net', meaning: 'Resultant net force', unit: 'N (Newtons)' },
          { symbol: 'm', meaning: 'Mass', unit: 'kg' },
          { symbol: 'a', meaning: 'Acceleration', unit: 'm/s²' },
          { symbol: 'W', meaning: 'Weight (gravitational force)', unit: 'N' },
          { symbol: 'g', meaning: 'Acceleration due to gravity', unit: '9.8 or 10 m/s²' },
        ],
        examCaution: 'Mass (kg) remains constant everywhere; weight (N) changes with gravity.',
      },
      {
        name: 'Electrical Ohm’s Law & Power',
        formula: 'V = I × R   |   P = V × I = I²R = V² / R',
        variables: [
          { symbol: 'V', meaning: 'Potential difference (Voltage)', unit: 'V (Volts)' },
          { symbol: 'I', meaning: 'Electric current', unit: 'A (Amperes)' },
          { symbol: 'R', meaning: 'Electrical resistance', unit: 'Ω (Ohms)' },
          { symbol: 'P', meaning: 'Electrical power', unit: 'W (Watts)' },
        ],
        examCaution: 'Ammeters are always connected in SERIES; Voltmeters are connected in PARALLEL.',
      },
    ],

    definitions: [
      {
        term: 'Mole (Avogadro’s definition)',
        definition: 'The amount of substance that contains as many elementary particles (atoms, molecules, or ions) as there are atoms in exactly 12 g of carbon-12.',
        keywordHighlight: 'elementary particles as in 12 g of carbon-12 (6.02 × 10²³)',
        examMarks: 2,
      },
      {
        term: 'Isotopes',
        definition: 'Atoms of the same element having the same number of protons but different numbers of neutrons.',
        keywordHighlight: 'same element, same protons, different neutrons',
        examMarks: 2,
      },
      {
        term: 'Acceleration',
        definition: 'The rate of change of velocity with respect to time.',
        keywordHighlight: 'rate of change of velocity',
        examMarks: 1,
      },
      {
        term: 'Acid',
        definition: 'A proton donor (or a compound that produces hydrogen ions H⁺ as the only positive ions in aqueous solution).',
        keywordHighlight: 'proton donor / produces H⁺ ions in water',
        examMarks: 1,
      },
      {
        term: 'Ohm’s Law',
        definition: 'Current flowing through a metallic conductor is directly proportional to the potential difference across it, provided temperature and other physical conditions remain constant.',
        keywordHighlight: 'directly proportional, provided temperature remains constant',
        examMarks: 2,
      },
    ],

    mindMaps: [
      {
        title: 'Stoichiometry Calculation Map',
        description: 'Complete visual roadmap linking Mass, Moles, Gas Volume, and Solution Concentration for NSSCO paper calculations.',
        tags: ['Chemistry', 'Calculations', 'High Yield'],
        nodeCount: 14,
      },
      {
        title: 'Mechanics & Force Flowchart',
        description: 'Visual breakdown from Newton’s laws to momentum, work, kinetic energy, and potential energy conservation.',
        tags: ['Physics', 'Forces', 'Kinematics'],
        nodeCount: 12,
      },
      {
        title: 'Qualitative Analysis Cations & Anions Decision Tree',
        description: 'Step-by-step decision flowchart to identify unknown salts in Paper 3 Alternative to Practical.',
        tags: ['Paper 3', 'Practical', 'Salts'],
        nodeCount: 18,
      },
    ],

    bulletSummaries: [
      {
        title: 'Stoichiometry Night-Before Cheat Sheet',
        examFrequency: 'High',
        points: [
          'Step 1: Write a balanced chemical equation before starting any calculations.',
          'Step 2: Convert given quantity (mass, volume, concentration) into moles: n = m/M or n = c × V.',
          'Step 3: Use the stoichiometric mole ratio from the balanced equation to find unknown moles.',
          'Step 4: Convert calculated moles to the requested unit (grams, dm³, or mol/dm³).',
          'Remember: 1 dm³ = 1000 cm³. Gas volume at r.t.p. is always 24 dm³ per mole.',
        ],
      },
      {
        title: 'Kinematics & Graph Interpretation Essentials',
        examFrequency: 'High',
        points: [
          'Distance-Time Graph: Gradient represents Speed. Horizontal flat line = object at rest.',
          'Velocity-Time Graph: Gradient represents Acceleration. Area under graph = Total Distance.',
          'Always check whether the vertical axis is Distance or Velocity before answering!',
          'Free fall in vacuum: all objects fall with identical acceleration g = 9.8 m/s² regardless of mass.',
          'Air resistance increases with speed until it equals weight (Terminal Velocity where a = 0).',
        ],
      },
      {
        title: 'Circuit Rules & Electric Power Quick Notes',
        examFrequency: 'Medium',
        points: [
          'Series Circuit: Current is identical throughout; total resistance R_total = R₁ + R₂ + ...',
          'Parallel Circuit: Voltage across each branch is identical; 1/R_total = 1/R₁ + 1/R₂.',
          'Power: P = V × I = I²R. Electrical energy used = Power (kW) × Time (hours).',
          'Fuses and circuit breakers are ALWAYS installed in the LIVE wire for electrical safety.',
        ],
      },
    ],
  },
};

// Generic subject study data builder for other subjects (Mathematics, Biology, English, etc.)
export function getSubjectStudyData(subjectId: string, subjectName: string, category: string): SubjectStudyData {
  if (subjectId === 'phys') {
    return PHYSICAL_SCIENCE_DATA;
  }

  // Generates subject-tailored curriculum modules & study content for any other subject
  return {
    subjectId,
    modules: [
      {
        id: `mod-${subjectId}-1`,
        unitNumber: 1,
        unitTitle: `Topic 1: Fundamental Principles of ${subjectName}`,
        curriculumLevel: 'Senior Secondary / NSSCO Unit 1',
        subtopicsCount: 3,
        estimatedHours: '2.5 hrs',
        subtopics: [
          {
            id: `sub-${subjectId}-1-1`,
            title: `Core Foundations & Key Concepts`,
            durationMinutes: 4,
            completed: true,
            conceptSummary: `Essential curriculum standards, baseline theories, and foundational terminology required for ${subjectName} according to the official Namibian syllabus.`,
            workedExample: {
              problem: `Sample Examination Question for ${subjectName}: Analyze the core principles and demonstrate step-by-step problem-solving.`,
              given: ['Syllabus unit requirements', 'Standard examination format (Paper 1 & Paper 2)'],
              steps: [
                'Identify key keywords from the question prompt',
                'Apply syllabus definitions and core theoretical models',
                'Structure the response clearly using designated terminology',
              ],
              answer: 'Structured full-mark exemplar response complying with official marking memos.',
            },
            examTip: `Examiner Insight: Always define primary terms accurately in Section A to secure easy baseline marks before moving to structured questions.`,
            diagramTitle: `${subjectName} Conceptual Overview`,
            diagramConcept: `Visual taxonomy diagram mapping core themes to NSSCO examination competencies.`,
          },
          {
            id: `sub-${subjectId}-1-2`,
            title: `Applied Analysis & Practical Context`,
            durationMinutes: 5,
            conceptSummary: `Real-world applications of ${subjectName} within Namibian regional, national, and African economic and scientific contexts.`,
            examTip: `Reference specific Namibian case studies or localized examples to earn distinction-level marks in essay sections.`,
          },
          {
            id: `sub-${subjectId}-1-3`,
            title: `Exam Technique & Problem Solving`,
            durationMinutes: 4,
            conceptSummary: `Structured approaches to answering structured, data-response, and essay questions under timed exam conditions.`,
            examTip: `Time management: allocate roughly 1 minute per mark (e.g., a 6-mark question should take no longer than 6–7 minutes).`,
          },
        ],
      },
      {
        id: `mod-${subjectId}-2`,
        unitNumber: 2,
        unitTitle: `Topic 2: Advanced Syllabus Applications & Case Studies`,
        curriculumLevel: 'Senior Secondary / NSSCO Unit 2',
        subtopicsCount: 3,
        estimatedHours: '3.0 hrs',
        subtopics: [
          {
            id: `sub-${subjectId}-2-1`,
            title: `Detailed Analytical Frameworks`,
            durationMinutes: 5,
            conceptSummary: `In-depth exploration of core modules, mathematical/theoretical models, and syllabus outcomes.`,
            examTip: `Look out for command words: "Describe" asks for what happened, while "Explain" requires giving scientific or logical reasons.`,
          },
          {
            id: `sub-${subjectId}-2-2`,
            title: `Past Paper Model Answers Review`,
            durationMinutes: 4,
            conceptSummary: `Analysis of previous NSSCO exam questions with examiner notes and grade boundary benchmarks.`,
            examTip: `Reviewing official marking criteria reveals exactly which keywords examiners look for to award marks.`,
          },
        ],
      },
      {
        id: `mod-${subjectId}-3`,
        unitNumber: 3,
        unitTitle: `Topic 3: Comprehensive Revision & Exam Preparation`,
        curriculumLevel: 'Senior Secondary / NSSCO Unit 3',
        subtopicsCount: 2,
        estimatedHours: '2.0 hrs',
        subtopics: [
          {
            id: `sub-${subjectId}-3-1`,
            title: `High-Frequency Exam Topics Mastery`,
            durationMinutes: 4,
            conceptSummary: `Focused review of units that appear most frequently on Paper 1 and Paper 2 exams over the past 5 years.`,
            examTip: `Practice active recall with flashcards and mock exams rather than passive reading.`,
          },
        ],
      },
    ],

    quizQuestions: {
      topicPractice: [
        {
          id: `q-${subjectId}-tp-1`,
          topic: `${subjectName} Fundamentals`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · Foundations',
          question: `In the study of ${subjectName}, which of the following best represents a foundational principle recognized in the NSSCO curriculum?`,
          options: [
            `Comprehensive analytical method based on verified syllabus principles`,
            `Random empirical observation without structured methodology`,
            `Unverified hypothesis lacking experimental support`,
            `Obsolete historical concept not in current syllabus`,
          ],
          correctIndex: 0,
          explanation: `The Namibian curriculum emphasizes rigorous conceptual understanding and systematic structured application.`,
        },
        {
          id: `q-${subjectId}-tp-1b`,
          topic: `${subjectName} Fundamentals`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · Foundations',
          question: `Which resource is the most reliable starting point when revising ${subjectName} for NSSCO?`,
          options: [
            `The official MoEAC / NIED syllabus learning competencies`,
            `Unverified social media summaries`,
            `Random quiz apps with no syllabus mapping`,
            `Memorising answers without reading questions`,
          ],
          correctIndex: 0,
          explanation: `Syllabus competencies define examinable content and assessment objectives.`,
        },
        {
          id: `q-${subjectId}-tp-1c`,
          topic: `${subjectName} Fundamentals`,
          quizId: 'quiz-2',
          quizTitle: 'Quiz 2 · Application',
          question: `What should a learner do first when a ${subjectName} definition question appears?`,
          options: [
            `Identify command words and required key phrases`,
            `Write a long story unrelated to the term`,
            `Skip the question permanently`,
            `Copy text from another subject`,
          ],
          correctIndex: 0,
          explanation: `Command words and keyword phrases determine how marks are awarded.`,
        },
        {
          id: `q-${subjectId}-tp-2`,
          topic: `Core Competencies`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · Structure',
          question: `When approaching a structured evaluation question in ${subjectName}, what is the best initial step?`,
          options: [
            `Write immediately without reading the full question`,
            `Deconstruct the command words and identify the required syllabus components`,
            `Copy the question verbatim into the answer space`,
            `Guess based on general knowledge`,
          ],
          correctIndex: 1,
          explanation: `Deconstructing the command words (Describe, Explain, Calculate, Discuss) ensures you address all parts of the marking scheme.`,
        },
        {
          id: `q-${subjectId}-tp-2b`,
          topic: `Core Competencies`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · Structure',
          question: `Which strategy best improves accuracy on multi-step ${subjectName} calculations?`,
          options: [
            `Show formula, substitution, working, and units clearly`,
            `Only write the final number`,
            `Round every intermediate value to 0 decimal places`,
            `Avoid checking whether the answer is realistic`,
          ],
          correctIndex: 0,
          explanation: `Method marks reward clear working even if arithmetic slips occur.`,
        },
        {
          id: `q-${subjectId}-tp-2c`,
          topic: `Core Competencies`,
          quizId: 'quiz-2',
          quizTitle: 'Quiz 2 · Accuracy',
          question: `How should unused exam time be used after finishing a ${subjectName} paper?`,
          options: [
            `Review answers, units, and incomplete parts`,
            `Leave the hall immediately without checking`,
            `Change all answers randomly`,
            `Discuss answers with nearby candidates`,
          ],
          correctIndex: 0,
          explanation: `Careful review recovers easy marks lost to omitted units or incomplete responses.`,
        },
        {
          id: `q-${subjectId}-tp-3`,
          topic: `Exam Technique`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · MCQ Skills',
          question: `Which approach is most effective for multiple-choice items in ${subjectName}?`,
          options: [
            `Eliminate clearly wrong options, then verify the remaining choice`,
            `Always select option C`,
            `Change the first answer repeatedly without reason`,
            `Leave blanks instead of attempting`,
          ],
          correctIndex: 0,
          explanation: `Elimination reduces distractor traps and improves accuracy under time pressure.`,
        },
        {
          id: `q-${subjectId}-tp-3b`,
          topic: `Exam Technique`,
          quizId: 'quiz-2',
          quizTitle: 'Quiz 2 · Timing',
          question: `What is the best way to manage time in a timed ${subjectName} assessment?`,
          options: [
            `Allocate time per question and move on if stuck, then return later`,
            `Spend half the paper on the first question only`,
            `Ignore the clock completely`,
            `Answer only the last section`,
          ],
          correctIndex: 0,
          explanation: `Time allocation protects overall mark coverage across the paper.`,
        },
        {
          id: `q-${subjectId}-tp-4`,
          topic: `Revision Skills`,
          quizId: 'quiz-1',
          quizTitle: 'Quiz 1 · Methods',
          question: `Which revision method is most effective for long-term recall in ${subjectName}?`,
          options: [
            `Active recall with spaced practice quizzes`,
            `Passive re-reading only once the night before`,
            `Highlighting every line in the textbook`,
            `Avoiding practice questions entirely`,
          ],
          correctIndex: 0,
          explanation: `Active recall and spaced practice strengthen exam-ready memory.`,
        },
        {
          id: `q-${subjectId}-tp-4b`,
          topic: `Revision Skills`,
          quizId: 'quiz-2',
          quizTitle: 'Quiz 2 · Feedback',
          question: `After marking a practice quiz in ${subjectName}, what should a learner do next?`,
          options: [
            `Review explanations for wrong answers and reattempt similar items`,
            `Ignore mistakes and move on permanently`,
            `Delete the quiz result`,
            `Only celebrate correct answers`,
          ],
          correctIndex: 0,
          explanation: `Error analysis converts mistakes into syllabus mastery.`,
        },
      ],
      competition: [
        {
          id: `q-${subjectId}-comp-1a`,
          topic: `National Challenge`,
          quizId: 'round-1',
          quizTitle: 'Round 1 · Curriculum Sprint',
          question: `What is the primary examination board for secondary education in Namibia?`,
          options: [
            `DNEA (Directorate of National Examinations and Assessment)`,
            `WAEC (West African Examinations Council)`,
            `Cambridge International UK exclusively`,
            `Department of Basic Education South Africa`,
          ],
          correctIndex: 0,
          explanation: `DNEA under MoEAC oversees national secondary assessments.`,
        },
        {
          id: `q-${subjectId}-comp-1b`,
          topic: `National Challenge`,
          quizId: 'round-1',
          quizTitle: 'Round 1 · Curriculum Sprint',
          question: `What does the abbreviation NSSCO stand for?`,
          options: [
            `Namibia Senior Secondary Certificate Ordinary Level`,
            `National Secondary Science Curriculum Order`,
            `Namibian School System Certificate Organisation`,
            `Northern Secondary Standard Certification Office`,
          ],
          correctIndex: 0,
          explanation: `NSSCO stands for Namibia Senior Secondary Certificate Ordinary Level.`,
        },
        {
          id: `q-${subjectId}-comp-1c`,
          topic: `National Challenge`,
          quizId: 'round-1',
          quizTitle: 'Round 1 · Curriculum Sprint',
          question: `Which resource best guides examinable content for ${subjectName}?`,
          options: [
            `Official MoEAC / NIED syllabus competencies`,
            `Unverified social posts only`,
            `Random trivia apps`,
            `Ignoring the syllabus entirely`,
          ],
          correctIndex: 0,
          explanation: `Syllabus competencies define what can be examined.`,
        },
        {
          id: `q-${subjectId}-comp-2a`,
          topic: `National Challenge`,
          quizId: 'round-2',
          quizTitle: 'Round 2 · Exam Tactics',
          question: `Best first step on a difficult ${subjectName} MCQ?`,
          options: [
            `Eliminate options you know are wrong`,
            `Always pick C`,
            `Skip the whole paper`,
            `Ignore the stem`,
          ],
          correctIndex: 0,
          explanation: `Elimination improves odds among remaining options.`,
        },
        {
          id: `q-${subjectId}-comp-2b`,
          topic: `National Challenge`,
          quizId: 'round-2',
          quizTitle: 'Round 2 · Exam Tactics',
          question: `A timed 6-mark ${subjectName} question should take roughly:`,
          options: [
            `About 6–7 minutes`,
            `The entire paper time`,
            `Under 20 seconds`,
            `No timing plan needed`,
          ],
          correctIndex: 0,
          explanation: `About one minute per mark is a practical guide.`,
        },
        {
          id: `q-${subjectId}-comp-2c`,
          topic: `National Challenge`,
          quizId: 'round-2',
          quizTitle: 'Round 2 · Exam Tactics',
          question: `After finishing early, the best use of remaining time is:`,
          options: [
            `Recheck answers, units, and incomplete parts`,
            `Leave without checking`,
            `Change every answer randomly`,
            `Discuss with nearby candidates`,
          ],
          correctIndex: 0,
          explanation: `Careful review recovers easy omitted marks.`,
        },
      ],
      pastPapers: [
        {
          id: `q-${subjectId}-pp-2024-1a`,
          year: '2024',
          paper: 'Paper 1',
          topic: 'NSSCO 2024',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `Sample 2024 Paper 1: Which strategy is most reliable for multiple-choice items in ${subjectName}?`,
          options: [
            `Eliminate clearly incorrect distractors first, then verify the remaining correct option`,
            `Always pick option C without reading`,
            `Change your initial answer multiple times`,
            `Skip questions without marking a response`,
          ],
          correctIndex: 0,
          explanation: `Process of elimination reduces examiner traps and improves accuracy.`,
        },
        {
          id: `q-${subjectId}-pp-2024-1b`,
          year: '2024',
          paper: 'Paper 1',
          topic: 'NSSCO 2024',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `In ${subjectName} Paper 1, what should you do first when reading a long stem?`,
          options: [
            `Identify the command word and what is being asked`,
            `Ignore units and keywords`,
            `Answer from memory without reading options`,
            `Leave it blank permanently`,
          ],
          correctIndex: 0,
          explanation: `Command words determine the depth and form of the expected response.`,
        },
        {
          id: `q-${subjectId}-pp-2024-1c`,
          year: '2024',
          paper: 'Paper 1',
          topic: 'NSSCO 2024',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `Which action best protects marks on timed ${subjectName} papers?`,
          options: [
            `Allocate time by marks and return to hard items later`,
            `Spend all remaining time on one question only`,
            `Never check units`,
            `Avoid attempting structured questions`,
          ],
          correctIndex: 0,
          explanation: `Time allocation by marks maximises coverage across the paper.`,
        },
        {
          id: `q-${subjectId}-pp-2024-2a`,
          year: '2024',
          paper: 'Paper 2',
          topic: 'NSSCO 2024',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `For a structured ${subjectName} question, which response style earns method marks?`,
          options: [
            `Clear working with formula, substitution, and units`,
            `Final numeric answer only`,
            `Crossing out all working`,
            `Copying the question text as the answer`,
          ],
          correctIndex: 0,
          explanation: `Examiners award method marks for visible correct process.`,
        },
        {
          id: `q-${subjectId}-pp-2024-2b`,
          year: '2024',
          paper: 'Paper 2',
          topic: 'NSSCO 2024',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `What is the best use of spare minutes at the end of a ${subjectName} Paper 2?`,
          options: [
            `Recheck answers, units, and incomplete parts`,
            `Leave immediately without checking`,
            `Change every answer randomly`,
            `Discuss answers with other candidates`,
          ],
          correctIndex: 0,
          explanation: `Careful review recovers easy omitted marks.`,
        },
        {
          id: `q-${subjectId}-pp-2024-2c`,
          year: '2024',
          paper: 'Paper 2',
          topic: 'NSSCO 2024',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `Which resource best mirrors official ${subjectName} exam demand?`,
          options: [
            `Past NSSCO papers with mark schemes`,
            `Unverified social media summaries only`,
            `Random trivia unrelated to the syllabus`,
            `Skipping syllabus competencies`,
          ],
          correctIndex: 0,
          explanation: `Past papers and memos reflect real assessment standards.`,
        },
        {
          id: `q-${subjectId}-pp-2023-1a`,
          year: '2023',
          paper: 'Paper 1',
          topic: 'NSSCO 2023',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `2023-style item: Which approach improves accuracy under exam pressure in ${subjectName}?`,
          options: [
            `Read all options before selecting`,
            `Select the longest option always`,
            `Guess without reading the stem`,
            `Ignore negative wording in questions`,
          ],
          correctIndex: 0,
          explanation: `Reading every option prevents common distractor mistakes.`,
        },
        {
          id: `q-${subjectId}-pp-2023-1b`,
          year: '2023',
          paper: 'Paper 1',
          topic: 'NSSCO 2023',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `When two options look correct in ${subjectName}, you should:`,
          options: [
            `Compare them against the exact syllabus definition`,
            `Pick randomly immediately`,
            `Choose both if the sheet allows bubbling twice`,
            `Skip without returning`,
          ],
          correctIndex: 0,
          explanation: `Syllabus wording decides between close distractors.`,
        },
        {
          id: `q-${subjectId}-pp-2023-2a`,
          year: '2023',
          paper: 'Paper 2',
          topic: 'NSSCO 2023',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `For extended responses in ${subjectName}, high-scoring answers usually:`,
          options: [
            `Use precise terminology and linked reasoning`,
            `Repeat the question without adding content`,
            `Avoid examples entirely`,
            `Write only one keyword`,
          ],
          correctIndex: 0,
          explanation: `Precise terms and linked points match mark-scheme expectations.`,
        },
        {
          id: `q-${subjectId}-pp-2023-2b`,
          year: '2023',
          paper: 'Paper 2',
          topic: 'NSSCO 2023',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `A 6-mark structured question in ${subjectName} should take roughly:`,
          options: [
            `About 6–7 minutes`,
            `The entire remaining paper time`,
            `Less than 30 seconds`,
            `No timing consideration`,
          ],
          correctIndex: 0,
          explanation: `A practical guide is about one minute per mark.`,
        },
        {
          id: `q-${subjectId}-pp-2022-1a`,
          year: '2022',
          paper: 'Paper 1',
          topic: 'NSSCO 2022',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `2022-style: The safest first step on a difficult ${subjectName} MCQ is to:`,
          options: [
            `Eliminate options you know are wrong`,
            `Leave the whole paper`,
            `Mark every question as C`,
            `Ignore the question stem`,
          ],
          correctIndex: 0,
          explanation: `Elimination raises the chance of selecting the correct remaining option.`,
        },
        {
          id: `q-${subjectId}-pp-2022-1b`,
          year: '2022',
          paper: 'Paper 1',
          topic: 'NSSCO 2022',
          quizId: 'p1-set-a',
          quizTitle: 'Paper 1 · Set A',
          question: `Which preparation best supports ${subjectName} past-paper success?`,
          options: [
            `Active recall quizzes mapped to syllabus topics`,
            `Highlighting every textbook line once`,
            `Avoiding practice under timed conditions`,
            `Studying only the night before with no review`,
          ],
          correctIndex: 0,
          explanation: `Active, syllabus-linked practice builds exam-ready recall.`,
        },
        {
          id: `q-${subjectId}-pp-2022-2a`,
          year: '2022',
          paper: 'Paper 2',
          topic: 'NSSCO 2022',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `After marking a practice past paper in ${subjectName}, the highest-value next step is:`,
          options: [
            `Review wrong answers and retry similar items`,
            `Ignore mistakes permanently`,
            `Delete the score record`,
            `Only celebrate correct answers`,
          ],
          correctIndex: 0,
          explanation: `Error analysis converts mistakes into syllabus mastery.`,
        },
        {
          id: `q-${subjectId}-pp-2022-2b`,
          year: '2022',
          paper: 'Paper 2',
          topic: 'NSSCO 2022',
          quizId: 'p2-set-a',
          quizTitle: 'Paper 2 · Set A',
          question: `Which statement about NSSCO assessment for ${subjectName} is most accurate?`,
          options: [
            `Questions test recall and structured application of syllabus competencies`,
            `Only trivia outside the syllabus is examined`,
            `Working is never awarded marks`,
            `Paper formats never repeat themes across years`,
          ],
          correctIndex: 0,
          explanation: `NSSCO emphasises syllabus competencies with recall and application.`,
        },
      ],
    },

    textbooks: [
      {
        id: `tb-${subjectId}-1`,
        title: `${subjectName} for Senior Secondary (NSSCO/NSSCAS)`,
        category: 'Approved Textbook',
        publisher: 'MoEAC & NIED Namibia',
        pages: 280,
        fileSize: '24.5 MB',
        isDownloaded: true,
        coverColor: '#002B7F',
        chapters: [
          { title: 'Chapter 1: Curriculum Overview & Introduction', page: 8 },
          { title: 'Chapter 2: Core Concepts & Principles', page: 34 },
          { title: 'Chapter 3: In-Depth Topic Studies', page: 72 },
          { title: 'Chapter 4: Practical Applications & Case Studies', page: 120 },
          { title: 'Chapter 5: Examination Technique & Model Answers', page: 180 },
        ],
      },
      {
        id: `tb-${subjectId}-2`,
        title: `Official NSSCO ${subjectName} Syllabus Specification`,
        category: 'MoEAC Syllabus',
        publisher: 'National Institute for Educational Development (NIED)',
        pages: 64,
        fileSize: '3.8 MB',
        isDownloaded: false,
        coverColor: '#009A44',
        chapters: [
          { title: 'Curriculum Aims & Objectives', page: 4 },
          { title: 'Syllabus Content Matrix', page: 12 },
          { title: 'Scheme of Assessment & Weighting', page: 45 },
        ],
      },
      {
        id: `tb-${subjectId}-3`,
        title: `${subjectName} Past Exam Papers & Official Marking Memos`,
        category: 'Past Paper Archive',
        publisher: 'DNEA Namibia',
        pages: 180,
        fileSize: '19.8 MB',
        isDownloaded: false,
        coverColor: '#D21034',
        chapters: [
          { title: '2024 Examination Papers & Marking Schemes', page: 1 },
          { title: '2023 Examination Papers & Marking Schemes', page: 36 },
          { title: '2022 Examination Papers & Marking Schemes', page: 72 },
        ],
      },
    ],

    summaries: {
      formulas: [
        {
          name: `Core Assessment Criteria for ${subjectName}`,
          formula: 'Score = Accuracy (40%) + Method/Logic (40%) + Terminology (20%)',
          variables: [
            { symbol: 'AO1', meaning: 'Knowledge with Understanding', unit: '50% weighting' },
            { symbol: 'AO2', meaning: 'Handling Information & Problem Solving', unit: '30% weighting' },
            { symbol: 'AO3', meaning: 'Experimental Skills & Investigations', unit: '20% weighting' },
          ],
          examCaution: 'Examiners award method marks even if your final arithmetic has an error, provided your working is clearly shown!',
        },
      ],
      definitions: [
        {
          term: `Syllabus Competency in ${subjectName}`,
          definition: `The specific demonstrable knowledge, skill, and understanding required by the MoEAC curriculum for attainment at NSSCO level.`,
          keywordHighlight: 'demonstrable knowledge, skill, and understanding',
          examMarks: 2,
        },
        {
          term: `Assessment Objective`,
          definition: `A formal criterion against which a candidate’s performance is evaluated in national examinations.`,
          keywordHighlight: 'formal criterion, evaluated in national examinations',
          examMarks: 1,
        },
      ],
      mindMaps: [
        {
          title: `${subjectName} Master Syllabus Map`,
          description: `Holistic visual representation linking all required curriculum units, prerequisites, and examination papers.`,
          tags: ['Syllabus', 'Revision', 'Overview'],
          nodeCount: 16,
        },
        {
          title: `Exam Strategy & Time Management Flowchart`,
          description: `Visual process for reading through papers, identifying high-mark questions, and pacing responses.`,
          tags: ['Exam Skills', 'Planning'],
          nodeCount: 10,
        },
      ],
      bulletSummaries: [
        {
          title: `Night-Before-Exam Essentials for ${subjectName}`,
          examFrequency: 'High',
          points: [
            'Read each question carefully; underline or circle command words like "State", "Describe", or "Evaluate".',
            'Check the mark allocation to know how many distinct points or steps are expected.',
            'Ensure all diagrams are drawn in pencil with clear, ruler-straight label lines.',
            'Review all syllabus definitions in the summary tab before entering the examination hall.',
          ],
        },
      ],
    },
  };
}
