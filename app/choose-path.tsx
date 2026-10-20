import { Ionicons } from '@expo/vector-icons';
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

import { NAMIBIA, QUIZ_GRADIENT } from '@/constants/namibiaTheme';
import { getUserPath, setUserPath, UserPath } from '@/constants/userPath';

function FlagStrip() {
  return (
    <View style={styles.flagStrip}>
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.blue }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.red }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.green }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.yellow }]} />
    </View>
  );
}

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
        colors={[NAMIBIA.sand, NAMIBIA.blueSoft, NAMIBIA.white]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {returnRoute ? (
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBar, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={18} color={NAMIBIA.ink} />
          <Text style={styles.backBarText}>Back</Text>
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <View style={styles.kickerPill}>
          <Text style={styles.eyebrow}>Edu-Learning Namibia</Text>
        </View>
        <Text style={styles.title}>How will you use the app?</Text>
        <Text style={styles.subtitle}>
          Learners study the curriculum. Explorers discover Namibia on the map.
        </Text>

        <Pressable
          onPress={() => selectPath('learner')}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={[...QUIZ_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <FlagStrip />
            <View style={styles.cardBadgeRow}>
              <Text style={styles.cardBadge}>Learner</Text>
              <View style={styles.cardIconCircle}>
                <Ionicons name="school-outline" size={18} color={NAMIBIA.yellow} />
              </View>
            </View>
            <Text style={styles.cardTitle}>I am a Learner</Text>
            <Text style={styles.cardText}>
              Select your grade and subjects to study materials, past papers, and quizzes.
            </Text>
            <Text style={styles.cardCta}>Continue to grade selection →</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => selectPath('explorer')}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardLight}>
            <FlagStrip />
            <View style={styles.cardBadgeRow}>
              <Text style={[styles.cardBadge, styles.cardBadgeDark]}>Explorer</Text>
              <View style={[styles.cardIconCircle, styles.cardIconCircleLight]}>
                <Ionicons name="map-outline" size={18} color={NAMIBIA.greenDeep} />
              </View>
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleDark]}>I am an Explorer</Text>
            <Text style={[styles.cardText, styles.cardTextDark]}>
              Discover Namibia’s regions on the map — geography, culture, history, events, and food.
            </Text>
            <Text style={[styles.cardCta, styles.cardCtaGreen]}>Open Namibia Explore →</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAMIBIA.sand,
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
    zIndex: 2,
  },
  flagBand: {
    flex: 1,
  },
  backBar: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: NAMIBIA.white,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBarText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: NAMIBIA.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: NAMIBIA.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.blue,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: NAMIBIA.ink,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: NAMIBIA.muted,
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA.blueDeep,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardGradient: {
    padding: 20,
    paddingTop: 24,
    minHeight: 176,
  },
  cardLight: {
    padding: 20,
    paddingTop: 24,
    minHeight: 176,
    backgroundColor: NAMIBIA.white,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
    borderRadius: 22,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconCircleLight: {
    backgroundColor: NAMIBIA.greenSoft,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.yellow,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBadgeDark: {
    color: NAMIBIA.greenDeep,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: NAMIBIA.white,
    marginBottom: 8,
  },
  cardTitleDark: {
    color: NAMIBIA.ink,
  },
  cardText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardTextDark: {
    color: NAMIBIA.muted,
  },
  cardCta: {
    fontSize: 14,
    fontWeight: '800',
    color: NAMIBIA.white,
  },
  cardCtaGreen: {
    color: NAMIBIA.greenDeep,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
