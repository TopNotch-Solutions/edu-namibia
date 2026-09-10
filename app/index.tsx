import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

const TOTAL_DURATION_MS = 10000;

const ANIMATED_WORDS = [
  { word: 'Access', subtitle: 'Curriculum materials digitally' },
  { word: 'Learn', subtitle: 'Textbooks, guides & past exam papers' },
  { word: 'Empower', subtitle: 'Quality education anytime, anywhere' },
  { word: 'Succeed', subtitle: 'Building the future of Namibia' },
];

export default function SplashScreen() {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);

  // Logo animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Text transition animations
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;

  const hasNavigated = useRef(false);
  const targetRouteRef = useRef<
    '/home' | '/explore' | '/select-grade' | '/choose-path' | '/onboarding'
  >('/onboarding');

  const getDestinationRoute = async (): Promise<
    '/home' | '/explore' | '/select-grade' | '/choose-path' | '/onboarding'
  > => {
    try {
      const hasOnboarded = await AsyncStorage.getItem('has_completed_onboarding');
      if (hasOnboarded === 'true') {
        const path = await AsyncStorage.getItem('user_path');
        if (path === 'explorer') return '/explore';

        const hasSelectedCurriculum =
          (await AsyncStorage.getItem('has_selected_grade_and_subjects')) === 'true' ||
          Boolean(await AsyncStorage.getItem('user_grade'));

        if (path === 'learner' || (!path && hasSelectedCurriculum)) {
          return hasSelectedCurriculum ? '/home' : '/select-grade';
        }

        // Onboarded but no path chosen yet
        return '/choose-path';
      }
      return '/onboarding';
    } catch {
      return '/onboarding';
    }
  };

  useEffect(() => {
    // Check ahead of time where to navigate
    getDestinationRoute()
      .then((route) => {
        targetRouteRef.current = route;
      })
      .catch(() => {
        targetRouteRef.current = '/onboarding';
      });
  }, []);

  const navigateToNextScreen = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    try {
      const destination = await getDestinationRoute();
      router.replace(destination);
    } catch {
      router.replace(targetRouteRef.current);
    }
  };

  // 1. Initial Logo Entrance & subtle pulse
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Subtle continuous breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // 2. Animate text in on word change
  const animateTextIn = () => {
    textFade.setValue(0);
    textTranslateY.setValue(12);

    Animated.parallel([
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 3. Word cycle and 10-second timer
  useEffect(() => {
    animateTextIn();

    const intervalTime = TOTAL_DURATION_MS / ANIMATED_WORDS.length; // ~2.5s per word
    let currentIndex = 0;

    const interval = setInterval(() => {
      // Fade out current word
      Animated.timing(textFade, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        currentIndex += 1;
        if (currentIndex < ANIMATED_WORDS.length) {
          setWordIndex(currentIndex);
          animateTextIn();
        }
      });
    }, intervalTime);

    // Auto-navigate after 10 seconds
    const timeout = setTimeout(() => {
      navigateToNextScreen();
    }, TOTAL_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const combinedLogoScale = Animated.multiply(logoScale, pulseAnim);
  const currentItem = ANIMATED_WORDS[wordIndex] || ANIMATED_WORDS[0];

  return (
    <Pressable style={styles.container} onPress={navigateToNextScreen}>
      {/* Centered Logo with smooth entrance & pulse */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoFade,
            transform: [{ scale: combinedLogoScale }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          priority="high"
        />
      </Animated.View>

      {/* Animated Words */}
      <Animated.View
        style={[
          styles.textWrapper,
          {
            opacity: textFade,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.animatedWord}>{currentItem.word}</Text>
        <Text style={styles.animatedSubtitle}>{currentItem.subtitle}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    alignItems: 'center',
    minHeight: 80,
  },
  animatedWord: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D2D5E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  animatedSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
