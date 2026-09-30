import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ZoomableImageModal } from '@/components/ZoomableImage';

const NAMIBIA_YELLOW = '#FFCE00';
const AUTO_MS = 3500;

type TopicImageSliderProps = {
  images: ImageSource[];
  title?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Auto-advancing local-image carousel for explore topic heroes. Tap to zoom. */
export function TopicImageSlider({
  images,
  title,
  style,
  children,
}: TopicImageSliderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const indexRef = useRef(0);
  const count = images.length;
  const currentSource = images[index] ?? images[0];

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [images]);

  useEffect(() => {
    if (count <= 1 || width <= 0 || zoomOpen) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % count;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [count, width, images, zoomOpen]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    const clamped = Math.max(0, Math.min(count - 1, next));
    indexRef.current = clamped;
    setIndex(clamped);
  };

  return (
    <>
      <View
        style={[styles.wrap, style]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            style={StyleSheet.absoluteFill}
          >
            {images.map((source, i) => (
              <Pressable
                key={i}
                onPress={() => setZoomOpen(true)}
                style={{ width, height: '100%' }}
                accessibilityLabel={title ? `Zoom ${title}` : 'Zoom image'}
              >
                <Image
                  source={source}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable
            onPress={() => setZoomOpen(true)}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={title ? `Zoom ${title}` : 'Zoom image'}
          >
            <Image
              source={images[0]}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Pressable>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(2,6,23,0.7)', 'rgba(2,6,23,0.92)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.sunBar} pointerEvents="none" />

        <View pointerEvents="none" style={styles.childrenLayer}>
          {children}
        </View>

        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomBadgeText}>Zoom</Text>
        </View>

        {count > 1 ? (
          <View style={styles.dots} pointerEvents="box-none">
            {images.map((_, i) => (
              <Pressable
                key={i}
                hitSlop={8}
                onPress={() => {
                  indexRef.current = i;
                  setIndex(i);
                  scrollRef.current?.scrollTo({ x: i * width, animated: true });
                }}
                style={[styles.dot, i === index && styles.dotActive]}
                accessibilityLabel={`Slide ${i + 1} of ${count}`}
              />
            ))}
          </View>
        ) : null}
      </View>

      {currentSource ? (
        <ZoomableImageModal
          visible={zoomOpen}
          source={currentSource}
          title={title}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  sunBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: NAMIBIA_YELLOW,
    zIndex: 2,
  },
  childrenLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  zoomBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    zIndex: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dots: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 4,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: NAMIBIA_YELLOW,
    width: 16,
  },
});
