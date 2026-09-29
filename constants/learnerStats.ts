import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'learner_xp';
const STREAK_KEY = 'learner_streak';

type StreakRecord = { count: number; lastDate: string };

// All XP/streak writes go through this queue so concurrent awards from
// different screens can't read the same old value and overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

async function readXp(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

async function readStreak(): Promise<StreakRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.count === 'number' && typeof parsed.lastDate === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getXp(): Promise<number> {
  return enqueue(readXp);
}

/** Adds (or with a negative amount, removes) XP. Resolves to the new total. */
export function addXp(amount: number): Promise<number> {
  return enqueue(async () => {
    const next = Math.max(0, (await readXp()) + amount);
    try {
      await AsyncStorage.setItem(XP_KEY, String(next));
    } catch {}
    return next;
  });
}

/** Current daily streak; 0 if the learner missed a day. */
export function getStreak(): Promise<number> {
  return enqueue(async () => {
    const record = await readStreak();
    if (!record) return 0;
    const today = localDateKey(new Date());
    return record.lastDate === today || record.lastDate === yesterdayKey() ? record.count : 0;
  });
}

/** Marks today as active and resolves to the updated streak. */
export function recordDailyActivity(): Promise<number> {
  return enqueue(async () => {
    const today = localDateKey(new Date());
    const record = await readStreak();
    let count = 1;
    if (record?.lastDate === today) count = record.count;
    else if (record?.lastDate === yesterdayKey()) count = record.count + 1;
    try {
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count, lastDate: today }));
    } catch {}
    return count;
  });
}
