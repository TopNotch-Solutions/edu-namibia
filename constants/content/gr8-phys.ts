import type { GradeSubjectContent } from '@/constants/lessonTypes';

/**
 * Grade 8 Physical Science — DRAFT CONTENT.
 *
 * Written to demonstrate the lesson flow. It has NOT been checked against the
 * MoEAC Junior Secondary Physical Science syllabus. Every lesson carries
 * `draft: true` and the app shows a marker so nobody mistakes it for approved
 * material. Replacing it is a data edit — no component changes.
 */
export const GR8_PHYSICAL_SCIENCE: GradeSubjectContent = {
  gradeId: 'gr8',
  subjectId: 'phys',
  syllabusLabel: 'MoEAC Junior Secondary',
  draft: true,
  units: [
    {
      id: 'g8-phys-u1',
      unitNumber: 1,
      title: 'Matter and the Particle Model',
      summary: 'What everything is made of, and why it behaves the way it does.',
      lessons: [
        // ---------------------------------------------------------------- 1.1
        {
          id: 'g8-phys-1-1',
          gradeId: 'gr8',
          subjectId: 'phys',
          unitId: 'g8-phys-u1',
          order: 1,
          title: 'States of Matter & the Particle Model',
          objective:
            'Explain the difference between solids, liquids and gases using the arrangement and movement of particles.',
          durationMinutes: 6,
          readXp: 15,
          checkXp: 10,
          draft: true,
          read: [
            {
              kind: 'idea',
              heading: 'Everything is made of particles',
              body:
                'A grain of Namib sand, the water in a borehole, the air above Etosha — all of it is built from particles far too small to see. You cannot see the particles themselves, but you can see what they do.',
            },
            {
              kind: 'idea',
              heading: 'Particles in a solid',
              visual: 'PARTICLE_SOLID',
              body:
                'In a solid the particles are packed tightly in a fixed pattern. They have enough energy to vibrate on the spot, but not enough to move past each other. That is why a rock keeps its shape when you pick it up.',
            },
            {
              kind: 'idea',
              heading: 'Particles in a liquid',
              visual: 'PARTICLE_LIQUID',
              body:
                'In a liquid the particles are still close together, but they have enough energy to slide past one another. A liquid therefore has a fixed volume but takes the shape of its container — water poured into a bucket becomes bucket-shaped.',
            },
            {
              kind: 'idea',
              heading: 'Particles in a gas',
              visual: 'PARTICLE_GAS',
              body:
                'In a gas the particles have broken free of each other completely. They move fast, in all directions, and spread out to fill whatever space they are in. A gas has neither a fixed shape nor a fixed volume.',
            },
            {
              kind: 'definition',
              term: 'The particle model',
              meaning:
                'The idea that all matter is made of tiny moving particles, and that heating matter gives those particles more energy to move.',
              inOtherWords:
                'Add heat, the particles move more. Take heat away, they move less.',
            },
            {
              kind: 'tip',
              heading: 'The mistake examiners look for',
              body:
                'When a substance is heated, the particles gain energy and move faster and further apart. The particles themselves do not get bigger, and they do not turn into different particles. Say "the particles move further apart", never "the particles expand".',
            },
          ],
          lab: {
            labId: 'PARTICLE_HEATER',
            title: 'Particle Heater',
            brief:
              'Drag the temperature slider and watch what the particles do. Water is the substance in the beaker.',
            goal: 'Reach all three states of matter — solid, liquid and gas.',
            xp: 20,
          },
          check: [
            {
              id: 'g8-phys-1-1-q1',
              question:
                'Water in a kettle is heated from 20 °C to 100 °C. What happens to its particles?',
              options: [
                'The particles get bigger',
                'The particles gain energy and move faster and further apart',
                'The particles change into different particles',
                'The particles stop moving',
              ],
              correctIndex: 1,
              explanation:
                'Heating gives the particles more energy, so they move faster and spread out. The particles themselves never change size and never turn into something new.',
            },
            {
              id: 'g8-phys-1-1-q2',
              question:
                'A learner pours water from a bottle into a flat dish. The water spreads out but the amount stays the same. Which statement explains this?',
              options: [
                'Liquid particles are fixed in place, so the volume cannot change',
                'Liquid particles slide past each other, so the shape changes but the volume stays fixed',
                'Liquid particles fill all the space available, like a gas',
                'Liquid particles disappear into the dish',
              ],
              correctIndex: 1,
              explanation:
                'Liquid particles stay close together — that fixes the volume — but they can slide past one another, so the liquid takes the shape of whatever holds it.',
            },
            {
              id: 'g8-phys-1-1-q3',
              question:
                'Which arrangement of particles belongs to a gas?',
              options: [
                'Packed in a fixed pattern, vibrating on the spot',
                'Close together but sliding past each other',
                'Far apart, moving quickly in all directions',
                'Joined in long chains that cannot move',
              ],
              correctIndex: 2,
              explanation:
                'In a gas the particles have escaped each other completely. They travel fast in every direction and spread out to fill the whole container.',
            },
          ],
        },

        // ---------------------------------------------------------------- 1.2
        {
          id: 'g8-phys-1-2',
          gradeId: 'gr8',
          subjectId: 'phys',
          unitId: 'g8-phys-u1',
          order: 2,
          title: 'Melting, Boiling and Changing State',
          objective:
            'Name the changes of state and give the melting and boiling points of water.',
          durationMinutes: 5,
          readXp: 15,
          checkXp: 10,
          draft: true,
          read: [
            {
              kind: 'idea',
              heading: 'Heating and cooling change the state',
              visual: 'STATE_CHANGE_ARROWS',
              body:
                'Adding heat moves a substance from solid to liquid to gas. Removing heat moves it back the other way. Nothing new is made — it is the same substance with its particles arranged differently.',
            },
            {
              kind: 'definition',
              term: 'Melting and freezing',
              meaning:
                'Melting is solid turning to liquid as it is heated. Freezing is liquid turning to solid as it cools. Both happen at the melting point — for water, 0 °C.',
            },
            {
              kind: 'definition',
              term: 'Boiling and condensing',
              meaning:
                'Boiling is liquid turning to gas throughout the liquid as it is heated. Condensing is gas turning back to liquid as it cools. For water this happens at 100 °C.',
              inOtherWords:
                'The fog that rolls into Swakopmund is water vapour that has condensed into tiny droplets over the cold Atlantic.',
            },
            {
              kind: 'idea',
              heading: 'Evaporation is not boiling',
              body:
                'A puddle after rain in Windhoek dries up long before it reaches 100 °C. That is evaporation — only the fastest particles at the surface escape. Boiling happens throughout the liquid, and only at the boiling point.',
            },
            {
              kind: 'tip',
              heading: 'Learn these two numbers',
              body:
                'For pure water at normal pressure: melting point 0 °C, boiling point 100 °C. Questions very often give you a temperature and expect you to say which state the water is in.',
            },
          ],
          lab: null,
          check: [
            {
              id: 'g8-phys-1-2-q1',
              question: 'Pure water is at 45 °C. Which state is it in?',
              options: ['Solid', 'Liquid', 'Gas', 'Solid and gas together'],
              correctIndex: 1,
              explanation:
                'Water melts at 0 °C and boils at 100 °C. At 45 °C it is between the two, so it is liquid.',
            },
            {
              id: 'g8-phys-1-2-q2',
              question:
                'Water vapour in the air touches a cold window and turns into droplets. What is this change called?',
              options: ['Melting', 'Evaporation', 'Condensation', 'Freezing'],
              correctIndex: 2,
              explanation:
                'Gas cooling into a liquid is condensation. The cold glass takes energy away from the vapour particles, so they slow down and join together.',
            },
            {
              id: 'g8-phys-1-2-q3',
              question:
                'A shallow pan of water dries up in the sun at about 30 °C. Why is this evaporation and not boiling?',
              options: [
                'Because the water is not pure',
                'Because only the fastest particles at the surface escape, below the boiling point',
                'Because the pan is shallow',
                'Because boiling only happens at night',
              ],
              correctIndex: 1,
              explanation:
                'Evaporation happens at any temperature and only at the surface. Boiling happens throughout the liquid, and only once the boiling point is reached.',
            },
          ],
        },

        // ---------------------------------------------------------------- 1.3
        {
          id: 'g8-phys-1-3',
          gradeId: 'gr8',
          subjectId: 'phys',
          unitId: 'g8-phys-u1',
          order: 3,
          title: 'Pure Substances and Mixtures',
          objective:
            'Tell the difference between a pure substance and a mixture, and give examples of each.',
          durationMinutes: 5,
          readXp: 15,
          checkXp: 10,
          draft: true,
          read: [
            {
              kind: 'definition',
              term: 'Pure substance',
              meaning:
                'A substance made of only one kind of particle throughout. Distilled water and pure copper are pure substances.',
            },
            {
              kind: 'definition',
              term: 'Mixture',
              meaning:
                'Two or more substances mixed together but not chemically joined. Each keeps its own properties, and they can be separated again.',
              inOtherWords:
                'Borehole water is a mixture — water with dissolved salts and minerals carried in it.',
            },
            {
              kind: 'idea',
              heading: 'Mixtures you already know',
              body:
                'Air is a mixture of gases. Sea water at Walvis Bay is a mixture of water and dissolved salt. The sand of the Namib is a mixture of different mineral grains. None of these were made by a chemical reaction.',
            },
            {
              kind: 'tip',
              heading: 'The test that separates the two',
              body:
                'Ask: can it be separated by a physical method such as filtering, evaporating or sieving? If yes, it is a mixture. A pure substance can only be broken up by a chemical change.',
            },
          ],
          lab: null,
          check: [
            {
              id: 'g8-phys-1-3-q1',
              question: 'Which of these is a pure substance?',
              options: ['Sea water', 'Air', 'Distilled water', 'Namib sand'],
              correctIndex: 2,
              explanation:
                'Distilled water has had everything else removed, so it is one kind of particle throughout. The other three are all mixtures.',
            },
            {
              id: 'g8-phys-1-3-q2',
              question:
                'Salt is stirred into a glass of water until it disappears. Is the result a mixture?',
              options: [
                'No, because the salt cannot be seen any more',
                'No, because a new substance has been made',
                'Yes, because the salt and water are not chemically joined and can be separated again',
                'Yes, but only until the water evaporates',
              ],
              correctIndex: 2,
              explanation:
                'Dissolving is a physical change. The salt particles are spread through the water but unchanged, and evaporating the water brings the salt back.',
            },
            {
              id: 'g8-phys-1-3-q3',
              question: 'Which statement about mixtures is correct?',
              options: [
                'The substances in a mixture are chemically joined',
                'Each substance in a mixture keeps its own properties',
                'A mixture always has a fixed melting point',
                'Mixtures cannot be separated',
              ],
              correctIndex: 1,
              explanation:
                'Nothing in a mixture is chemically changed, so each part keeps its own properties — which is exactly why physical methods can separate them again.',
            },
          ],
        },

        // ---------------------------------------------------------------- 1.4
        {
          id: 'g8-phys-1-4',
          gradeId: 'gr8',
          subjectId: 'phys',
          unitId: 'g8-phys-u1',
          order: 4,
          title: 'Separating Mixtures',
          objective:
            'Choose the right separation method for a given mixture and explain why it works.',
          durationMinutes: 7,
          readXp: 15,
          checkXp: 10,
          draft: true,
          read: [
            {
              kind: 'idea',
              heading: 'Pick the method that uses the difference',
              body:
                'Every separation method works because the substances in the mixture differ in some way — in particle size, in boiling point, or in whether they dissolve. Find the difference first, then choose the method.',
            },
            {
              kind: 'definition',
              term: 'Filtration',
              meaning:
                'Separating an insoluble solid from a liquid by passing the mixture through filter paper. The solid stays behind as residue; the liquid that passes through is the filtrate.',
              inOtherWords:
                'It works because the solid particles are too big to fit through the holes in the paper.',
            },
            {
              kind: 'definition',
              term: 'Evaporation',
              meaning:
                'Separating a dissolved solid from its liquid by heating the liquid away, leaving the solid behind.',
              inOtherWords:
                'Salt pans near Swakopmund use the sun to do exactly this on an enormous scale.',
            },
            {
              kind: 'definition',
              term: 'Distillation',
              meaning:
                'Separating a liquid from a mixture by boiling it off and then condensing the vapour back into a separate container — so you keep the liquid instead of losing it.',
            },
            {
              kind: 'tip',
              heading: 'Filtration will not remove dissolved salt',
              body:
                'A very common exam error. Dissolved particles are far smaller than the holes in filter paper, so they pass straight through. To recover a dissolved solid you must evaporate or distil.',
            },
          ],
          lab: null,
          check: [
            {
              id: 'g8-phys-1-4-q1',
              question:
                'A learner needs to remove sand from a mixture of sand and water. Which method should they use?',
              options: ['Evaporation', 'Filtration', 'Distillation', 'Freezing'],
              correctIndex: 1,
              explanation:
                'Sand does not dissolve, so its particles are large enough to be trapped by filter paper while the water passes through.',
            },
            {
              id: 'g8-phys-1-4-q2',
              question:
                'Why can filtration not separate salt from salt water?',
              options: [
                'Salt is heavier than water',
                'The dissolved salt particles are small enough to pass through the filter paper',
                'Salt reacts with the filter paper',
                'Filtration only works on gases',
              ],
              correctIndex: 1,
              explanation:
                'Dissolved particles are spread right through the liquid and are far smaller than the holes in the paper, so they go through with the water.',
            },
            {
              id: 'g8-phys-1-4-q3',
              question:
                'A community wants drinkable water from salty borehole water, and wants to keep the water. Which method is best?',
              options: [
                'Filtration, to trap the salt',
                'Evaporation, to boil the water away',
                'Distillation, to boil the water off and condense it back',
                'Sieving, to catch the salt grains',
              ],
              correctIndex: 2,
              explanation:
                'Evaporation would leave the salt but lose the water as vapour. Distillation boils the water off and then condenses it back into a separate container, so the clean water is kept.',
            },
          ],
        },
      ],
    },
  ],
};
