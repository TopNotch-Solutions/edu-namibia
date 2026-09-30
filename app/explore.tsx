import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExploreMapPane } from '@/components/ExploreMapPane';
import { syncExploreEntries } from '@/constants/exploreSync';
import { getUserPath, setUserPath } from '@/constants/userPath';
import { useExploreNetwork } from '@/hooks/useExploreNetwork';

const NAMIBIA_BLUE = '#002B7F';
const MAP_PIN_PINK = '#E84A7F';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchExploreData = useCallback(() => {
    void syncExploreEntries(true);
  }, []);

  const { isOnline } = useExploreNetwork(fetchExploreData);

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
      {isOnline === false ? (
        <View style={styles.offlinePane}>
          <View style={styles.offlineIconWrap}>
            <Ionicons name="cloud-offline-outline" size={52} color="#64748B" />
          </View>
          <Text style={styles.offlineTitle}>No internet connectivity</Text>
          <Text style={styles.offlineText}>
            Connect to the internet to load the map and explore content.
          </Text>
        </View>
      ) : isOnline === null ? (
        <View style={styles.offlinePane}>
          <ActivityIndicator size="large" color={NAMIBIA_BLUE} />
          <Text style={[styles.offlineText, { marginTop: 16 }]}>Checking connection…</Text>
        </View>
      ) : (
        <ExploreMapPane bottomOffset={Math.max(insets.bottom, 12) + 56} />
      )}

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
  offlinePane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: '#EEF6FC',
  },
  offlineIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
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
