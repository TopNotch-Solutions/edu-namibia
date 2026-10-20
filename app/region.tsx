import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopicImageSlider } from '@/components/TopicImageSlider';
import {
  countSitesForCategory,
  syncExploreEntries,
} from '@/constants/exploreSync';
import {
  REGION_EXPLORE_CATEGORIES,
  RegionExploreCategory,
} from '@/constants/regionExplore';

const NAMIBIA_BLUE = '#002B7F';
const MAP_PIN_PINK = '#E84A7F';

function shortTopicLabel(title: string) {
  const first = title.split(/[&,]/)[0].trim();
  return first.length > 18 ? `${first.slice(0, 16)}…` : first;
}

function exploreCtaLabel(category: RegionExploreCategory, regionName: string) {
  switch (category.id) {
    case 'geography':
      return `Explore landscapes in ${regionName}`;
    case 'culture':
      return `Explore culture in ${regionName}`;
    case 'history-sites':
      return `Explore history in ${regionName}`;
    case 'events':
      return `Explore events in ${regionName}`;
    case 'gastronomy':
      return `Explore food in ${regionName}`;
    default:
      return `Explore ${shortTopicLabel(category.title)}`;
  }
}

export default function RegionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    capital?: string;
  }>();

  const regionId = params.id || '';
  const regionName = params.name || 'Namibia Region';
  const regionCapital = params.capital || '—';

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    REGION_EXPLORE_CATEGORIES[0].id
  );
  const [optionCount, setOptionCount] = useState(0);

  const selectedCategory: RegionExploreCategory = useMemo(() => {
    return (
      REGION_EXPLORE_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
      REGION_EXPLORE_CATEGORIES[0]
    );
  }, [selectedCategoryId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await syncExploreEntries(true);
      if (cancelled) return;
      const count = await countSitesForCategory(
        selectedCategory.id,
        regionId || undefined
      );
      if (!cancelled) setOptionCount(count);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory.id, regionId]);

  const openTopicExplore = () => {
    router.push({
      pathname: '/region-topic',
      params: {
        categoryId: selectedCategory.id,
        regionId,
        regionName,
      },
    });
  };

  const bottomPad = Math.max(insets.bottom, 12);

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
          <Text style={styles.topBarEyebrow}>Explore region</Text>
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
        contentContainerStyle={{ paddingBottom: 24 }}
        style={styles.scroll}
      >
        <TopicImageSlider
          key={selectedCategory.id}
          images={selectedCategory.sliderImages}
          title={selectedCategory.title}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Choose a topic</Text>
            <Text style={styles.heroTitle}>{selectedCategory.title}</Text>
            <Text style={styles.heroCount}>
              {optionCount} place{optionCount === 1 ? '' : 's'} in this region
            </Text>
          </View>
        </TopicImageSlider>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicChips}
        >
          {REGION_EXPLORE_CATEGORIES.map((cat) => {
            const selected = cat.id === selectedCategoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                style={({ pressed }) => [
                  styles.topicChip,
                  selected && styles.topicChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.topicChipText,
                    selected && styles.topicChipTextSelected,
                  ]}
                >
                  {shortTopicLabel(cat.title)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.topicIntro}>
          <Text style={styles.topicIntroEyebrow}>About this topic</Text>
          <Text style={styles.topicIntroTitle}>{selectedCategory.title}</Text>
          <Text style={styles.topicIntroText}>{selectedCategory.description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <Pressable
          onPress={openTopicExplore}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={exploreCtaLabel(selectedCategory, regionName)}
        >
          <Text style={styles.ctaText} numberOfLines={2}>
            {exploreCtaLabel(selectedCategory, regionName)}
          </Text>
          <Text style={styles.ctaHint}>
            {optionCount > 0
              ? `${optionCount} place${optionCount === 1 ? '' : 's'} ready to open`
              : 'See what’s available in this topic'}
          </Text>
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
  scroll: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  capitalChip: {
    maxWidth: 110,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  capitalChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  hero: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 14,
    justifyContent: 'flex-end',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingRight: 72,
    zIndex: 2,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFCE00',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  heroCount: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  topicChips: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicChipSelected: {
    backgroundColor: NAMIBIA_BLUE,
    borderColor: NAMIBIA_BLUE,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  topicChipTextSelected: {
    color: '#FFFFFF',
  },
  topicIntro: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF5',
  },
  topicIntroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  topicIntroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  topicIntroText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EEF5',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  cta: {
    backgroundColor: '#FFCE00',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  ctaHint: {
    marginTop: 4,
    color: 'rgba(15,23,42,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
