import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type ZoomableViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Show a small “Pinch to zoom” hint badge. */
  showHint?: boolean;
};

/**
 * Pinch / pan / double-tap zoom wrapper for images, video surfaces, etc.
 */
export function ZoomableView({ children, style, showHint = true }: ZoomableViewProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    scale.set(1);
    savedScale.set(1);
    translateX.set(0);
    translateY.set(0);
    savedX.set(0);
    savedY.set(0);
  }, [scale, savedScale, translateX, translateY, savedX, savedY]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.get() * e.scale;
      scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    })
    .onEnd(() => {
      savedScale.set(scale.get());
      if (scale.get() <= 1.05) {
        scale.set(withTiming(1));
        savedScale.set(1);
        translateX.set(withTiming(0));
        translateY.set(withTiming(0));
        savedX.set(0);
        savedY.set(0);
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.get() <= 1) return;
      translateX.set(savedX.get() + e.translationX);
      translateY.set(savedY.get() + e.translationY);
    })
    .onEnd(() => {
      savedX.set(translateX.get());
      savedY.set(translateY.get());
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.get() > 1.2) {
        scale.set(withTiming(1));
        savedScale.set(1);
        translateX.set(withTiming(0));
        translateY.set(withTiming(0));
        savedX.set(0);
        savedY.set(0);
      } else {
        scale.set(withTiming(2.2));
        savedScale.set(2.2);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.clip, style]}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.inner, animatedStyle]}>{children}</Animated.View>
      </GestureDetector>
      {showHint ? (
        <View style={styles.hintBadge} pointerEvents="none">
          <Text style={styles.hintText}>Pinch to zoom</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    width: '100%',
    height: '100%',
  },
  hintBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 5,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
