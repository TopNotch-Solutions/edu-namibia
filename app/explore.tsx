import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreMapPane } from '@/components/ExploreMapPane';
import { getUserPath, setUserPath } from '@/constants/userPath';

const NAMIBIA_BLUE = '#002B7F';
const MAP_PIN_PINK = '#E84A7F';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Guard: explorers only. Learners should use /home.
    getUserPath().then((path) => {
      if (path === 'learner') {
        router.replace('/home');
      }
    });
  }, [router]);

  const switchToLearner = async () => {
    try {
      await setUserPath('learner');
      const hasCurriculum =
        (await AsyncStorage.getItem('has_selected_grade_and_subjects')) === 'true' ||
        Boolean(await AsyncStorage.getItem('user_grade'));
      router.replace(hasCurriculum ? '/home' : '/select-grade');
    } catch {
      router.replace('/select-grade');
    }
  };

  return (
    <View style={styles.container}>
      <ExploreMapPane bottomOffset={Math.max(insets.bottom, 12) + 56} />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Text style={styles.footerLabel}>Explorer mode</Text>
        <Pressable
          onPress={switchToLearner}
          style={({ pressed }) => [styles.switchBtn, pressed && styles.pressed]}
        >
          <Text style={styles.switchBtnText}>Switch to Learner</Text>
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: MAP_PIN_PINK,
  },
  switchBtn: {
    backgroundColor: '#EEF4FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
  },
  pressed: {
    opacity: 0.8,
  },
});
