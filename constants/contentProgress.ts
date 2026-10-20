import AsyncStorage from '@react-native-async-storage/async-storage';

export type ContentReadProgress = {
  page: number;
  totalPages: number;
  updatedAt: string;
};

type ProgressMap = Record<string, ContentReadProgress>;

const STORAGE_KEY = 'content_read_progress_v1';

async function readMap(): Promise<ProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: ProgressMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function getContentProgress(
  contentId: string
): Promise<ContentReadProgress | null> {
  const map = await readMap();
  return map[contentId] || null;
}

export async function saveContentProgress(
  contentId: string,
  page: number,
  totalPages: number
): Promise<ContentReadProgress> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeTotal = Math.max(safePage, Math.floor(totalPages) || safePage);
  const entry: ContentReadProgress = {
    page: Math.min(safePage, safeTotal),
    totalPages: safeTotal,
    updatedAt: new Date().toISOString(),
  };
  const map = await readMap();
  map[contentId] = entry;
  await writeMap(map);
  return entry;
}
