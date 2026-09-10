import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OsmMapView } from '@/components/OsmMapView';
import {
  MapCamera,
  NAMIBIA_MAP_REGION,
  NAMIBIA_REGIONS,
  NamibiaRegion,
} from '@/constants/namibiaRegions';

const MAP_PIN_PINK = '#E84A7F';

type ExploreMapPaneProps = {
  /** Extra bottom offset so banners clear an optional tab bar. */
  bottomOffset?: number;
};

export function ExploreMapPane({ bottomOffset = 16 }: ExploreMapPaneProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [regionSearch, setRegionSearch] = useState('');
  const [camera, setCamera] = useState<MapCamera>(NAMIBIA_MAP_REGION);
  const [cameraKey, setCameraKey] = useState(0);

  const selectedRegion = NAMIBIA_REGIONS.find((r) => r.id === selectedRegionId) ?? null;

  const filteredRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase();
    if (!q) return NAMIBIA_REGIONS;
    return NAMIBIA_REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.capital.toLowerCase().includes(q)
    );
  }, [regionSearch]);

  const markers = useMemo(
    () =>
      NAMIBIA_REGIONS.map((region) => ({
        id: region.id,
        latitude: region.latitude,
        longitude: region.longitude,
        title: region.name,
        subtitle: `Capital: ${region.capital}`,
        selected: selectedRegionId === region.id,
      })),
    [selectedRegionId]
  );

  const clearExplore = () => {
    setRegionSearch('');
    setSelectedRegionId(null);
    setCamera(NAMIBIA_MAP_REGION);
    setCameraKey((k) => k + 1);
  };

  const focusRegion = (region: NamibiaRegion) => {
    setSelectedRegionId(region.id);
    setCamera({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: 3.2,
      longitudeDelta: 3.2,
    });
    setCameraKey((k) => k + 1);
  };

  return (
    <View style={styles.explorePane}>
      <OsmMapView
        style={StyleSheet.absoluteFill}
        camera={camera}
        cameraKey={cameraKey}
        markers={markers}
        onMarkerPress={(id) => {
          const region = NAMIBIA_REGIONS.find((r) => r.id === id);
          if (region) focusRegion(region);
        }}
      />

      <View style={[styles.mapSearchWrap, { top: insets.top + 10 }]}>
        <View style={styles.mapSearchRow}>
          <View style={styles.mapSearchBar}>
            <Text style={styles.mapSearchIcon}>🔍</Text>
            <TextInput
              placeholder="Search for a region"
              placeholderTextColor="#94A3B8"
              value={regionSearch}
              onChangeText={setRegionSearch}
              style={styles.mapSearchInput}
              returnKeyType="search"
            />
            {regionSearch.length > 0 && (
              <Pressable onPress={() => setRegionSearch('')} hitSlop={8}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {selectedRegionId && (
            <Pressable
              onPress={clearExplore}
              style={({ pressed }) => [
                styles.mapClearBtn,
                pressed && styles.pressedState,
              ]}
              accessibilityLabel="Clear selected region"
            >
              <Text style={styles.mapClearBtnText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {regionSearch.trim().length > 0 && (
          <View style={styles.mapSearchResults}>
            {filteredRegions.length === 0 ? (
              <Text style={styles.mapSearchEmpty}>No regions found</Text>
            ) : (
              filteredRegions.map((region) => (
                <Pressable
                  key={region.id}
                  onPress={() => {
                    setRegionSearch('');
                    focusRegion(region);
                  }}
                  style={({ pressed }) => [
                    styles.mapSearchResultItem,
                    pressed && styles.pressedState,
                  ]}
                >
                  <Text style={styles.mapSearchResultName}>{region.name}</Text>
                  <Text style={styles.mapSearchResultCapital}>{region.capital}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>

      {selectedRegion && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/region',
              params: {
                id: selectedRegion.id,
                name: selectedRegion.name,
                capital: selectedRegion.capital,
              },
            })
          }
          style={({ pressed }) => [
            styles.regionNameBanner,
            { bottom: bottomOffset },
            pressed && styles.pressedState,
          ]}
          accessibilityLabel={`Open ${selectedRegion.name} explore topics`}
        >
          <Text style={styles.regionNameBannerLabel}>Region · Tap to explore</Text>
          <Text style={styles.regionNameBannerTitle}>{selectedRegion.name}</Text>
          <Text style={styles.regionNameBannerCapital}>
            Capital · {selectedRegion.capital}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  explorePane: {
    flex: 1,
    backgroundColor: '#D4C4A8',
  },
  mapSearchWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  mapSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
      },
    }),
  },
  mapSearchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 2,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  mapClearBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapClearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: MAP_PIN_PINK,
  },
  mapSearchResults: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 220,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  mapSearchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  mapSearchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mapSearchResultCapital: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  mapSearchEmpty: {
    padding: 16,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
  },
  regionNameBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    zIndex: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  regionNameBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MAP_PIN_PINK,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  regionNameBannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  regionNameBannerCapital: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  pressedState: {
    opacity: 0.75,
  },
});
