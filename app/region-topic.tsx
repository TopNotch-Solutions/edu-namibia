import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopicImageSlider } from '@/components/TopicImageSlider';
import { ZoomableImage } from '@/components/ZoomableImage';
import {
  getNationwideSitesForCategory,
  getSitesForCategoryMerged,
  syncExploreEntries,
  type RichExploreSite,
} from '@/constants/exploreSync';
import { REGION_EXPLORE_CATEGORIES } from '@/constants/regionExplore';

const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_YELLOW = '#FFCE00';
const MAP_PIN_PINK = '#E84A7F';
const PAGE_SIZE = 30;

type ListedSite = {
  subtopicTitle: string;
  site: RichExploreSite;
  fromRemote: boolean;
};

function EmptyExploreState({
  title,
  message,
  icon = 'map-outline',
}: {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconRing}>
        <Ionicons name={icon} size={28} color={NAMIBIA_BLUE} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      <View style={styles.emptyHints}>
        <View style={styles.emptyHint}>
          <Ionicons name="location-outline" size={16} color={MAP_PIN_PINK} />
          <Text style={styles.emptyHintText}>Check another region</Text>
        </View>
        <View style={styles.emptyHint}>
          <Ionicons name="grid-outline" size={16} color={MAP_PIN_PINK} />
          <Text style={styles.emptyHintText}>Try a different topic</Text>
        </View>
        <View style={styles.emptyHint}>
          <Ionicons name="refresh-outline" size={16} color={MAP_PIN_PINK} />
          <Text style={styles.emptyHintText}>Come back soon for updates</Text>
        </View>
      </View>
    </View>
  );
}

export default function RegionTopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    categoryId?: string;
    regionId?: string;
    regionName?: string;
  }>();

  const category = useMemo(
    () =>
      REGION_EXPLORE_CATEGORIES.find((c) => c.id === params.categoryId) ||
      REGION_EXPLORE_CATEGORIES[0],
    [params.categoryId]
  );

  const regionName = params.regionName || 'Namibia';
  const [loading, setLoading] = useState(true);
  const [showingNationwide, setShowingNationwide] = useState(false);
  const [sites, setSites] = useState<ListedSite[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPage(1);
      await syncExploreEntries(true);
      if (cancelled) return;

      let regional = params.regionId
        ? await getSitesForCategoryMerged(category.id, params.regionId)
        : await getNationwideSitesForCategory(category.id);

      if (!cancelled) {
        setShowingNationwide(!params.regionId);
        setSites(regional);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category.id, params.regionId]);

  const totalPages = Math.max(1, Math.ceil(sites.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSites = sites.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const showingFrom = sites.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, sites.length);

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
        <TopicImageSlider
          images={category.sliderImages}
          title={category.title}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>{regionName}</Text>
            <Text style={styles.heroTitle}>{category.title}</Text>
            <Text style={styles.heroCount}>
              {loading
                ? 'Finding places…'
                : showingNationwide
                  ? 'More to discover nearby'
                  : sites.length === 0
                    ? 'Stay tuned for new places'
                    : `${sites.length} place${sites.length === 1 ? '' : 's'} to explore`}
            </Text>
          </View>
        </TopicImageSlider>

        {showingNationwide && sites.length > 0 ? (
          <View style={styles.nationwideBanner}>
            <View style={styles.nationwideIcon}>
              <Ionicons name="compass-outline" size={20} color={NAMIBIA_BLUE} />
            </View>
            <View style={styles.nationwideCopy}>
              <Text style={styles.nationwideTitle}>
                Expanding coverage in {regionName}
              </Text>
              <Text style={styles.nationwideText}>
                Local highlights for this topic are on the way. Meanwhile, explore featured places
                from across Namibia.
              </Text>
            </View>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 28 }} color={NAMIBIA_BLUE} />
        ) : sites.length === 0 ? (
          <EmptyExploreState
            title="New discoveries coming soon"
            message={`We're preparing curated places for ${category.title.toLowerCase()} in ${regionName}. Check back shortly for fresh guides, maps, and stories.`}
            icon="telescope-outline"
          />
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {showingNationwide ? 'Across Namibia' : `In ${regionName}`}
              </Text>
              <Text style={styles.listSubtitle}>
                Showing {showingFrom}–{showingTo} of {sites.length} · Tap a photo to zoom
              </Text>
            </View>

            {pageSites.map(({ subtopicTitle, site }) => (
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
                      {site.hasLocation &&
                      site.latitude != null &&
                      site.longitude != null
                        ? `${site.latitude.toFixed(2)}°, ${site.longitude.toFixed(2)}°`
                        : site.address
                          ? site.address
                          : 'No map location'}
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

            {totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={({ pressed }) => [
                    styles.pageBtn,
                    currentPage <= 1 && styles.pageBtnDisabled,
                    pressed && currentPage > 1 && styles.pressed,
                  ]}
                >
                  <Text style={styles.pageBtnText}>‹ Prev</Text>
                </Pressable>
                <Text style={styles.pageStatus}>
                  Page {currentPage} of {totalPages}
                </Text>
                <Pressable
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={({ pressed }) => [
                    styles.pageBtn,
                    currentPage >= totalPages && styles.pageBtnDisabled,
                    pressed && currentPage < totalPages && styles.pressed,
                  ]}
                >
                  <Text style={styles.pageBtnText}>Next ›</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
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
    marginBottom: 18,
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
  nationwideBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#EEF4FB',
    borderWidth: 1,
    borderColor: '#D5E3F4',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  nationwideIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nationwideCopy: {
    flex: 1,
  },
  nationwideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  nationwideText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF5',
    alignItems: 'center',
  },
  emptyIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF4FB',
    borderWidth: 1,
    borderColor: '#D5E3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 18,
  },
  emptyHints: {
    width: '100%',
    gap: 10,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
  pagination: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EEF4FB',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
  },
  pageStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  pressed: {
    opacity: 0.85,
  },
});
