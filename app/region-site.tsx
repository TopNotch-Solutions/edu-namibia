import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OsmMapView } from '@/components/OsmMapView';
import { ZoomableImage } from '@/components/ZoomableImage';
import { getExploreSiteContext } from '@/constants/regionExplore';

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

  const context = useMemo(
    () => (params.siteId ? getExploreSiteContext(params.siteId) : null),
    [params.siteId]
  );

  if (!context) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.missingTitle}>Site not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { category, subtopic, site } = context;
  const regionName = params.regionName || 'Namibia';

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
            {subtopic.title} · {regionName}
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
          </View>
        </ZoomableImage>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>About this place</Text>
          <Text style={styles.description}>{site.description}</Text>

          <Text style={styles.sectionLabel}>Location on map</Text>
          <Text style={styles.coordsText}>
            {site.latitude.toFixed(4)}°, {site.longitude.toFixed(4)}°
          </Text>

          <View style={styles.mapCard}>
            <OsmMapView
              style={styles.map}
              camera={{
                latitude: site.latitude,
                longitude: site.longitude,
                latitudeDelta: 0.35,
                longitudeDelta: 0.35,
              }}
              markers={[
                {
                  id: site.id,
                  latitude: site.latitude,
                  longitude: site.longitude,
                  title: site.name,
                  subtitle: subtopic.title,
                  selected: true,
                },
              ]}
            />
          </View>
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
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#334155',
    marginBottom: 22,
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
