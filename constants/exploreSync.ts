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

const CACHE_KEY = 'explore_entries_cache_v2';
const VERSION_KEY = 'explore_entries_version_v2';

/** Topic category id → public API that backs it. */
const TOPIC_SOURCES: { category: string; path: string }[] = [
  { category: 'geography', path: '/api/physical-features' },
  { category: 'culture', path: '/api/culture' },
  { category: 'history-sites', path: '/api/historic-events' },
  { category: 'events', path: '/api/events' },
  { category: 'gastronomy', path: '/api/gastronomy' },
];

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

function shortText(value: string | undefined | null, max = 280): string {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function collectImageUrls(row: Record<string, unknown>): string[] {
  if (Array.isArray(row.images)) {
    return row.images.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return [row.image1, row.image2, row.image3, row.image4, row.image5, row.image6, row.image7]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function imagesToMedia(row: Record<string, unknown>, alt: string) {
  const urls = collectImageUrls(row);
  const [featured, ...rest] = urls;
  return {
    featured_image: featured
      ? { url: featured, alt, caption: '', credit: '' }
      : null,
    gallery: rest.map((url) => ({
      url,
      type: 'photo',
      alt: '',
      caption: '',
    })),
  };
}

function toLocation(
  latitude: unknown,
  longitude: unknown,
  address = ''
): ExploreLocation | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (
    latitude == null ||
    longitude == null ||
    latitude === '' ||
    longitude === '' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  return {
    latitude: lat,
    longitude: lng,
    address,
    map_marker: '',
    google_place_id: '',
  };
}

function combineTopicVersions(versions: number[]): number {
  return versions.reduce((acc, value) => acc * 10007 + (Number(value) || 1), 17);
}

function mapTopicRowToEntry(
  category: string,
  row: Record<string, unknown>
): ExploreEntry | null {
  const rawId = row.id;
  if (rawId == null) return null;

  const media = imagesToMedia(row, String(row.title || row.cultural_group || ''));
  const regionId = String(row.region || '').trim().toLowerCase();
  if (!regionId) return null;

  if (category === 'culture') {
    const group = String(row.cultural_group || '').trim();
    const description = String(row.description || '').trim();
    if (!group) return null;
    return {
      id: `${category}:${rawId}`,
      region_id: regionId,
      category,
      title: group,
      short_description: shortText(description),
      full_description: description,
      featured_image: media.featured_image,
      gallery: media.gallery,
      location: toLocation(row.latitude, row.longitude),
      tags: [],
      rating_score: null,
      category_data: { cultural_group: group },
      status: 'published',
      sort_order: 0,
      updated_at: String(row.updated_at || ''),
    };
  }

  if (category === 'history-sites') {
    const title = String(row.title || '').trim();
    const description = String(row.description || '').trim();
    const year = Number(row.year);
    if (!title) return null;
    return {
      id: `${category}:${rawId}`,
      region_id: regionId,
      category,
      title,
      short_description: shortText(
        Number.isFinite(year) ? `${year} — ${description}` : description
      ),
      full_description: description,
      featured_image: media.featured_image,
      gallery: media.gallery,
      location: toLocation(row.latitude, row.longitude),
      tags: Number.isFinite(year) ? [String(year)] : [],
      rating_score: null,
      category_data: Number.isFinite(year) ? { year } : {},
      status: 'published',
      sort_order: Number.isFinite(year) ? year : 0,
      updated_at: String(row.updated_at || ''),
    };
  }

  if (category === 'events') {
    const title = String(row.title || '').trim();
    const description = String(row.description || '').trim();
    const venue = String(row.venue || '').trim();
    if (!title) return null;
    return {
      id: `${category}:${rawId}`,
      region_id: regionId,
      category,
      title,
      short_description: shortText(description),
      full_description: description,
      featured_image: media.featured_image,
      gallery: media.gallery,
      location: toLocation(row.latitude, row.longitude, venue),
      tags: [String(row.admission_type || 'free')].filter(Boolean),
      rating_score: null,
      category_data: {
        frequency: String(row.frequency || ''),
        season: String(row.season || ''),
        admission_type: String(row.admission_type || 'free'),
        venue,
      },
      status: 'published',
      sort_order: 0,
      updated_at: String(row.updated_at || ''),
    };
  }

  if (category === 'gastronomy') {
    const title = String(row.title || '').trim();
    const description = String(row.description || '').trim();
    if (!title) return null;
    const classification = String(row.classification_type || '').trim();
    return {
      id: `${category}:${rawId}`,
      region_id: regionId,
      category,
      title,
      short_description: shortText(description),
      full_description: description,
      featured_image: media.featured_image,
      gallery: media.gallery,
      location: toLocation(row.latitude, row.longitude),
      tags: classification ? [classification] : [],
      rating_score: null,
      category_data: {
        classification_type: classification,
        ingredients: String(row.ingredients || ''),
        preparation: String(row.preparation || ''),
      },
      status: 'published',
      sort_order: 0,
      updated_at: String(row.updated_at || ''),
    };
  }

  // geography ← physical_features
  const title = String(row.title || '').trim();
  const description = String(row.description || '').trim();
  if (!title) return null;
  return {
    id: `${category}:${rawId}`,
    region_id: regionId,
    category,
    title,
    short_description: shortText(description),
    full_description: description,
    featured_image: media.featured_image,
    gallery: media.gallery,
    location: toLocation(row.latitude, row.longitude),
    tags: [],
    rating_score: null,
    category_data: {
      geological_age: String(row.geological_age || ''),
      climate: String(row.climate || ''),
      conservation: String(row.conservation || ''),
      width: row.width != null ? Number(row.width) : '',
      height: row.height != null ? Number(row.height) : '',
    },
    status: 'published',
    sort_order: 0,
    updated_at: String(row.updated_at || ''),
  };
}

async function fetchTopicMeta(path: string): Promise<number> {
  const res = await fetch(`${API_BASE}${path}/meta`);
  if (!res.ok) throw new Error(`meta failed: ${path}`);
  const meta = (await res.json()) as { version?: number };
  return Number(meta.version) || 1;
}

async function fetchTopicEntries(category: string, path: string): Promise<ExploreEntry[]> {
  const res = await fetch(`${API_BASE}${path}/entries`);
  if (!res.ok) throw new Error(`entries failed: ${path}`);
  const rows = (await res.json()) as Record<string, unknown>[];
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapTopicRowToEntry(category, row))
    .filter((entry): entry is ExploreEntry => Boolean(entry));
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
  const coordsValid =
    entry.location != null &&
    Number.isFinite(Number(entry.location.latitude)) &&
    Number.isFinite(Number(entry.location.longitude));

  return {
    id: entry.id,
    name: entry.title,
    image: absoluteMediaUrl(entry.featured_image?.url),
    description: entry.short_description || entry.full_description || '',
    latitude: coordsValid ? Number(entry.location!.latitude) : undefined,
    longitude: coordsValid ? Number(entry.location!.longitude) : undefined,
    hasLocation: coordsValid,
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
    address: entry.location?.address || String(entry.category_data?.venue || ''),
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
    const versions = await Promise.all(
      TOPIC_SOURCES.map((source) => fetchTopicMeta(source.path))
    );
    const remoteVersion = combineTopicVersions(versions);

    if (!force && cache && cache.version === remoteVersion && cache.entries.length > 0) {
      return { entries: cache.entries, version: cache.version, fromNetwork: false };
    }

    const batches = await Promise.all(
      TOPIC_SOURCES.map((source) => fetchTopicEntries(source.category, source.path))
    );
    const entries = batches.flat();

    const payload: CachePayload = {
      version: remoteVersion,
      entries,
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
