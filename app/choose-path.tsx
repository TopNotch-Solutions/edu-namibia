import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getUserPath, setUserPath, UserPath } from '@/constants/userPath';

const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_YELLOW = '#FFCE00';
const MAP_PIN_PINK = '#E84A7F';

export default function ChoosePathScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Where to return to if the learner opened this from "Edit Setup" and
  // changed their mind. Null on first run, when there is nowhere to go back to.
  const [returnRoute, setReturnRoute] = useState<'/home' | '/explore' | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [path, hasSetup] = await Promise.all([
          getUserPath(),
          AsyncStorage.getItem('has_selected_grade_and_subjects'),
        ]);
        if (!active) return;
        if (path === 'explorer') setReturnRoute('/explore');
        else if (path === 'learner' && hasSetup === 'true') setReturnRoute('/home');
      } catch (e) {
        console.warn('Failed to resolve return route', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const goBack = useCallback(() => {
    if (returnRoute) router.replace(returnRoute);
  }, [returnRoute, router]);

  useEffect(() => {
    if (!returnRoute) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [returnRoute, goBack]);

  const selectPath = async (path: UserPath) => {
    try {
      await setUserPath(path);
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
    } catch (e) {
      console.warn('Failed to save user path', e);
    }

    if (path === 'learner') {
      router.replace('/select-grade');
    } else {
      router.replace('/explore');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#EEF3FB', '#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {returnRoute && (
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBar, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Text style={styles.backBarText}>← Back</Text>
        </Pressable>
      )}

      <View style={styles.content}>
        <Text style={styles.eyebrow}>Edu-Learning Namibia</Text>
        <Text style={styles.title}>How will you use the app?</Text>
        <Text style={styles.subtitle}>
          Learners study the curriculum. Explorers discover Namibia on the map.
        </Text>

        <Pressable
          onPress={() => selectPath('learner')}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={[NAMIBIA_BLUE, '#1A3B8B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardSunBar} />
            <Text style={styles.cardBadge}>Learner</Text>
            <Text style={styles.cardTitle}>I am a Learner</Text>
            <Text style={styles.cardText}>
              Select your grade and subjects to study textbooks, past papers, and quizzes.
            </Text>
            <Text style={styles.cardCta}>Continue to grade selection →</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => selectPath('explorer')}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardLight}>
            <View style={[styles.cardSunBar, styles.cardSunBarPink]} />
            <Text style={[styles.cardBadge, styles.cardBadgeDark]}>Explorer</Text>
            <Text style={[styles.cardTitle, styles.cardTitleDark]}>I am an Explorer</Text>
            <Text style={[styles.cardText, styles.cardTextDark]}>
              Discover Namibia’s regions on the map — sites, culture, events, and travel info.
              No grade setup required.
            </Text>
            <Text style={[styles.cardCta, styles.cardCtaPink]}>Open Namibia Explore →</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backBar: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBarText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardGradient: {
    padding: 20,
    minHeight: 168,
  },
  cardLight: {
    padding: 20,
    minHeight: 168,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
  },
  cardSunBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: NAMIBIA_YELLOW,
  },
  cardSunBarPink: {
    backgroundColor: MAP_PIN_PINK,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA_YELLOW,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardBadgeDark: {
    color: MAP_PIN_PINK,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardTitleDark: {
    color: '#0F172A',
  },
  cardText: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardTextDark: {
    color: '#64748B',
  },
  cardCta: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardCtaPink: {
    color: NAMIBIA_BLUE,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
