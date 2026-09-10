import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURRICULUM_SUBJECTS, GRADE_OPTIONS } from '@/constants/curriculum';
import { setUserPath } from '@/constants/userPath';

// Official Namibian colors
const NAMIBIA_BLUE = '#002B7F';
const NAMIBIA_RED = '#D21034';
const NAMIBIA_GREEN = '#009A44';
const NAMIBIA_YELLOW = '#FFCE00';

export default function SelectGradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('gr11');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  const selectedGrade =
    GRADE_OPTIONS.find((g) => g.id === selectedGradeId) || GRADE_OPTIONS[1];

  const toggleSubject = (id: string) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedSubjectIds((prev) => [...prev, id]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedSubjectIds([]);
  };

  // Prevent going back to onboarding from select grade
  useEffect(() => {
    const onHardwareBack = () => {
      if (currentStep === 2) {
        setCurrentStep(1);
        return true; // handled, returns to Grade selection
      }
      router.replace('/choose-path');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [currentStep]);

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.replace('/choose-path');
    }
  };

  const isSubjectStep = currentStep === 2;
  const isSubmitDisabled = isSubjectStep && selectedSubjectIds.length === 0;

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedGradeId) return;
      setCurrentStep(2);
    } else {
      if (selectedSubjectIds.length === 0) return;
      try {
        await AsyncStorage.setItem('user_grade', selectedGrade.name);
        await AsyncStorage.setItem('user_subjects', JSON.stringify(selectedSubjectIds));
        await AsyncStorage.setItem('has_completed_onboarding', 'true');
        await AsyncStorage.setItem('has_selected_grade_and_subjects', 'true');
        await setUserPath('learner');
      } catch (e) {
        console.warn('Failed to save selected grade & subjects', e);
      }
      router.replace({
        pathname: '/home',
        params: {
          grade: selectedGrade.name,
          subjectsCount: selectedSubjectIds.length.toString(),
        },
      });
    }
  };

  const filteredSubjects = CURRICULUM_SUBJECTS.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Simple Clean Header (No Stepper) */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressedState]}
          hitSlop={10}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? 'Select Grade' : 'Select Subjects'}
        </Text>

        <View style={styles.headerSideSlot} />
      </View>

      {/* Screen Content */}
      {currentStep === 1 ? (
        /* STEP 1: Grade Selection */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingBox}>
            <Text style={styles.titleText}>What grade are you in?</Text>
            <Text style={styles.subtitleText}>
              Choose your grade level to personalize your textbooks and past papers.
            </Text>
          </View>

          <View style={styles.gradeGrid}>
            {GRADE_OPTIONS.map((grade) => {
              const isSelected = selectedGradeId === grade.id;
              return (
                <Pressable
                  key={grade.id}
                  style={({ pressed }) => [
                    styles.gradeCard,
                    isSelected && styles.gradeCardSelected,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => setSelectedGradeId(grade.id)}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.gradeIconBox, isSelected && styles.gradeIconBoxSelected]}>
                      <Text style={styles.gradeIcon}>{grade.icon}</Text>
                    </View>

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <Text style={styles.radioCheckmark}>✓</Text>}
                    </View>
                  </View>

                  <View style={styles.gradeTextGroup}>
                    <Text style={[styles.gradeName, isSelected && styles.gradeNameSelected]}>
                      {grade.name}
                    </Text>
                    <Text style={styles.gradePhase}>{grade.phase}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* STEP 2: Subject Selection */
        <View style={styles.subjectsContainer}>
          <View style={styles.subjectsHeaderBox}>
            <Text style={styles.titleText}>Choose your subjects</Text>
            <Text style={styles.subtitleText}>
              Selected for <Text style={styles.boldText}>{selectedGrade.name}</Text>
            </Text>

            {/* Simple Search & Deselect All controls */}
            <View style={styles.controlsRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search subjects..."
                  placeholderTextColor="#94A3B8"
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                  style={styles.searchInput}
                />
                {searchFilter.length > 0 && (
                  <Pressable onPress={() => setSearchFilter('')} hitSlop={8}>
                    <Text style={styles.clearSearch}>✕</Text>
                  </Pressable>
                )}
              </View>

              {selectedSubjectIds.length > 0 && (
                <Pressable
                  onPress={handleDeselectAll}
                  style={({ pressed }) => [
                    styles.deselectAllBtn,
                    pressed && styles.pressedState,
                  ]}
                >
                  <Text style={styles.deselectAllBtnText}>Deselect All</Text>
                </Pressable>
              )}
            </View>

            <Text
              style={[
                styles.counterText,
                selectedSubjectIds.length === 0 && styles.counterTextRequired,
              ]}
            >
              {selectedSubjectIds.length === 0
                ? '⚠️ Please select at least 1 subject to continue'
                : `${selectedSubjectIds.length} of ${CURRICULUM_SUBJECTS.length} subjects selected`}
            </Text>
          </View>

          <FlatList
            data={filteredSubjects}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.subjectRow}
            contentContainerStyle={styles.subjectListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedSubjectIds.includes(item.id);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.subjectCard,
                    isSelected && styles.subjectCardSelected,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => toggleSubject(item.id)}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.subjectIconBox,
                        isSelected && styles.subjectIconBoxSelected,
                      ]}
                    >
                      <Text style={styles.subjectEmoji}>{item.icon}</Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                  </View>

                  <View style={styles.subjectTextGroup}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.subjectName,
                        isSelected && styles.subjectNameSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.subjectCategory}>{item.category}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Bottom Action Button */}
      <View style={styles.bottomArea}>
        <Pressable
          onPress={handleNext}
          disabled={isSubmitDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            isSubmitDisabled && styles.primaryButtonDisabled,
            pressed && !isSubmitDisabled && styles.pressedState,
          ]}
        >
          <LinearGradient
            colors={
              isSubmitDisabled
                ? ['#94A3B8', '#64748B']
                : [NAMIBIA_BLUE, '#1A4BB8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            {!isSubmitDisabled && <View style={styles.buttonTopAccent} />}
            <Text style={styles.primaryButtonText}>
              {currentStep === 1
                ? 'Continue →'
                : selectedSubjectIds.length === 0
                ? 'Select at least 1 Subject'
                : `Start Learning (${selectedSubjectIds.length} Subject${selectedSubjectIds.length > 1 ? 's' : ''}) →`}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerSideSlot: {
    width: 38,
    height: 38,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: NAMIBIA_BLUE,
  },
  pressedState: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headingBox: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: NAMIBIA_BLUE,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gradeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 128,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  gradeCardSelected: {
    borderColor: NAMIBIA_BLUE,
    backgroundColor: '#F0F7FF',
    borderWidth: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gradeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeIconBoxSelected: {
    backgroundColor: '#DBEAFE',
  },
  gradeIcon: {
    fontSize: 18,
  },
  gradeTextGroup: {
    marginTop: 4,
  },
  gradeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  gradeNameSelected: {
    color: NAMIBIA_BLUE,
  },
  gradePhase: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: NAMIBIA_BLUE,
    backgroundColor: NAMIBIA_BLUE,
  },
  radioCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Subjects Step
  subjectsContainer: {
    flex: 1,
  },
  subjectsHeaderBox: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  clearSearch: {
    fontSize: 12,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  deselectAllBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: NAMIBIA_RED,
  },
  deselectAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAMIBIA_RED,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA_BLUE,
    marginTop: 8,
  },
  counterTextRequired: {
    color: NAMIBIA_RED,
    fontWeight: '700',
  },
  subjectRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  subjectListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  subjectCard: {
    flex: 1,
    maxWidth: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 112,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  subjectCardSelected: {
    borderColor: NAMIBIA_BLUE,
    backgroundColor: '#F0F7FF',
    borderWidth: 2,
  },
  subjectIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIconBoxSelected: {
    backgroundColor: '#DBEAFE',
  },
  subjectEmoji: {
    fontSize: 16,
  },
  subjectTextGroup: {
    marginTop: 6,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 17,
    marginBottom: 2,
  },
  subjectNameSelected: {
    color: NAMIBIA_BLUE,
  },
  subjectCategory: {
    fontSize: 11,
    color: '#64748B',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: NAMIBIA_BLUE,
    backgroundColor: NAMIBIA_BLUE,
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Bottom Button
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
    backgroundColor: '#FAFCFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryButton: {
    borderRadius: 26,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA_BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 43, 127, 0.22)',
      },
    }),
  },
  primaryButtonDisabled: {
    opacity: 0.65,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      },
    }),
  },
  primaryButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAMIBIA_YELLOW,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
