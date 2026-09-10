export type UserPath = 'learner' | 'explorer';

export const USER_PATH_KEY = 'user_path';

export async function getUserPath(): Promise<UserPath | null> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const value = await AsyncStorage.getItem(USER_PATH_KEY);
    if (value === 'learner' || value === 'explorer') return value;
    return null;
  } catch {
    return null;
  }
}

export async function setUserPath(path: UserPath): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(USER_PATH_KEY, path);
}
