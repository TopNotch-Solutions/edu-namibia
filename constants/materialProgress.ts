import AsyncStorage from '@react-native-async-storage/async-storage';

export type MaterialReadProgress = {
  page: number;
  totalPages: number;
  updatedAt: string;
};

type ProgressMap = Record<string, MaterialReadProgress>;

const STORAGE_KEY = 'material_read_progress_v1';

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

export async function getMaterialProgress(
  materialId: string
): Promise<MaterialReadProgress | null> {
  const map = await readMap();
  return map[materialId] || null;
}

export async function saveMaterialProgress(
  materialId: string,
  page: number,
  totalPages: number
): Promise<MaterialReadProgress> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeTotal = Math.max(safePage, Math.floor(totalPages) || safePage);
  const entry: MaterialReadProgress = {
    page: Math.min(safePage, safeTotal),
    totalPages: safeTotal,
    updatedAt: new Date().toISOString(),
  };
  const map = await readMap();
  map[materialId] = entry;
  await writeMap(map);
  return entry;
}
