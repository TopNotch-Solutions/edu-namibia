import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  REGION_EXPLORE_CATEGORIES,
  type RegionExploreCategory,
  type RegionExploreSite,
} from '@/constants/regionExplore';

function resolveApiBase(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

  // Prefer an explicit LAN IP / remote host from env.
  if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  // Expo Go / dev: use the machine that is serving Metro.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000`;
  }

  // Android emulator loopback to host machine.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return envUrl || 'http://localhost:5000';
}

const API_BASE = resolveApiBase();

const CACHE_KEY = 'explore_entries_cache_v1';
const VERSION_KEY = 'explore_entries_version_v1';

export type ExploreFeaturedImage = {
  url: string;
  alt?: string;
  caption?: string;
  credit?: string;
};

export type ExploreGalleryItem = {
  url: string;
  type?: string;
  alt?: string;
  caption?: string;
};

export type ExploreLocation = {
  latitude: number;
  longitude: number;
  address?: string;
  map_marker?: string;
  google_place_id?: string;
};

export type ExploreEntry = {
  id: string;
  region_id: string;
  category: string;
  title: string;
  short_description: string;
  full_description: string;
  featured_image: ExploreFeaturedImage | null;
  gallery: ExploreGalleryItem[];
  location: ExploreLocation | null;
  tags: string[];
  rating_score: number | null;
  category_data: Record<string, string | boolean | number>;
  status: 'draft' | 'published';
  sort_order: number;
  updated_at?: string;
};

export type RichExploreSite = RegionExploreSite & {
  source: 'remote';
  regionId?: string;
  shortDescription?: string;
  fullDescription?: string;
  featuredImage?: ExploreFeaturedImage | null;
  gallery?: ExploreGalleryItem[];
  address?: string;
  tags?: string[];
  ratingScore?: number | null;
  categoryData?: Record<string, string | boolean | number>;
};

type CachePayload = {
  version: number;
  entries: ExploreEntry[];
  fetchedAt: string;
};

let memoryCache: CachePayload | null = null;

function absoluteMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Rewrite stored localhost URLs to the reachable API host.
  const rewritten = url.replace(
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
    API_BASE
  );
  if (/^https?:\/\//i.test(rewritten)) return rewritten;
  return `${API_BASE}${rewritten.startsWith('/') ? rewritten : `/${rewritten}`}`;
}

function mapEntriesToSites(
  entries: ExploreEntry[],
  categoryId: string
): { subtopicTitle: string; site: RichExploreSite; fromRemote: boolean }[] {
  const category = getCategoryMeta(categoryId);
  return entries
    .sort(
      (a, b) =>
        (a.sort_order || 0) - (b.sort_order || 0) || a.title.localeCompare(b.title)
    )
    .map((entry) => ({
      subtopicTitle: category.title,
      site: entryToSite(entry),
      fromRemote: true,
    }));
}

export function entryToSite(entry: ExploreEntry): RichExploreSite {
  const lat = entry.location?.latitude ?? 0;
  const lng = entry.location?.longitude ?? 0;
  return {
    id: entry.id,
    name: entry.title,
    image: absoluteMediaUrl(entry.featured_image?.url),
    description: entry.short_description || entry.full_description || '',
    latitude: lat,
    longitude: lng,
    source: 'remote',
    regionId: entry.region_id,
    shortDescription: entry.short_description,
    fullDescription: entry.full_description,
    featuredImage: entry.featured_image
      ? { ...entry.featured_image, url: absoluteMediaUrl(entry.featured_image.url) }
      : null,
    gallery: (entry.gallery || []).map((g) => ({
      ...g,
      url: absoluteMediaUrl(g.url),
    })),
    address: entry.location?.address || '',
    tags: entry.tags || [],
    ratingScore: entry.rating_score,
    categoryData: entry.category_data || {},
  };
}

async function readCache(): Promise<CachePayload | null> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(payload: CachePayload) {
  memoryCache = payload;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  await AsyncStorage.setItem(VERSION_KEY, String(payload.version));
}

export async function getCachedExploreEntries(): Promise<ExploreEntry[]> {
  const cache = await readCache();
  return cache?.entries || [];
}

export async function syncExploreEntries(force = false): Promise<{
  entries: ExploreEntry[];
  version: number;
  fromNetwork: boolean;
}> {
  const cache = await readCache();

  try {
    const metaRes = await fetch(`${API_BASE}/api/explore/meta`);
    if (!metaRes.ok) throw new Error('meta failed');
    const meta = (await metaRes.json()) as { version: number };
    const remoteVersion = Number(meta.version) || 1;

    if (!force && cache && cache.version === remoteVersion && cache.entries.length > 0) {
      return { entries: cache.entries, version: cache.version, fromNetwork: false };
    }

    const listRes = await fetch(`${API_BASE}/api/explore/entries`);
    if (!listRes.ok) throw new Error('entries failed');
    const data = (await listRes.json()) as {
      version: number;
      entries: ExploreEntry[];
    };

    const payload: CachePayload = {
      version: Number(data.version) || remoteVersion,
      entries: data.entries || [],
      fetchedAt: new Date().toISOString(),
    };
    await writeCache(payload);
    return { entries: payload.entries, version: payload.version, fromNetwork: true };
  } catch {
    if (cache) {
      return { entries: cache.entries, version: cache.version, fromNetwork: false };
    }
    return { entries: [], version: 0, fromNetwork: false };
  }
}

export function getCategoryMeta(categoryId: string): RegionExploreCategory {
  return (
    REGION_EXPLORE_CATEGORIES.find((c) => c.id === categoryId) ||
    REGION_EXPLORE_CATEGORIES[0]
  );
}

export async function getSitesForCategoryMerged(
  categoryId: string,
  regionId?: string
): Promise<{ subtopicTitle: string; site: RichExploreSite; fromRemote: boolean }[]> {
  const entries = await getCachedExploreEntries();
  const remote = entries.filter((e) => {
    if (e.category !== categoryId) return false;
    if (regionId && e.region_id !== regionId) return false;
    return true;
  });
  return mapEntriesToSites(remote, categoryId);
}

export async function getNationwideSitesForCategory(
  categoryId: string
): Promise<{ subtopicTitle: string; site: RichExploreSite; fromRemote: boolean }[]> {
  const entries = await getCachedExploreEntries();
  const remote = entries.filter((e) => e.category === categoryId);
  return mapEntriesToSites(remote, categoryId);
}

export async function getExploreSiteByIdMerged(
  siteId: string
): Promise<{
  category: RegionExploreCategory;
  subtopicTitle: string;
  site: RichExploreSite;
} | null> {
  const entries = await getCachedExploreEntries();
  const entry = entries.find((e) => e.id === siteId);
  if (!entry) return null;
  const category = getCategoryMeta(entry.category);
  return {
    category,
    subtopicTitle: category.title,
    site: entryToSite(entry),
  };
}

export async function countSitesForCategory(
  categoryId: string,
  regionId?: string
): Promise<number> {
  const list = await getSitesForCategoryMerged(categoryId, regionId);
  return list.length;
}

export { API_BASE as EXPLORE_API_BASE };
