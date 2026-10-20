import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OsmMapView } from '@/components/OsmMapView';
import { ZoomableImage } from '@/components/ZoomableImage';
import {
  getExploreSiteByIdMerged,
  syncExploreEntries,
  type RichExploreSite,
} from '@/constants/exploreSync';
import type { RegionExploreCategory } from '@/constants/regionExplore';

const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_YELLOW = '#FFCE00';
const MAP_PIN_PINK = '#E84A7F';

export default function RegionSiteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    siteId?: string;
    regionName?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<RegionExploreCategory | null>(null);
  const [subtopicTitle, setSubtopicTitle] = useState('');
  const [site, setSite] = useState<RichExploreSite | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await syncExploreEntries(true);
      if (!params.siteId || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      const context = await getExploreSiteByIdMerged(params.siteId);
      if (cancelled) return;
      if (context) {
        setCategory(context.category);
        setSubtopicTitle(context.subtopicTitle);
        setSite(context.site);
      } else {
        setCategory(null);
        setSite(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.siteId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator color={NAMIBIA_BLUE} />
        <Text style={styles.loadingText}>Loading place…</Text>
      </View>
    );
  }

  if (!site || !category) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.missingTitle}>Site not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const regionName = params.regionName || 'Namibia';
  const narrative = site.fullDescription || site.description;
  const data = site.categoryData || {};
  const detailRows: { label: string; value: string }[] = [];
  if (data.year != null && String(data.year).trim()) {
    detailRows.push({ label: 'Year', value: String(data.year) });
  }
  if (data.geological_age && String(data.geological_age).trim()) {
    detailRows.push({ label: 'Geological age', value: String(data.geological_age) });
  }
  if (data.climate && String(data.climate).trim()) {
    detailRows.push({ label: 'Climate', value: String(data.climate) });
  }
  if (data.conservation && String(data.conservation).trim()) {
    detailRows.push({ label: 'Conservation', value: String(data.conservation) });
  }
  if (data.classification_type && String(data.classification_type).trim()) {
    detailRows.push({ label: 'Classification', value: String(data.classification_type) });
  }
  if (data.season && String(data.season).trim()) {
    detailRows.push({ label: 'Season', value: String(data.season) });
  }
  if (data.frequency && String(data.frequency).trim()) {
    detailRows.push({ label: 'Frequency', value: String(data.frequency) });
  }
  if (data.admission_type && String(data.admission_type).trim()) {
    detailRows.push({
      label: 'Admission',
      value: String(data.admission_type) === 'paid' ? 'Paid' : 'Public / Free',
    });
  }
  if (data.venue && String(data.venue).trim()) {
    detailRows.push({ label: 'Venue', value: String(data.venue) });
  }
  if (data.ingredients && String(data.ingredients).trim()) {
    detailRows.push({ label: 'Ingredients', value: String(data.ingredients) });
  }
  if (data.preparation && String(data.preparation).trim()) {
    detailRows.push({ label: 'Preparation', value: String(data.preparation) });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerEyebrow}>{category.title}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {site.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {subtopicTitle} · {regionName}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <ZoomableImage uri={site.image} title={site.name} style={styles.hero}>
          <LinearGradient
            colors={['rgba(15,23,42,0.05)', 'rgba(2,6,23,0.82)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroSunBar} />
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>Explore Site · Tap image to zoom</Text>
            <Text style={styles.heroTitle}>{site.name}</Text>
            {site.ratingScore != null ? (
              <Text style={styles.heroRating}>Rating {site.ratingScore.toFixed(1)} / 5</Text>
            ) : null}
          </View>
        </ZoomableImage>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>About this place</Text>
          <Text style={styles.description}>{narrative}</Text>

          {detailRows.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Details</Text>
              {detailRows.map((row) => (
                <View key={row.label} style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </>
          ) : null}

          {site.featuredImage?.credit ? (
            <Text style={styles.credit}>Photo: {site.featuredImage.credit}</Text>
          ) : null}

          {site.gallery && site.gallery.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Gallery</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryRow}
              >
                {site.gallery.map((item) => (
                  <ZoomableImage
                    key={item.url}
                    uri={item.url}
                    title={item.caption || site.name}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          {site.hasLocation &&
          site.latitude != null &&
          site.longitude != null ? (
            <>
              <Text style={styles.sectionLabel}>Location on map</Text>
              {site.address ? <Text style={styles.addressText}>{site.address}</Text> : null}
              <Text style={styles.coordsText}>
                {site.latitude.toFixed(4)}°, {site.longitude.toFixed(4)}°
              </Text>

              <View style={styles.mapCard}>
                <OsmMapView
                  style={styles.map}
                  camera={{
                    latitude: site.latitude,
                    longitude: site.longitude,
                    latitudeDelta: 0.18,
                    longitudeDelta: 0.18,
                  }}
                  markers={[
                    {
                      id: site.id,
                      latitude: site.latitude,
                      longitude: site.longitude,
                      title: site.name,
                      subtitle: subtopicTitle,
                      selected: true,
                    },
                  ]}
                />
              </View>
            </>
          ) : site.address ? (
            <>
              <Text style={styles.sectionLabel}>Location</Text>
              <Text style={styles.addressText}>{site.address}</Text>
            </>
          ) : null}
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: NAMIBIA_BLUE,
    fontWeight: '700',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  hero: {
    height: 240,
    backgroundColor: '#0F172A',
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
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    zIndex: 2,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA_YELLOW,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroRating: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA_BLUE,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#334155',
    marginBottom: 10,
  },
  detailBlock: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },
  credit: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAMIBIA_BLUE,
  },
  galleryRow: {
    gap: 10,
    paddingBottom: 8,
    marginBottom: 12,
  },
  galleryImage: {
    width: 160,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  addressText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  mapCard: {
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#E2E8F0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 12,
    alignSelf: 'center',
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: NAMIBIA_BLUE,
  },
  pressed: {
    opacity: 0.85,
  },
});
