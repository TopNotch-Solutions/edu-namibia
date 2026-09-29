import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { LabGoalStep, LabProps } from '@/constants/lessonTypes';

/**
 * PARTICLE_HEATER — Grade 8, States of Matter.
 *
 * The learner drags a temperature slider from -20 °C to 120 °C and watches the
 * particles rearrange. Water's real fixed points (0 °C and 100 °C) decide the
 * state, so the learner discovers them by driving into them.
 *
 * Goal: visit all three states. The lab owns that condition and reports it
 * upward through onGoalReached — the lesson screen never inspects it.
 */

type MatterState = 'solid' | 'liquid' | 'gas';

const MIN_TEMP = -20;
const MAX_TEMP = 120;
const START_TEMP = 25;

// Stage geometry, in viewBox units.
const VB_W = 300;
const VB_H = 196;
const BEAKER = { x: 14, y: 14, w: 196, h: 150 };
const THERMO = { x: 246, y: 14, w: 22, h: 150 };
const PARTICLE_R = 7;
const COLS = 6;
const ROWS = 4;
const COUNT = COLS * ROWS;

const STATE_STYLE: Record<MatterState, { amp: number; periodMs: number; caption: string }> = {
  solid: {
    amp: 1.5,
    periodMs: 420,
    caption: 'Fixed pattern — the particles only vibrate on the spot.',
  },
  liquid: {
    amp: 4.5,
    periodMs: 1500,
    caption: 'Close together but sliding past each other — it takes the shape of the beaker.',
  },
  gas: {
    amp: 9,
    periodMs: 720,
    caption: 'Free and fast — the particles spread out to fill all the space.',
  },
};

function stateFor(temp: number): MatterState {
  if (temp < 0) return 'solid';
  if (temp < 100) return 'liquid';
  return 'gas';
}

/** Deterministic pseudo-random so the layout is identical on every render. */
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Point {
  x: number;
  y: number;
}

/** Fixed target position for every particle, in each of the three states. */
function buildLayouts(): Record<MatterState, Point[]> {
  const solid: Point[] = [];
  const liquid: Point[] = [];
  const gas: Point[] = [];

  // Solid: a tight lattice, centred in the beaker.
  const latticeW = COLS * (PARTICLE_R * 2 + 3);
  const latticeH = ROWS * (PARTICLE_R * 2 + 3);
  const originX = BEAKER.x + (BEAKER.w - latticeW) / 2 + PARTICLE_R + 1.5;
  const originY = BEAKER.y + (BEAKER.h - latticeH) / 2 + PARTICLE_R + 1.5;

  for (let i = 0; i < COUNT; i += 1) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    solid.push({
      x: originX + col * (PARTICLE_R * 2 + 3),
      y: originY + row * (PARTICLE_R * 2 + 3),
    });

    // Liquid: loosely packed into the lower part of the beaker, so there is a
    // visible surface — a liquid has a fixed volume.
    const lTop = BEAKER.y + BEAKER.h * 0.42;
    const lH = BEAKER.h * 0.58 - PARTICLE_R * 2;
    liquid.push({
      x: BEAKER.x + PARTICLE_R + 4 + seeded(i, 1) * (BEAKER.w - PARTICLE_R * 2 - 8),
      y: lTop + PARTICLE_R + seeded(i, 2) * lH,
    });

    // Gas: spread across the whole beaker.
    gas.push({
      x: BEAKER.x + PARTICLE_R + 4 + seeded(i, 3) * (BEAKER.w - PARTICLE_R * 2 - 8),
      y: BEAKER.y + PARTICLE_R + 4 + seeded(i, 4) * (BEAKER.h - PARTICLE_R * 2 - 8),
    });
  }

  return { solid, liquid, gas };
}

const LAYOUTS = buildLayouts();
const PHASES = Array.from({ length: COUNT }, (_, i) => seeded(i, 9) * Math.PI * 2);

function stepsFrom(seen: Record<MatterState, boolean>): LabGoalStep[] {
  return [
    { id: 'solid', label: 'Reach the solid state', hint: 'below 0 °C', done: seen.solid },
    { id: 'liquid', label: 'Reach the liquid state', hint: '0 – 100 °C', done: seen.liquid },
    { id: 'gas', label: 'Reach the gas state', hint: 'above 100 °C', done: seen.gas },
  ];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ParticleProps {
  target: Point;
  amp: number;
  periodMs: number;
  phase: number;
}

function Particle({ target, amp, periodMs, phase }: ParticleProps) {
  const x = useSharedValue(target.x);
  const y = useSharedValue(target.y);
  const wobble = useSharedValue(0);

  useEffect(() => {
    x.set(withTiming(target.x, { duration: 620, easing: Easing.out(Easing.cubic) }));
    y.set(withTiming(target.y, { duration: 620, easing: Easing.out(Easing.cubic) }));
  }, [target.x, target.y, x, y]);

  useEffect(() => {
    wobble.set(0);
    wobble.set(
      withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false)
    );
  }, [periodMs, wobble]);

  const animatedProps = useAnimatedProps(() => {
    const t = wobble.get() * Math.PI * 2;
    return {
      cx: x.get() + Math.sin(t + phase) * amp,
      cy: y.get() + Math.cos(t * 0.9 + phase) * amp,
    };
  });

  // The particles never change size — only how they are arranged and how they
  // move. That is exactly the point the lesson makes.
  return <AnimatedCircle animatedProps={animatedProps} r={PARTICLE_R} fill="#4338CA" />;
}

