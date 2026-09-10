import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZoomableImage } from '@/components/ZoomableImage';
import {
  REGION_EXPLORE_CATEGORIES,
  RegionExploreCategory,
  getSitesForCategory,
} from '@/constants/regionExplore';

const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_YELLOW = '#FFCE00';
const MAP_PIN_PINK = '#E84A7F';

function shortTopicLabel(title: string) {
  const first = title.split(/[&,]/)[0].trim();
  return first.length > 18 ? `${first.slice(0, 16)}…` : first;
}

export default function RegionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    capital?: string;
  }>();

  const regionName = params.name || 'Namibia Region';
  const regionCapital = params.capital || '—';

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    REGION_EXPLORE_CATEGORIES[0].id
  );

  const selectedCategory: RegionExploreCategory = useMemo(() => {
    return (
      REGION_EXPLORE_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
      REGION_EXPLORE_CATEGORIES[0]
    );
  }, [selectedCategoryId]);

  const optionCount = useMemo(
    () => getSitesForCategory(selectedCategory.id).length,
    [selectedCategory.id]
  );

  const openTopicExplore = () => {
    router.push({
      pathname: '/region-topic',
      params: {
        categoryId: selectedCategory.id,
        regionName,
      },
    });
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EEF3FB', '#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View style={styles.topBarText}>
          <Text style={styles.topBarEyebrow}>Explore</Text>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {regionName}
          </Text>
        </View>
        <View style={styles.capitalChip}>
          <Text style={styles.capitalChipText} numberOfLines={1}>
            {regionCapital}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <ZoomableImage
          uri={selectedCategory.image}
          title={selectedCategory.title}
          style={styles.hero}
        >
          <LinearGradient
            colors={['transparent', 'rgba(2,6,23,0.55)', 'rgba(2,6,23,0.92)']}
            locations={[0.15, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>
                {String(selectedCategory.number).padStart(2, '0')} /{' '}
                {String(REGION_EXPLORE_CATEGORIES.length).padStart(2, '0')}
              </Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroKicker}>Topic · Tap to zoom</Text>
            <Text style={styles.heroTitle}>{selectedCategory.title}</Text>
          </View>
        </ZoomableImage>

        <Text style={styles.sectionKicker}>Topics</Text>
        <Text style={styles.sectionTitle}>What do you want to discover?</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRail}
        >
          {REGION_EXPLORE_CATEGORIES.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setSelectedCategoryId(category.id)}
                style={({ pressed }) => [
                  styles.tab,
                  isSelected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.tabIndex, isSelected && styles.tabIndexSelected]}
                >
                  {String(category.number).padStart(2, '0')}
                </Text>
                <Text
                  style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}
                  numberOfLines={1}
                >
                  {shortTopicLabel(category.title)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.explorePanel}>
          <Text style={styles.explorePanelTitle}>{selectedCategory.title}</Text>
          <Text style={styles.explorePanelText}>
            {optionCount} places with photos, descriptions, and map coordinates.
          </Text>
          <Pressable
            onPress={openTopicExplore}
            style={({ pressed }) => [
              styles.exploreTopicBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.exploreTopicBtnText}>Explore →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
  },
  backBtnText: {
    fontSize: 20,
    color: NAMIBIA_BLUE,
    fontWeight: '700',
  },
  topBarText: {
    flex: 1,
  },
  topBarEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: MAP_PIN_PINK,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  capitalChip: {
    maxWidth: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  capitalChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  scrollContent: {
    paddingTop: 4,
  },
  hero: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 22,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#002B7F',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroTopRow: {
    padding: 14,
    alignItems: 'flex-start',
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  heroBottom: {
    padding: 18,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA_YELLOW,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  sectionKicker: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  tabRail: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tabSelected: {
    backgroundColor: NAMIBIA_BLUE,
    borderColor: NAMIBIA_BLUE,
  },
  tabIndex: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
  },
  tabIndexSelected: {
    color: NAMIBIA_YELLOW,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabLabelSelected: {
    color: '#FFFFFF',
  },
  explorePanel: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EEF5',
  },
  explorePanelTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  explorePanelText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 14,
  },
  exploreTopicBtn: {
    alignSelf: 'flex-start',
    backgroundColor: NAMIBIA_BLUE,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  exploreTopicBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
