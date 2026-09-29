import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { VisualId } from '@/constants/lessonTypes';

/**
 * Small, static illustrations that sit above a read card's text.
 *
 * One picture per idea is the point — it lets the card carry less prose.
 */

const INK = '#0F172A';
const MUTED = '#94A3B8';
const LINE = '#CBD5E1';
const ACCENT = '#4338CA';
const HEAT = '#C2410C';

const VB_W = 260;
const VB_H = 104;

function lattice() {
  const dots = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      dots.push(
        <Circle key={`${row}-${col}`} cx={78 + col * 26} cy={28 + row * 24} r={8} fill={ACCENT} />
      );
    }
  }
  return dots;
}

const SCATTER_LIQUID = [
  [72, 62], [98, 70], [124, 58], [150, 68], [176, 60],
  [85, 44], [112, 40], [138, 46], [164, 38], [188, 50],
];

const SCATTER_GAS = [
  [64, 24], [112, 18], [166, 30], [198, 16],
  [78, 62], [130, 54], [182, 70], [58, 82],
  [148, 84], [206, 56],
];

export function LessonVisual({ id }: { id: VisualId }) {
  return (
    <View style={styles.frame}>
      <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">
        {id === 'PARTICLE_SOLID' && (
          <>
            <Rect x={60} y={10} width={140} height={78} rx={8} fill="none" stroke={LINE} strokeWidth={1.5} />
            {lattice()}
            <SvgText x={VB_W / 2} y={100} fill={MUTED} fontSize={9} textAnchor="middle">
              fixed pattern · vibrating on the spot
            </SvgText>
          </>
        )}

        {id === 'PARTICLE_LIQUID' && (
          <>
            <Path d="M60 10 L60 88 L200 88 L200 10" fill="none" stroke={LINE} strokeWidth={1.5} />
            <Line x1={62} y1={32} x2={198} y2={32} stroke={LINE} strokeWidth={1} strokeDasharray="4 4" />
            {SCATTER_LIQUID.map(([cx, cy], i) => (
              <Circle key={i} cx={cx} cy={cy} r={8} fill={ACCENT} />
            ))}
            <SvgText x={VB_W / 2} y={100} fill={MUTED} fontSize={9} textAnchor="middle">
              sliding past each other · fixed volume, any shape
            </SvgText>
          </>
        )}

        {id === 'PARTICLE_GAS' && (
          <>
            <Rect x={40} y={8} width={180} height={82} rx={8} fill="none" stroke={LINE} strokeWidth={1.5} />
            {SCATTER_GAS.map(([cx, cy], i) => (
              <Circle key={i} cx={cx} cy={cy} r={8} fill={ACCENT} opacity={0.88} />
            ))}
            <SvgText x={VB_W / 2} y={100} fill={MUTED} fontSize={9} textAnchor="middle">
              far apart · fills every bit of space
            </SvgText>
          </>
        )}

        {id === 'STATE_CHANGE_ARROWS' && (
          <>
            {[
              { x: 38, label: 'SOLID' },
              { x: 114, label: 'LIQUID' },
              { x: 190, label: 'GAS' },
            ].map((box) => (
              <Rect
                key={box.label}
                x={box.x}
                y={22}
                width={64}
                height={34}
                rx={8}
                fill="#EEF2FF"
                stroke={ACCENT}
                strokeWidth={1.2}
              />
            ))}
            {[
              { x: 70, label: 'SOLID' },
              { x: 146, label: 'LIQUID' },
              { x: 222, label: 'GAS' },
            ].map((box) => (
              <SvgText
                key={box.label}
                x={box.x}
                y={43}
                fill={ACCENT}
                fontSize={10}
                fontWeight="bold"
                textAnchor="middle"
              >
                {box.label}
              </SvgText>
            ))}

            <Path d="M104 33 L112 33 M107 30 L112 33 L107 36" stroke={HEAT} strokeWidth={1.8} fill="none" />
            <Path d="M180 33 L188 33 M183 30 L188 33 L183 36" stroke={HEAT} strokeWidth={1.8} fill="none" />
            <SvgText x={130} y={72} fill={HEAT} fontSize={9} textAnchor="middle">
              heating →
            </SvgText>
            <SvgText x={130} y={86} fill={MUTED} fontSize={9} textAnchor="middle">
              ← cooling
            </SvgText>
          </>
        )}

        {id === 'THERMOMETER_FIXED_POINTS' && (
          <>
            <Rect x={118} y={10} width={24} height={78} rx={12} fill="none" stroke={LINE} strokeWidth={1.5} />
            <Rect x={122} y={44} width={16} height={40} rx={8} fill={HEAT} />
            <Line x1={80} y1={22} x2={118} y2={22} stroke={LINE} strokeWidth={1} />
            <Line x1={80} y1={74} x2={118} y2={74} stroke={LINE} strokeWidth={1} />
            <SvgText x={76} y={26} fill={INK} fontSize={10} textAnchor="end">
              100 °C boils
            </SvgText>
            <SvgText x={76} y={78} fill={INK} fontSize={10} textAnchor="end">
              0 °C melts
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: VB_W / VB_H,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

export default LessonVisual;
