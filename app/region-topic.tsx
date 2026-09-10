import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
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
  getSitesForCategory,
} from '@/constants/regionExplore';

const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_YELLOW = '#FFCE00';
const MAP_PIN_PINK = '#E84A7F';

export default function RegionTopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    categoryId?: string;
    regionName?: string;
  }>();

  const category = useMemo(
    () =>
      REGION_EXPLORE_CATEGORIES.find((c) => c.id === params.categoryId) ||
      REGION_EXPLORE_CATEGORIES[0],
    [params.categoryId]
  );

  const sites = useMemo(
    () => getSitesForCategory(category.id),
    [category.id]
  );

  const regionName = params.regionName || 'Namibia';

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
          <Text style={styles.topBarEyebrow}>
            Topic {String(category.number).padStart(2, '0')}
          </Text>
          <Text style={styles.topBarTitle} numberOfLines={2}>
            {category.title}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <ZoomableImage uri={category.image} title={category.title} style={styles.hero}>
          <LinearGradient
            colors={['transparent', 'rgba(2,6,23,0.7)', 'rgba(2,6,23,0.92)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroSunBar} />
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>{regionName}</Text>
            <Text style={styles.heroTitle}>{category.title}</Text>
            <Text style={styles.heroCount}>{sites.length} places to explore</Text>
          </View>
        </ZoomableImage>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>All options</Text>
          <Text style={styles.listSubtitle}>
            Tap a photo to zoom · Explore for map details
          </Text>
        </View>

        {sites.map(({ subtopicTitle, site }) => (
          <View key={site.id} style={styles.siteCard}>
            <ZoomableImage
              uri={site.image}
              title={site.name}
              style={styles.siteImage}
            />
            <View style={styles.siteContent}>
              <Text style={styles.siteTopic}>{subtopicTitle}</Text>
              <Text style={styles.siteName} numberOfLines={2}>
                {site.name}
              </Text>
              <Text style={styles.siteDesc} numberOfLines={3}>
                {site.description}
              </Text>
              <View style={styles.siteFooter}>
                <Text style={styles.siteCoords}>
                  {site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/region-site',
                      params: {
                        siteId: site.id,
                        regionName,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.exploreChip,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.exploreChipText}>Explore</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
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
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  hero: {
    height: 190,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 18,
    justifyContent: 'flex-end',
  },
  heroSunBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: NAMIBIA_YELLOW,
    zIndex: 2,
  },
  heroContent: {
    padding: 16,
    zIndex: 2,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA_YELLOW,
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
  listHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  siteCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EEF5',
    flexDirection: 'row',
    minHeight: 148,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  siteImage: {
    width: 108,
    minHeight: 148,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  siteContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  siteTopic: {
    fontSize: 10,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  siteDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  siteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  siteCoords: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    flex: 1,
  },
  exploreChip: {
    backgroundColor: NAMIBIA_BLUE,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  exploreChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