export function ParticleHeaterLab({ onGoalReached, onProgress }: LabProps) {
  const [temp, setTemp] = useState(START_TEMP);
  const [trackWidth, setTrackWidth] = useState(0);
  const [seen, setSeen] = useState<Record<MatterState, boolean>>({
    solid: false,
    liquid: true, // the lab opens at 25 °C, which is already liquid
    gas: false,
  });

  const state = stateFor(temp);
  const style = STATE_STYLE[state];
  const targets = LAYOUTS[state];
  const announced = useRef(false);

  // Report the opening checklist once, so the lesson can render it immediately.
  useEffect(() => {
    onProgress?.(stepsFrom({ solid: false, liquid: true, gas: false }));
  }, [onProgress]);

  /**
   * Everything that reacts to a temperature change happens here rather than in
   * an effect: record the state as visited, buzz, and report upward.
   */
  const applyTemp = useCallback(
    (next: number) => {
      const previousState = stateFor(temp);
      const nextState = stateFor(next);
      setTemp(next);

      if (nextState === previousState) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (seen[nextState]) return;

      const updated = { ...seen, [nextState]: true };
      setSeen(updated);
      onProgress?.(stepsFrom(updated));

      if (updated.solid && updated.liquid && updated.gas && !announced.current) {
        announced.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onGoalReached();
      }
    },
    [temp, seen, onGoalReached, onProgress]
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const setFromTouch = useCallback(
    (event: GestureResponderEvent) => {
      if (trackWidth <= 0) return;
      const ratio = Math.min(1, Math.max(0, event.nativeEvent.locationX / trackWidth));
      applyTemp(Math.round(MIN_TEMP + ratio * (MAX_TEMP - MIN_TEMP)));
    },
    [trackWidth, applyTemp]
  );

  const fillRatio = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  const thermoY = (value: number) =>
    THERMO.y + THERMO.h - ((value - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * THERMO.h;

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">
          <Rect
            x={BEAKER.x}
            y={BEAKER.y}
            width={BEAKER.w}
            height={BEAKER.h}
            rx={10}
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth={1.5}
          />

          {targets.map((target, index) => (
            <Particle
              key={index}
              target={target}
              amp={style.amp}
              periodMs={style.periodMs}
              phase={PHASES[index]}
            />
          ))}

          {/* Thermometer, with water's two fixed points marked */}
          {[0, 100].map((mark) => (
            <Line
              key={mark}
              x1={BEAKER.x + BEAKER.w + 6}
              y1={thermoY(mark)}
              x2={THERMO.x}
              y2={thermoY(mark)}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          ))}
          {[0, 100].map((mark) => (
            <SvgText
              key={`label-${mark}`}
              x={BEAKER.x + BEAKER.w + 8}
              y={thermoY(mark) - 4}
              fill="#94A3B8"
              fontSize={9}
            >
              {`${mark}°C`}
            </SvgText>
          ))}

          <Rect
            x={THERMO.x}
            y={THERMO.y}
            width={THERMO.w}
            height={THERMO.h}
            rx={11}
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth={1.5}
          />
          <Rect
            x={THERMO.x + 4}
            y={THERMO.y + THERMO.h - 4 - (THERMO.h - 8) * fillRatio}
            width={THERMO.w - 8}
            height={Math.max(2, (THERMO.h - 8) * fillRatio)}
            rx={7}
            fill="#C2410C"
          />

          <SvgText
            x={BEAKER.x + BEAKER.w / 2}
            y={VB_H - 10}
            fill="#94A3B8"
            fontSize={10}
            textAnchor="middle"
          >
            {`${COUNT} particles of water`}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.readout}>
        <Text style={styles.tempValue}>
          {temp}
          <Text style={styles.tempUnit}> °C</Text>
        </Text>
        <View style={[styles.statePill, styles[`statePill_${state}`]]}>
          <Text style={[styles.statePillText, styles[`statePillText_${state}`]]}>
            {state === 'solid' ? 'Solid' : state === 'liquid' ? 'Liquid' : 'Gas'}
          </Text>
        </View>
      </View>

      {/* Temperature slider. Uses the responder system so it works without any
          extra gesture dependency. */}
      <View
        style={styles.trackHit}
        onLayout={onTrackLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={setFromTouch}
        onResponderMove={setFromTouch}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Temperature"
        accessibilityValue={{ min: MIN_TEMP, max: MAX_TEMP, now: temp }}
      >
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${fillRatio * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${fillRatio * 100}%` }]} />
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleLabel}>−20 °C</Text>
        <Text style={styles.scaleHint}>drag to heat or cool</Text>
        <Text style={styles.scaleLabel}>120 °C</Text>
      </View>

      <Text style={styles.caption}>{style.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  stage: {
    aspectRatio: VB_W / VB_H,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 6,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#C2410C',
    fontVariant: ['tabular-nums'],
  },
  tempUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statePill_solid: { backgroundColor: '#E0E7FF' },
  statePill_liquid: { backgroundColor: '#DBEAFE' },
  statePill_gas: { backgroundColor: '#FEE2E2' },
  statePillText: {
    fontSize: 14,
    fontWeight: '800',
  },
  statePillText_solid: { color: '#3730A3' },
  statePillText_liquid: { color: '#1D4ED8' },
  statePillText_gas: { color: '#B91C1C' },
  trackHit: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  trackFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C2410C',
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C2410C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginLeft: -13,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  scaleHint: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  caption: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#475569',
  },
});

export default ParticleHeaterLab;
