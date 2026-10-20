import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clears learner-local progress tied to a subject on this device.
 * Used when the learner removes a subject from their home setup.
 */
export async function clearSubjectLocalData(
  gradeId: string,
  subjectId: string
): Promise<void> {
  const keys = [
    `lesson_progress_${gradeId}_${subjectId}`,
    `quiz_progress_${subjectId}`,
    `subtopic_progress_${subjectId}`,
  ];

  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // Best-effort cleanup — subject list update still proceeds.
  }
}
