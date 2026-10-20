/** Official Namibia flag palette + quiz UI tokens */
export const NAMIBIA = {
  blue: '#002B7F',
  blueDeep: '#001F5C',
  blueSoft: '#E8EEF8',
  red: '#D21034',
  redSoft: '#FCE8EC',
  green: '#009A44',
  greenDeep: '#007A36',
  greenSoft: '#E6F6ED',
  yellow: '#FFCE00',
  yellowSoft: '#FFF8D6',
  sand: '#F4F1E8',
  ink: '#0B1B33',
  muted: '#5B6B7F',
  line: 'rgba(0, 43, 127, 0.12)',
  white: '#FFFFFF',
} as const;

export const QUIZ_GRADIENT = [NAMIBIA.blueDeep, NAMIBIA.blue, '#163A66'] as const;
