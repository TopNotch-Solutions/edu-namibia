import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

type ZoomableImageModalProps = {
  visible: boolean;
  uri: string;
  title?: string;
  onClose: () => void;
};

export function ZoomableImageModal({
  visible,
  uri,
  title,
  onClose,
}: ZoomableImageModalProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  // Shared values use .get()/.set() so the React Compiler doesn't treat them as mutated props.
  useEffect(() => {
    if (!visible) {
      scale.set(1);
      savedScale.set(1);
      translateX.set(0);
      translateY.set(0);
      savedX.set(0);
      savedY.set(0);
    }
  }, [visible, scale, savedScale, translateX, translateY, savedX, savedY]);

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={10}
            accessibilityLabel="Close zoomed image"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {title ? <Text style={styles.title}>{title}</Text> : null}

        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.imageWrap, animatedStyle]}>
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              transition={150}
            />
          </Animated.View>
        </GestureDetector>

        {Platform.OS === 'web' ? (
          <Text style={[styles.webNote, { bottom: insets.bottom + 16 }]}>
            Use scroll wheel / trackpad pinch to zoom where supported
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

type ZoomableImageProps = {
  uri: string;
  title?: string;
  style?: object;
  contentFit?: 'cover' | 'contain';
  children?: React.ReactNode;
};

/** Tap the image area to open a pinch-zoom viewer. */
export function ZoomableImage({
  uri,
  title,
  style,
  contentFit = 'cover',
  children,
}: ZoomableImageProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={style}
        accessibilityLabel={title ? `Zoom ${title}` : 'Zoom image'}
      >
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={200}
        />
        {children}
        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomBadgeText}>Zoom</Text>
        </View>
      </Pressable>

      <ZoomableImageModal
        visible={open}
        uri={uri}
        title={title}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    zIndex: 20,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  imageWrap: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72,
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  webNote: {
    position: 'absolute',
    left: 16,
    right: 16,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
  },
  zoomBadge: {
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
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
