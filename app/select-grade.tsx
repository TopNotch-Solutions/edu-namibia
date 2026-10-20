import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GRADE_OPTIONS,
  type GradeOption,
  getSubjectTopics,
  getSubjectsForGrade,
  resolveGradeId,
} from '@/constants/curriculum';
import { NAMIBIA, QUIZ_GRADIENT } from '@/constants/namibiaTheme';
import { isDeviceOnline } from '@/constants/network';
import {
  bootstrapLearnerOffline,
  type OfflineBootstrapProgress,
} from '@/constants/offlineBootstrap';
import { setUserPath } from '@/constants/userPath';

function FlagStrip() {
  return (
    <View style={styles.flagStrip}>
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.blue }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.red }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.green }]} />
      <View style={[styles.flagBand, { backgroundColor: NAMIBIA.yellow }]} />
    </View>
  );
}

const SCREEN_PAD = 20;
const CHIP_GAP = 10;
const CHIP_COLS = 4;
const CHIP_SIZE =
  (Dimensions.get('window').width - SCREEN_PAD * 2 - CHIP_GAP * (CHIP_COLS - 1)) / CHIP_COLS;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GradePhaseGroup = {
  title: string;
  subtitle: string;
  compact: boolean;
  accent: string;
  grades: GradeOption[];
};

type PhasePalette = {
  from: string;
  to: string;
  soft: string;
  label: string;
};

function gradeNumber(id: string): number {
  const match = /^gr(\d+)$/.exec(id);
  return match ? Number(match[1]) : 11;
}

function gradeNumberLabel(id: string): string {
  return String(gradeNumber(id));
}

function paletteForGrade(grade: GradeOption): PhasePalette {
  const n = gradeNumber(grade.id);
  if (n <= 0) {
    return {
      from: NAMIBIA.blue,
      to: NAMIBIA.blueDeep,
      soft: NAMIBIA.blueSoft,
      label: 'Pre-Primary',
    };
  }
  if (n <= 7) {
    return {
      from: NAMIBIA.green,
      to: NAMIBIA.greenDeep,
      soft: NAMIBIA.greenSoft,
      label: 'Primary',
    };
  }
  if (n <= 9) {
    return {
      from: NAMIBIA.blue,
      to: '#0F4C81',
      soft: NAMIBIA.blueSoft,
      label: 'Junior Secondary',
    };
  }
  if (n === 10) {
    return {
      from: NAMIBIA.red,
      to: '#9B0C28',
      soft: NAMIBIA.redSoft,
      label: 'Senior Secondary',
    };
  }
  if (n === 11) {
    return {
      from: NAMIBIA.blueDeep,
      to: NAMIBIA.blue,
      soft: NAMIBIA.blueSoft,
      label: 'Ordinary Level',
    };
  }
  return {
    from: '#C9A000',
    to: '#8A6E00',
    soft: NAMIBIA.yellowSoft,
    label: 'Advanced Subsidiary',
  };
}

function buildPhaseGroups(grades: GradeOption[]): GradePhaseGroup[] {
  const order = [
    'Pre-Primary',
    'Primary Education',
    'Junior Secondary',
    'Senior Secondary',
    'Ordinary Level',
    'Advanced Subsidiary Level',
  ];
  const accents: Record<string, string> = {
    'Pre-Primary': NAMIBIA.blue,
    'Primary Education': NAMIBIA.green,
    'Junior Secondary': NAMIBIA.blue,
    'Senior Secondary': NAMIBIA.red,
    'Ordinary Level': NAMIBIA.blueDeep,
    'Advanced Subsidiary Level': '#C9A000',
  };
  const map = new Map<string, GradeOption[]>();
  for (const grade of grades) {
    const list = map.get(grade.phase) ?? [];
    list.push(grade);
    map.set(grade.phase, list);
  }
  return order
    .filter((phase) => map.has(phase))
    .map((phase) => ({
      title: phase,
      subtitle:
        phase === 'Pre-Primary'
          ? 'Kindergarten'
          : phase === 'Primary Education'
            ? 'Grades 1 – 7'
            : phase === 'Junior Secondary'
              ? 'Grades 8 – 9'
              : phase === 'Senior Secondary'
                ? 'Grade 10'
                : phase === 'Ordinary Level'
                  ? 'NSSCO'
                  : 'NSSCAS',
      compact: phase === 'Pre-Primary' || phase === 'Primary Education',
      accent: accents[phase] ?? NAMIBIA.blue,
      grades: (map.get(phase) ?? []).slice().reverse(),
    }));
}

function triggerSelectHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

function GradeHero({ grade }: { grade: GradeOption }) {
  const palette = paletteForGrade(grade);
  const number = gradeNumberLabel(grade.id);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(0.86);
    pulse.set(
      withSequence(
        withSpring(1.08, { damping: 12, stiffness: 220 }),
        withSpring(1, { damping: 14, stiffness: 180 })
      )
    );
  }, [grade.id, pulse]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.get() }],
  }));

  const softGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.get() * 0.25,
    transform: [{ scale: 0.92 + pulse.get() * 0.08 }],
  }));

  return (
    <Animated.View
      key={grade.id}
      entering={FadeIn.duration(280)}
      layout={LinearTransition.springify().damping(18)}
      style={styles.heroWrap}
    >
      <LinearGradient
        colors={[palette.from, palette.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <FlagStrip />
        <Animated.View style={[styles.heroGlow, softGlowStyle]} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>Namibia curriculum</Text>
          <Text style={styles.heroEyebrow}>{palette.label}</Text>
          <Text style={styles.heroTitle}>{grade.name}</Text>
          <Text style={styles.heroSubtitle}>{grade.phase}</Text>
        </View>
        <Animated.Text style={[styles.heroNumber, numberStyle]}>{number}</Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

function GradeTile({
  grade,
  selected,
  index,
  compact,
  accent,
  onSelect,
}: {
  grade: GradeOption;
  selected: boolean;
  index: number;
  compact: boolean;
  accent: string;
  onSelect: (id: string) => void;
}) {
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedProgress.set(
      withSpring(selected ? 1 : 0, { damping: 16, stiffness: 200 })
    );
    if (selected) {
      scale.set(
        withSequence(
          withSpring(1.08, { damping: 12, stiffness: 260 }),
          withSpring(1, { damping: 14, stiffness: 200 })
        )
      );
    }
  }, [selected, scale, selectedProgress]);

  const compactColors = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.get(),
      [0, 1],
      ['#FFFFFF', accent]
    ),
    borderColor: interpolateColor(
      selectedProgress.get(),
      [0, 1],
      ['#E2E8F0', accent]
    ),
  }));

  const rowColors = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.get(),
      [0, 1],
      ['#FFFFFF', '#F8FAFF']
    ),
    borderColor: interpolateColor(
      selectedProgress.get(),
      [0, 1],
      ['#E2E8F0', accent]
    ),
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.get(), [0, 1], [accent, '#FFFFFF']),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      selectedProgress.get(),
      [0, 1],
      ['#64748B', 'rgba(255,255,255,0.88)']
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.get(), [0, 1], ['#0F172A', accent]),
  }));

  const handlePress = () => {
    triggerSelectHaptic();
    onSelect(grade.id);
  };

  if (compact) {
    return (
      <Animated.View
        entering={FadeInDown.delay(40 + index * 35)
          .springify()
          .damping(16)}
      >
        <Animated.View style={scaleStyle}>
          <AnimatedPressable
            onPress={handlePress}
            style={[styles.gradeTile, compactColors]}
          >
            {selected ? <View style={styles.tileAccent} /> : null}
            <Animated.Text style={[styles.gradeTileNum, numberStyle]}>
              {gradeNumberLabel(grade.id)}
            </Animated.Text>
            {grade.id === 'gr0' ? (
              <Animated.Text style={[styles.gradeTileTag, labelStyle]}>Pre</Animated.Text>
            ) : null}
          </AnimatedPressable>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(60 + index * 45)
        .springify()
        .damping(16)}
    >
      <Animated.View style={scaleStyle}>
        <AnimatedPressable
          onPress={handlePress}
          style={[styles.gradeRow, rowColors]}
        >
          <View style={[styles.gradeRowNum, selected && { backgroundColor: accent }]}>
            <Animated.Text
              style={[
                styles.gradeRowNumText,
                selected ? styles.gradeRowNumTextOn : { color: accent },
              ]}
            >
              {gradeNumberLabel(grade.id)}
            </Animated.Text>
          </View>
          <View style={styles.gradeRowCopy}>
            <Animated.Text style={[styles.gradeRowTitle, titleStyle]}>
              {grade.name}
            </Animated.Text>
            <Text style={styles.gradeRowPhase}>{grade.phase}</Text>
          </View>
          <View style={[styles.radio, selected && { borderColor: accent }]}>
            {selected ? (
              <Animated.View
                entering={FadeIn.duration(160)}
                style={[styles.radioInner, { backgroundColor: accent }]}
              />
            ) : null}
          </View>
        </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function SelectGradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('gr11');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [hasExistingSetup, setHasExistingSetup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<OfflineBootstrapProgress | null>(
    null
  );

  const phaseGroups = useMemo(() => buildPhaseGroups(GRADE_OPTIONS), []);
  const selectedGrade =
    GRADE_OPTIONS.find((g) => g.id === selectedGradeId) || GRADE_OPTIONS[1];
  const selectedPalette = paletteForGrade(selectedGrade);

  const stepSV = useSharedValue(1);

  useEffect(() => {
    stepSV.set(withTiming(currentStep, { duration: 260 }));
  }, [currentStep, stepSV]);

  const stepLineStyle = useAnimatedStyle(() => ({
    width: 18 + (stepSV.get() - 1) * 18,
    backgroundColor: interpolateColor(
      stepSV.get(),
      [1, 2],
      [NAMIBIA.line, NAMIBIA.blue]
    ),
  }));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [flag, storedGradeId, storedGradeName, storedSubjects] = await Promise.all([
          AsyncStorage.getItem('has_selected_grade_and_subjects'),
          AsyncStorage.getItem('user_grade_id'),
          AsyncStorage.getItem('user_grade'),
          AsyncStorage.getItem('user_subjects'),
        ]);
        if (!active) return;

        setHasExistingSetup(flag === 'true' || Boolean(storedGradeId || storedGradeName));

        if (storedGradeId || storedGradeName) {
          setSelectedGradeId(resolveGradeId(storedGradeId || storedGradeName));
        }
        if (storedSubjects) {
          const parsed = JSON.parse(storedSubjects);
          if (Array.isArray(parsed)) {
            setSelectedSubjectIds(parsed.filter((id) => typeof id === 'string'));
          }
        }
      } catch (e) {
        console.warn('Failed to load existing curriculum setup', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleSubject = (id: string) => {
    triggerSelectHaptic();
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedSubjectIds((prev) => [...prev, id]);
    }
  };

  const handleDeselectAll = () => {
    setSelectedSubjectIds([]);
  };

  const leaveSetup = useCallback(() => {
    router.replace(hasExistingSetup ? '/home' : '/choose-path');
  }, [hasExistingSetup, router]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (currentStep === 2) {
        setCurrentStep(1);
        return true;
      }
      leaveSetup();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [currentStep, leaveSetup]);

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      leaveSetup();
    }
  };

  const isSubjectStep = currentStep === 2;
  const isSubmitDisabled = isSubjectStep && selectedSubjectIds.length === 0;

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!selectedGradeId) return;
      triggerSelectHaptic();
      const online = await isDeviceOnline();
      if (!online) {
        Alert.alert(
          'Internet required',
          'Connect to the internet to choose your grade. We download all learning content so you can study fully offline afterwards.'
        );
        return;
      }
      const allowed = new Set(getSubjectsForGrade(selectedGradeId).map((s) => s.id));
      setSelectedSubjectIds((prev) => prev.filter((id) => allowed.has(id)));
      setCurrentStep(2);
      return;
    }

    if (selectedSubjectIds.length === 0 || isDownloading) return;

    const online = await isDeviceOnline();
    if (!online) {
      Alert.alert(
        'Internet required',
        'Connect to the internet to save your subjects. The app will download curriculum, quizzes, lessons, and files so you can learn offline.'
      );
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({
      phase: 'checking',
      message: 'Preparing offline download…',
    });

    try {
      const result = await bootstrapLearnerOffline({
        gradeId: selectedGrade.id,
        subjectIds: selectedSubjectIds,
        onProgress: setDownloadProgress,
      });

      if (!result.ok) {
        Alert.alert(
          'Download failed',
          result.error ||
            'Could not save content for offline use. Connect to the internet and try again.'
        );
        return;
      }

      await AsyncStorage.setItem('user_grade_id', selectedGrade.id);
      await AsyncStorage.setItem('user_grade', selectedGrade.name);
      await AsyncStorage.setItem('user_subjects', JSON.stringify(selectedSubjectIds));
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      await AsyncStorage.setItem('has_selected_grade_and_subjects', 'true');
      await AsyncStorage.setItem('offline_content_ready', 'true');
      await setUserPath('learner');

      router.replace({
        pathname: '/home',
        params: {
          gradeId: selectedGrade.id,
          grade: selectedGrade.name,
          subjectsCount: selectedSubjectIds.length.toString(),
        },
      });
    } catch (e) {
      console.warn('Failed to save selected grade & subjects', e);
      Alert.alert(
        'Download failed',
        'Something went wrong while saving offline content. Check your connection and try again.'
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const gradeSubjects = useMemo(
    () => getSubjectsForGrade(selectedGradeId),
    [selectedGradeId]
  );

  const filteredSubjects = gradeSubjects.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  let tileIndex = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[NAMIBIA.sand, NAMIBIA.blueSoft, NAMIBIA.white]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressedState]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={NAMIBIA.ink} />
        </Pressable>

        <View style={styles.stepTrack}>
          <View style={[styles.stepDot, styles.stepDotOn]} />
          <Animated.View style={[styles.stepLine, stepLineStyle]} />
          <View style={[styles.stepDot, currentStep === 2 && styles.stepDotOn]} />
        </View>

        {currentStep === 1 && hasExistingSetup ? (
          <Pressable
            onPress={leaveSetup}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedState]}
            hitSlop={10}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSideSlot} />
        )}
      </View>

      {currentStep === 1 ? (
        <Animated.View
          key="step-grade"
          entering={FadeInRight.duration(280)}
          exiting={FadeOutLeft.duration(180)}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headingBox}>
              <View style={styles.stepPill}>
                <Text style={styles.eyebrow}>Step 1 of 2</Text>
              </View>
              <Text style={styles.titleText}>
                {hasExistingSetup ? 'Update your grade' : 'Pick your grade'}
              </Text>
              <Text style={styles.subtitleText}>
                Choose your Namibian curriculum level. Your subjects will match this grade.
              </Text>
            </View>

            <GradeHero grade={selectedGrade} />

            {phaseGroups.map((group) => (
              <View key={group.title} style={styles.phaseSection}>
                <View style={styles.phaseHeader}>
                  <View style={[styles.phaseDot, { backgroundColor: group.accent }]} />
                  <Text style={styles.phaseTitle}>{group.title}</Text>
                  <Text style={styles.phaseSubtitle}>{group.subtitle}</Text>
                </View>

                <View style={group.compact ? styles.gradeChipRow : styles.gradeListCol}>
                  {group.grades.map((grade) => {
                    const index = tileIndex++;
                    return (
                      <GradeTile
                        key={grade.id}
                        grade={grade}
                        selected={selectedGradeId === grade.id}
                        index={index}
                        compact={group.compact}
                        accent={group.accent}
                        onSelect={setSelectedGradeId}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          key="step-subjects"
          entering={FadeInRight.duration(280)}
          exiting={FadeOut.duration(160)}
          style={styles.flex}
        >
          <View style={styles.subjectsContainer}>
            <View style={styles.subjectsHeaderBox}>
              <LinearGradient
                colors={[...QUIZ_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subjectsHero}
              >
                <FlagStrip />
                <Text style={styles.heroKicker}>Step 2 of 2</Text>
                <Text style={styles.subjectsHeroTitle}>Choose subjects</Text>
                <Text style={styles.subjectsHeroSub}>
                  Select what you take for {selectedGrade.name}. You can add or remove later
                  from home.
                </Text>
                <View style={styles.subjectsHeroStat}>
                  <Text style={styles.subjectsHeroStatValue}>
                    {selectedSubjectIds.length}
                  </Text>
                  <Text style={styles.subjectsHeroStatLabel}>
                    of {gradeSubjects.length} selected
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.controlsRow}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color={NAMIBIA.muted} />
                  <TextInput
                    placeholder="Search subjects..."
                    placeholderTextColor={NAMIBIA.muted}
                    value={searchFilter}
                    onChangeText={setSearchFilter}
                    style={styles.searchInput}
                  />
                  {searchFilter.length > 0 && (
                    <Pressable onPress={() => setSearchFilter('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color={NAMIBIA.muted} />
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
                    <Text style={styles.deselectAllBtnText}>Clear</Text>
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
                  ? 'Select at least 1 subject to continue'
                  : `${selectedSubjectIds.length} subject${selectedSubjectIds.length === 1 ? '' : 's'} ready`}
              </Text>
            </View>

            <FlatList
              data={filteredSubjects}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.subjectRow}
              contentContainerStyle={styles.subjectListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySubjects}>
                  <Ionicons name="search-outline" size={36} color={NAMIBIA.blue} />
                  <Text style={styles.emptySubjectsTitle}>Subjects not found</Text>
                  <Text style={styles.emptySubjectsText}>
                    Try another search term for {selectedGrade.name}.
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isSelected = selectedSubjectIds.includes(item.id);
                const topicCount = getSubjectTopics(item.id, selectedGradeId).length;
                return (
                  <Animated.View
                    entering={FadeInDown.delay(Math.min(index, 10) * 30)
                      .springify()
                      .damping(18)}
                    style={styles.subjectCardWrap}
                  >
                    <Pressable
                      style={[
                        styles.subjectCard,
                        isSelected && styles.subjectCardSelected,
                      ]}
                      onPress={() => toggleSubject(item.id)}
                    >
                      {isSelected ? <View style={styles.subjectCardAccent} /> : null}
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.subjectIconBox,
                            {
                              backgroundColor: isSelected
                                ? NAMIBIA.blueSoft
                                : NAMIBIA.sand,
                            },
                          ]}
                        >
                          <Text style={styles.subjectEmoji}>{item.icon}</Text>
                        </View>
                        <View
                          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                        >
                          {isSelected ? (
                            <Ionicons name="checkmark" size={14} color={NAMIBIA.white} />
                          ) : null}
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
                        <View
                          style={[
                            styles.subjectCategoryChip,
                            isSelected && styles.subjectCategoryChipOn,
                          ]}
                        >
                          <Text
                            style={[
                              styles.subjectCategory,
                              isSelected && styles.subjectCategoryOn,
                            ]}
                          >
                            {item.category}
                          </Text>
                        </View>
                        {topicCount > 0 ? (
                          <Text style={styles.subjectTopicsHint}>
                            {topicCount} topics
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              }}
            />
          </View>
        </Animated.View>
      )}

      <View style={styles.bottomArea}>
        {currentStep === 1 && (
          <Animated.View
            key={selectedGrade.id}
            entering={FadeIn.duration(220)}
            style={styles.selectionPreview}
          >
            <Text style={styles.selectionPreviewLabel}>Selected grade</Text>
            <Text style={styles.selectionPreviewValue}>
              {selectedGrade.name}
            </Text>
          </Animated.View>
        )}

        <Pressable
          onPress={() => {
            void handleNext();
          }}
          disabled={isSubmitDisabled || isDownloading}
          style={({ pressed }) => [
            styles.primaryButton,
            (isSubmitDisabled || isDownloading) && styles.primaryButtonDisabled,
            pressed && !isSubmitDisabled && !isDownloading && styles.pressedState,
          ]}
        >
          <LinearGradient
            colors={
              isSubmitDisabled || isDownloading
                ? ['#94A3B8', '#64748B']
                : [...QUIZ_GRADIENT]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            {!isSubmitDisabled && !isDownloading && <FlagStrip />}
            <Text style={styles.primaryButtonText}>
              {currentStep === 1
                ? 'Continue to subjects →'
                : selectedSubjectIds.length === 0
                  ? 'Select at least 1 subject'
                  : `Download & start (${selectedSubjectIds.length})`}
            </Text>
          </LinearGradient>
        </Pressable>

        {currentStep === 2 ? (
          <Text style={styles.bottomHint}>
            Internet is required once to download your grade content. After that you can study
            fully offline.
          </Text>
        ) : null}

        {isSubmitDisabled && (
          <Text style={styles.bottomHint}>
            Tap the subjects you take. You can change them later from home.
          </Text>
        )}
      </View>

      <Modal visible={isDownloading} transparent animationType="fade">
        <View style={styles.downloadBackdrop}>
          <View style={styles.downloadCard}>
            <FlagStrip />
            <ActivityIndicator size="large" color={NAMIBIA.blue} style={{ marginTop: 18 }} />
            <Text style={styles.downloadTitle}>Saving for offline</Text>
            <Text style={styles.downloadMessage}>
              {downloadProgress?.message || 'Downloading your learning content…'}
            </Text>
            {downloadProgress?.total ? (
              <Text style={styles.downloadCount}>
                {downloadProgress.current || 0} / {downloadProgress.total}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAMIBIA.sand,
  },
  flex: {
    flex: 1,
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
    zIndex: 2,
  },
  flagBand: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAMIBIA.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  headerSideSlot: {
    width: 56,
    height: 40,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  stepDotOn: {
    backgroundColor: NAMIBIA.blue,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: NAMIBIA.line,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: NAMIBIA.white,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAMIBIA.muted,
  },
  pressedState: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 4,
    paddingBottom: 28,
  },
  headingBox: {
    marginBottom: 16,
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: NAMIBIA.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.blue,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: NAMIBIA.ink,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: NAMIBIA.muted,
    lineHeight: 20,
  },
  heroWrap: {
    marginBottom: 22,
  },
  heroCard: {
    borderRadius: 22,
    minHeight: 148,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA.blueDeep,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 10px 28px rgba(0, 43, 127, 0.2)' },
    }),
  },
  heroGlow: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
    zIndex: 1,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.yellow,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: NAMIBIA.white,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  heroNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: -3,
    lineHeight: 72,
    zIndex: 1,
  },
  phaseSection: {
    marginBottom: 22,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAMIBIA.ink,
    flex: 1,
  },
  phaseSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
  },
  gradeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
  },
  gradeListCol: {
    gap: 10,
  },
  gradeTile: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAMIBIA.yellow,
    zIndex: 2,
  },
  gradeTileNum: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  gradeTileTag: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  gradeRowNum: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: NAMIBIA.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeRowNumText: {
    fontSize: 18,
    fontWeight: '900',
  },
  gradeRowNumTextOn: {
    color: '#FFFFFF',
  },
  gradeRowCopy: {
    flex: 1,
  },
  gradeRowTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  gradeRowPhase: {
    fontSize: 12,
    color: '#64748B',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  subjectsContainer: {
    flex: 1,
  },
  subjectsHeaderBox: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 4,
    paddingBottom: 4,
  },
  subjectsHero: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  subjectsHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: NAMIBIA.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subjectsHeroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
    marginBottom: 12,
  },
  subjectsHeroStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  subjectsHeroStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: NAMIBIA.yellow,
  },
  subjectsHeroStatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: NAMIBIA.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: NAMIBIA.ink,
    paddingVertical: 0,
  },
  deselectAllBtn: {
    backgroundColor: NAMIBIA.redSoft,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: NAMIBIA.red,
  },
  deselectAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAMIBIA.red,
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: NAMIBIA.blue,
    marginTop: 12,
    marginBottom: 4,
  },
  counterTextRequired: {
    color: NAMIBIA.red,
  },
  emptySubjects: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptySubjectsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginTop: 8,
  },
  emptySubjectsText: {
    fontSize: 13,
    color: NAMIBIA.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  subjectRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  subjectListContent: {
    paddingHorizontal: SCREEN_PAD,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  subjectCardWrap: {
    flex: 1,
    maxWidth: '48.5%',
  },
  subjectCard: {
    flex: 1,
    backgroundColor: NAMIBIA.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
    minHeight: 124,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  subjectCardSelected: {
    borderColor: NAMIBIA.blue,
    backgroundColor: NAMIBIA.blueSoft,
  },
  subjectCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAMIBIA.yellow,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectEmoji: {
    fontSize: 16,
  },
  subjectTextGroup: {
    marginTop: 2,
    gap: 4,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: NAMIBIA.ink,
    lineHeight: 17,
  },
  subjectNameSelected: {
    color: NAMIBIA.blueDeep,
  },
  subjectCategoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: NAMIBIA.sand,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectCategoryChipOn: {
    backgroundColor: NAMIBIA.white,
  },
  subjectCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: NAMIBIA.muted,
  },
  subjectCategoryOn: {
    color: NAMIBIA.blue,
  },
  subjectTopicsHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: NAMIBIA.greenDeep,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: NAMIBIA.green,
    backgroundColor: NAMIBIA.green,
  },

  bottomArea: {
    paddingHorizontal: SCREEN_PAD,
    paddingBottom: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NAMIBIA.line,
    backgroundColor: NAMIBIA.white,
  },
  selectionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: NAMIBIA.blueSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  selectionPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
  },
  selectionPreviewValue: {
    fontSize: 14,
    fontWeight: '800',
    color: NAMIBIA.blueDeep,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: NAMIBIA.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0, 43, 127, 0.22)' },
    }),
  },
  primaryButtonDisabled: {
    opacity: 0.65,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      web: { boxShadow: 'none' },
    }),
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  primaryButtonText: {
    color: NAMIBIA.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomHint: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 18,
    color: NAMIBIA.muted,
    textAlign: 'center',
  },
  downloadBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 51, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  downloadCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: NAMIBIA.white,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  downloadTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '900',
    color: NAMIBIA.ink,
  },
  downloadMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: NAMIBIA.muted,
    textAlign: 'center',
  },
  downloadCount: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: NAMIBIA.blue,
  },
});
