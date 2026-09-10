import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURRICULUM_SUBJECTS, getSubjectById, SubjectOption } from '@/constants/curriculum';
import {
  getAllQuizSets,
  getTopicBestSummary,
  getTopicEntries,
  getQuizSetsForTopic,
  isQuizCompleted,
  loadSubjectQuizProgress,
  sessionKey,
  SubjectQuizProgressMap,
  type QuizModeKey,
} from '@/constants/quizProgress';
import {
  ContentModule,
  getSubjectStudyData,
  LessonSubtopic,
  SubjectStudyData,
  TextbookItem,
} from '@/constants/subjectData';
import { getNextUnrepeatedFact, SubjectFact } from '@/constants/subjectFacts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Official Namibian colors
const NAMIBIA_GREEN = '#009A44';

type StudyTab = 'content' | 'quizzes' | 'textbooks' | 'summaries';
type QuizMode = QuizModeKey;

export default function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; grade?: string }>();
  const insets = useSafeAreaInsets();

  // Selected subject resolution
  const subjectId = params.id || 'phys';
  const resolvedSubject: SubjectOption = useMemo(() => {
    return (
      getSubjectById(subjectId) ||
      CURRICULUM_SUBJECTS[1] ||
      CURRICULUM_SUBJECTS[0]
    );
  }, [subjectId]);

  const activeGrade = params.grade || 'Grade 11 (NSSCO)';

  // Study data for this subject
  const studyData: SubjectStudyData = useMemo(() => {
    return getSubjectStudyData(resolvedSubject.id, resolvedSubject.name, resolvedSubject.category);
  }, [resolvedSubject]);

  // Tab state
  const [activeTab, setActiveTab] = useState<StudyTab>('content');

  // Gamification & User Stats
  const [xp, setXp] = useState<number>(350);
  const [streak] = useState<number>(3);

  // Tab 1: Content Module Accordion State
  const [expandedModuleId, setExpandedModuleId] = useState<string>(studyData.modules[0]?.id || 'mod-1');
  const [completedSubtopics, setCompletedSubtopics] = useState<Record<string, boolean>>({
    'sub-1-1': true,
  });

  // Tab 2: Quiz hub state
  const [quizMode, setQuizMode] = useState<QuizMode>('topicPractice');
  const [quizProgressMap, setQuizProgressMap] = useState<SubjectQuizProgressMap>({});
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Tab 3: Textbooks E-Reader State
  const [textbookCategory, setTextbookCategory] = useState<string>('All');
  const [downloadedBookIds, setDownloadedBookIds] = useState<Record<string, boolean>>({
    'tb-1': true,
    'tb-2': true,
  });
  const [activeReaderBook, setActiveReaderBook] = useState<TextbookItem | null>(null);
  const [readerCurrentChapter, setReaderCurrentChapter] = useState<number>(1);
  const [readerSearchTerm, setReaderSearchTerm] = useState<string>('');
  const [activeHighlightColor, setActiveHighlightColor] = useState<string>('#FEF08A'); // yellow
  const [showChapterJumpSheet, setShowChapterJumpSheet] = useState<boolean>(false);

  // Tab 4: Summaries State
  const [summarySectionFilter, setSummarySectionFilter] = useState<'All' | 'Formulas' | 'Definitions' | 'MindMaps' | 'CheatSheets'>('All');
  const [selectedMindMapModal, setSelectedMindMapModal] = useState<string | null>(null);

  // Did You Know State (Unrepeated fact on each subject open)
  const [didYouKnowFact, setDidYouKnowFact] = useState<SubjectFact | null>(null);
  const [showDidYouKnowModal, setShowDidYouKnowModal] = useState<boolean>(false);
  const [hasAwardedFactXp, setHasAwardedFactXp] = useState<boolean>(false);
  const [factsProgress, setFactsProgress] = useState<{ total: number; remaining: number }>({
    total: 100,
    remaining: 99,
  });

  const fetchNewFact = async (openModal = true) => {
    try {
      const { fact, totalFactsCount, remainingCount } = await getNextUnrepeatedFact(
        resolvedSubject.id,
        AsyncStorage
      );
      setDidYouKnowFact(fact);
      setFactsProgress({ total: totalFactsCount, remaining: remainingCount });
      if (openModal) {
        setShowDidYouKnowModal(true);
        if (!hasAwardedFactXp) {
          setHasAwardedFactXp(true);
          setXp((prev) => {
            const nextXp = prev + 15;
            AsyncStorage.setItem('learner_xp', nextXp.toString()).catch(() => {});
            return nextXp;
          });
        }
      }
    } catch (e) {
      console.warn('Error fetching Did You Know fact', e);
    }
  };

  // Automatically fetch an unrepeated fact when the learner opens this subject
  useEffect(() => {
    fetchNewFact(true);
  }, [resolvedSubject.id]);

  // Load XP from storage
  useEffect(() => {
    AsyncStorage.getItem('learner_xp').then((savedXp) => {
      if (savedXp) setXp(parseInt(savedXp, 10));
    });
  }, []);

  const saveXp = async (newXp: number) => {
    setXp(newXp);
    try {
      await AsyncStorage.setItem('learner_xp', newXp.toString());
    } catch {}
  };

  // Toggle Subtopic Completion
  const toggleSubtopicCompleted = (subtopicId: string) => {
    setCompletedSubtopics((prev) => {
      const next = !prev[subtopicId];
      if (next) {
        saveXp(xp + 25);
      }
      return { ...prev, [subtopicId]: next };
    });
  };

  // Refresh quiz progress when returning from quiz page
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSubjectQuizProgress(resolvedSubject.id).then((map) => {
        if (active) setQuizProgressMap(map);
      });
      return () => {
        active = false;
      };
    }, [resolvedSubject.id])
  );

  // Topic practice cards (2-column)
  const topicPracticeEntries = useMemo(
    () => getTopicEntries(studyData.quizQuestions.topicPractice),
    [studyData]
  );

  const pastPaperEntries = useMemo(
    () => getTopicEntries(studyData.quizQuestions.pastPapers),
    [studyData]
  );

  const openTopicQuizzes = (topic: string, mode: QuizMode = 'topicPractice') => {
    router.push({
      pathname: '/topic-quizzes',
      params: {
        id: resolvedSubject.id,
        grade: activeGrade,
        topic,
        mode,
      },
    });
  };

  const openCompetitionQuiz = (
    topic: string,
    quizId: string,
    resume = false,
    review = false
  ) => {
    router.push({
      pathname: '/quiz',
      params: {
        id: resolvedSubject.id,
        grade: activeGrade,
        mode: 'competition',
        topic,
        quizId,
        resume: resume ? '1' : '0',
        review: review ? '1' : '0',
      },
    });
  };

  const openQuiz = (mode: QuizMode, topic?: string, resume = false) => {
    router.push({
      pathname: '/quiz',
      params: {
        id: resolvedSubject.id,
        grade: activeGrade,
        mode,
        topic: topic || '',
        resume: resume ? '1' : '0',
      },
    });
  };

  const toggleBookDownload = (bookId: string) => {
    setDownloadedBookIds((prev) => {
      const isDownloaded = !prev[bookId];
      if (isDownloaded) {
        Alert.alert('Offline Storage Encrypted 📲', 'Textbook downloaded successfully and stored locally for offline revision.');
      }
      return { ...prev, [bookId]: isDownloaded };
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Bar */}
      <View style={styles.topNavbar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressedState]}
          hitSlop={10}
        >
          <Text style={styles.backBtnIcon}>←</Text>
        </Pressable>

        <View style={styles.navTitleGroup}>
          <Text style={styles.navSubjectTitle} numberOfLines={1}>
            {resolvedSubject.icon} {resolvedSubject.name}
          </Text>
          <Text style={styles.navGradeSubtitle} numberOfLines={1}>
            {activeGrade} • MoEAC Syllabus
          </Text>
        </View>

        <Pressable
          onPress={() => setShowLeaderboard(true)}
          style={({ pressed }) => [styles.xpChip, pressed && styles.pressedState]}
          hitSlop={8}
        >
          <Text style={styles.xpChipText}>{xp} XP</Text>
        </Pressable>
      </View>

      {/* Main Tab View Area */}
      <View style={styles.mainContent}>
        {/* TAB 1: INTERACTIVE CONTENT LESSON MODULES */}
        {activeTab === 'content' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Subject Hero Header Card */}
            <View style={styles.subjectHeroCard}>
              <Image
                source={{ uri: resolvedSubject.namibianImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                priority="high"
              />
              <View style={styles.heroOverlay} />

              <View style={styles.heroInnerContent}>
                <View style={styles.heroPillRow}>
                  <View style={styles.heroCategoryPill}>
                    <Text style={styles.heroCategoryPillText}>
                      {resolvedSubject.category} • {resolvedSubject.code}
                    </Text>
                  </View>
                  <View style={styles.heroPillsRight}>
                    <Pressable
                      onPress={() => fetchNewFact(true)}
                      style={({ pressed }) => [styles.heroFactPill, pressed && styles.pressedState]}
                      hitSlop={6}
                    >
                      <Text style={styles.heroFactPillText}>Did You Know?</Text>
                    </Pressable>
                    <View style={styles.heroStreakPill}>
                      <Text style={styles.heroStreakPillText}>{streak}x streak</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.heroTitle}>{resolvedSubject.name}</Text>
                <Text style={styles.heroContextSubtitle}>{resolvedSubject.namibianContext}</Text>

                {didYouKnowFact && (
                  <Pressable
                    onPress={() => setShowDidYouKnowModal(true)}
                    style={({ pressed }) => [styles.heroFactBanner, pressed && styles.pressedState]}
                  >
                    <Text style={styles.heroFactBannerText} numberOfLines={1}>
                      Fact: {didYouKnowFact.title}
                    </Text>
                    <Text style={styles.heroFactBannerArrow}>→</Text>
                  </Pressable>
                )}

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNum}>{studyData.modules.length}</Text>
                    <Text style={styles.heroStatLabel}>Units</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNum}>
                      {studyData.modules.reduce((acc, m) => acc + m.subtopics.length, 0)}
                    </Text>
                    <Text style={styles.heroStatLabel}>Bite Lessons</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatNum}>{studyData.textbooks.length}</Text>
                    <Text style={styles.heroStatLabel}>Books</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Syllabus Roadmap Title */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Interactive Lesson Modules</Text>
                <Text style={styles.sectionSubheading}>
                  Junior Secondary & Senior Secondary syllabus units
                </Text>
              </View>
            </View>

            {/* Accordion Module List */}
            {studyData.modules.map((module) => {
              const isExpanded = expandedModuleId === module.id;
              return (
                <View key={module.id} style={styles.accordionContainer}>
                  {/* Module Header Bar */}
                  <Pressable
                    onPress={() => setExpandedModuleId(isExpanded ? '' : module.id)}
                    style={({ pressed }) => [
                      styles.accordionHeader,
                      isExpanded && styles.accordionHeaderActive,
                      pressed && styles.pressedState,
                    ]}
                  >
                    <View style={styles.accordionHeaderLeft}>
                      <View style={[styles.unitBadge, isExpanded && styles.unitBadgeActive]}>
                        <Text style={[styles.unitBadgeText, isExpanded && styles.unitBadgeTextActive]}>
                          U{module.unitNumber}
                        </Text>
                      </View>
                      <View style={styles.unitTitleWrapper}>
                        <Text style={styles.unitTitleText}>{module.unitTitle}</Text>
                        <Text style={styles.unitMetaText}>
                          {module.curriculumLevel} • {module.subtopicsCount} Sub-topics • {module.estimatedHours}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.expandChevronCircle, isExpanded && styles.expandChevronActive]}>
                      <Text style={styles.expandChevronText}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </Pressable>

                  {/* Expanded Sub-topics & Lesson Cards */}
                  {isExpanded && (
                    <View style={styles.subtopicsContainer}>
                      {module.subtopics.map((subtopic, index) => {
                        const isDone = completedSubtopics[subtopic.id];
                        return (
                          <View key={subtopic.id} style={styles.subtopicCard}>
                            {/* Subtopic Header */}
                            <View style={styles.subtopicTopRow}>
                              <Pressable
                                onPress={() => toggleSubtopicCompleted(subtopic.id)}
                                style={styles.completionCheckbox}
                                hitSlop={8}
                              >
                                <View style={[styles.checkboxBox, isDone && styles.checkboxBoxDone]}>
                                  {isDone && <Text style={styles.checkMark}>✓</Text>}
                                </View>
                              </Pressable>

                              <View style={styles.subtopicTitleGroup}>
                                <Text style={styles.subtopicNumber}>
                                  Lesson {module.unitNumber}.{index + 1}
                                </Text>
                                <Text style={styles.subtopicTitle}>{subtopic.title}</Text>
                              </View>

                              <View style={styles.durationPill}>
                                <Text style={styles.durationText}>{subtopic.durationMinutes} min</Text>
                              </View>
                            </View>

                            {/* Concept Explanation Card */}
                            <View style={styles.conceptBox}>
                              <Text style={styles.conceptBoxTitle}>Quick Concept Explanation</Text>
                              <Text style={styles.conceptText}>{subtopic.conceptSummary}</Text>
                            </View>

                            {/* Worked-out calculation example (Crucial for Math & Sciences) */}
                            {subtopic.workedExample && (
                              <View style={styles.workedExampleBox}>
                                <View style={styles.workedExampleHeader}>
                                  <Text style={styles.workedExampleTitle}>
                                    Worked-Out Calculation Example
                                  </Text>
                                  <View style={styles.examMarkBadge}>
                                    <Text style={styles.examMarkText}>Full Exam Method</Text>
                                  </View>
                                </View>

                                <Text style={styles.problemStatementText}>
                                  {subtopic.workedExample.problem}
                                </Text>

                                <View style={styles.givenVariablesBox}>
                                  <Text style={styles.givenTitle}>Given from Question:</Text>
                                  {subtopic.workedExample.given.map((g, idx) => (
                                    <Text key={idx} style={styles.givenItemText}>
                                      • {g}
                                    </Text>
                                  ))}
                                </View>

                                <View style={styles.stepsBox}>
                                  <Text style={styles.stepsTitle}>Step-by-Step Solution:</Text>
                                  {subtopic.workedExample.steps.map((step, sIdx) => (
                                    <View key={sIdx} style={styles.stepRow}>
                                      <View style={styles.stepNumBadge}>
                                        <Text style={styles.stepNumText}>{sIdx + 1}</Text>
                                      </View>
                                      <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                  ))}
                                </View>

                                <View style={styles.finalAnswerBox}>
                                  <Text style={styles.finalAnswerLabel}>Final Answer:</Text>
                                  <Text style={styles.finalAnswerText}>
                                    {subtopic.workedExample.answer}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Video / Animated Diagram Embed Banner */}
                            {subtopic.diagramTitle && (
                              <View style={styles.diagramEmbedCard}>
                                <View style={styles.diagramBody}>
                                  <View style={styles.diagramHeaderRow}>
                                    <View style={styles.diagramBadge}>
                                      <Text style={styles.diagramBadgeText}>DIAGRAM</Text>
                                    </View>
                                    <Text style={styles.playIconText}>View</Text>
                                  </View>
                                  <Text style={styles.diagramTitleText}>{subtopic.diagramTitle}</Text>
                                  <Text style={styles.diagramConceptText}>
                                    {subtopic.diagramConcept}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Key Namibian Exam Tip Callout Box */}
                            <View style={styles.examTipCard}>
                              <View style={styles.examTipTop}>
                                <Text style={styles.examTipTitle}>KEY NAMIBIAN EXAM TIP</Text>
                              </View>
                              <Text style={styles.examTipText}>{subtopic.examTip}</Text>
                            </View>

                            {/* Mark Completed Action */}
                            <Pressable
                              onPress={() => toggleSubtopicCompleted(subtopic.id)}
                              style={({ pressed }) => [
                                styles.completeLessonBtn,
                                isDone && styles.completeLessonBtnDone,
                                pressed && styles.pressedState,
                              ]}
                            >
                              <Text style={[styles.completeLessonText, isDone && styles.completeLessonTextDone]}>
                                {isDone ? '✓ Completed' : 'Mark Lesson Complete →'}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* TAB 2: QUIZZES HUB */}
        {activeTab === 'quizzes' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Practice Quizzes</Text>
                <Text style={styles.sectionSubheading}>
                  Pick a topic, save progress, and track your best score
                </Text>
              </View>
            </View>

            {/* Quiz Mode Switcher */}
            <View style={styles.quizModeTabsRow}>
              {(
                [
                  { id: 'topicPractice', label: 'Topic Practice' },
                  { id: 'competition', label: 'Competition' },
                  { id: 'pastPapers', label: 'Past Papers' },
                ] as const
              ).map((mode) => {
                const isActive = quizMode === mode.id;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => setQuizMode(mode.id)}
                    style={[styles.quizModeTab, isActive && styles.quizModeTabActive]}
                  >
                    <Text
                      style={[styles.quizModeTabText, isActive && styles.quizModeTabTextActive]}
                      numberOfLines={1}
                    >
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {quizMode === 'topicPractice' && (
              <>
                <Text style={styles.modeDescriptionText}>
                  Choose a topic, then pick one of its quizzes. Scores and review stay saved.
                </Text>
                <View style={styles.topicGrid}>
                  {topicPracticeEntries.map((entry) => {
                    const quizSets = getQuizSetsForTopic(
                      studyData.quizQuestions.topicPractice,
                      entry.topic
                    );
                    const summary = getTopicBestSummary(
                      quizProgressMap,
                      'topicPractice',
                      entry.topic,
                      quizSets
                    );

                    const isCompleted =
                      quizSets.length > 0 && summary.completedCount >= quizSets.length;

                    return (
                      <Pressable
                        key={entry.topic}
                        onPress={() => openTopicQuizzes(entry.topic)}
                        style={({ pressed }) => [
                          styles.topicCard,
                          isCompleted ? styles.topicCardCompleted : styles.topicCardPractice,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Text
                          style={[
                            styles.topicCardTitle,
                            isCompleted ? styles.topicCardTitleCompleted : styles.topicCardTitlePractice,
                          ]}
                          numberOfLines={2}
                        >
                          {entry.topic}
                        </Text>
                        <Text
                          style={[
                            styles.topicCardMeta,
                            isCompleted ? styles.topicCardMetaCompleted : styles.topicCardMetaPractice,
                          ]}
                        >
                          {entry.quizCount} quiz{entry.quizCount === 1 ? '' : 'zes'} · {entry.count}{' '}
                          questions
                        </Text>

                        {summary.bestLabel && (
                          <Text
                            style={[
                              styles.topicCardScore,
                              isCompleted
                                ? styles.topicCardScoreCompleted
                                : styles.topicCardScorePractice,
                            ]}
                          >
                            Best {summary.bestLabel}
                          </Text>
                        )}
                        {summary.completedCount > 0 && (
                          <Text
                            style={[
                              styles.topicCardMeta,
                              isCompleted
                                ? styles.topicCardMetaCompleted
                                : styles.topicCardMetaPractice,
                            ]}
                          >
                            Completed {summary.completedCount}/{entry.quizCount}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.topicStartHint,
                            isCompleted
                              ? styles.topicStartHintCompleted
                              : styles.topicStartHintPractice,
                          ]}
                        >
                          View quizzes →
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {quizMode === 'competition' && (
              <>
                <Text style={styles.modeDescriptionText}>
                  One-time national challenge rounds. Each competition appears only once — finish it
                  to lock your score.
                </Text>
                {(() => {
                  const allSets = getAllQuizSets(studyData.quizQuestions.competition);
                  const available = allSets.filter(
                    (set) =>
                      !isQuizCompleted(quizProgressMap, 'competition', set.topic, set.quizId)
                  );
                  const completed = allSets.filter((set) =>
                    isQuizCompleted(quizProgressMap, 'competition', set.topic, set.quizId)
                  );

                  return (
                    <>
                      <Text style={styles.competitionSectionLabel}>Available now</Text>
                      {available.length === 0 ? (
                        <View style={styles.quizLaunchCard}>
                          <Text style={styles.quizLaunchBody}>
                            No open competitions right now. Completed rounds are listed below for
                            review only.
                          </Text>
                        </View>
                      ) : (
                        available.map((set) => {
                          const key = sessionKey('competition', set.topic, set.quizId);
                          const progress = quizProgressMap[key];
                          const hasResume = Boolean(progress?.inProgress);
                          return (
                            <Pressable
                              key={`${set.topic}-${set.quizId}`}
                              onPress={() =>
                                openCompetitionQuiz(set.topic, set.quizId, hasResume)
                              }
                              style={({ pressed }) => [
                                styles.competitionCard,
                                pressed && styles.pressedState,
                              ]}
                            >
                              <View style={styles.competitionCardTop}>
                                <Text style={styles.competitionOnceBadge}>One attempt</Text>
                                <Text style={styles.competitionCardTitle}>{set.quizTitle}</Text>
                                <Text style={styles.competitionCardMeta}>
                                  {set.topic} · {set.questions.length} questions
                                </Text>
                              </View>
                              <Text style={styles.topicStartHint}>
                                {hasResume ? 'Resume competition →' : 'Enter competition →'}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}

                      {completed.length > 0 && (
                        <>
                          <Text style={[styles.competitionSectionLabel, { marginTop: 18 }]}>
                            Completed (review only)
                          </Text>
                          {completed.map((set) => {
                            const key = sessionKey('competition', set.topic, set.quizId);
                            const progress = quizProgressMap[key];
                            return (
                              <View key={`${set.topic}-${set.quizId}`} style={styles.competitionCardDone}>
                                <Text style={styles.competitionCardTitle}>{set.quizTitle}</Text>
                                <Text style={styles.competitionCardMeta}>
                                  Score {progress?.lastScore}/{progress?.lastTotal}
                                  {(progress?.bestTotal || 0) > 0
                                    ? ` · Best ${progress?.bestScore}/${progress?.bestTotal}`
                                    : ''}
                                </Text>
                                <Pressable
                                  onPress={() =>
                                    openCompetitionQuiz(set.topic, set.quizId, false, true)
                                  }
                                  style={({ pressed }) => [
                                    styles.competitionReviewBtn,
                                    pressed && styles.pressedState,
                                  ]}
                                >
                                  <Text style={styles.competitionReviewBtnText}>Review answers</Text>
                                </Pressable>
                              </View>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {quizMode === 'pastPapers' && (
              <>
                <Text style={styles.modeDescriptionText}>
                  Choose an exam year, then pick a paper quiz. Scores and review stay saved.
                </Text>
                <View style={styles.topicGrid}>
                  {pastPaperEntries.map((entry) => {
                    const quizSets = getQuizSetsForTopic(
                      studyData.quizQuestions.pastPapers,
                      entry.topic
                    );
                    const summary = getTopicBestSummary(
                      quizProgressMap,
                      'pastPapers',
                      entry.topic,
                      quizSets
                    );
                    const yearLabel = entry.topic.replace(/^NSSCO\s+/i, '');
                    const isCompleted =
                      quizSets.length > 0 && summary.completedCount >= quizSets.length;

                    return (
                      <Pressable
                        key={entry.topic}
                        onPress={() => openTopicQuizzes(entry.topic, 'pastPapers')}
                        style={({ pressed }) => [
                          styles.topicCard,
                          isCompleted ? styles.topicCardCompleted : styles.topicCardPractice,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <Text
                          style={[
                            styles.topicCardTitle,
                            isCompleted ? styles.topicCardTitleCompleted : styles.topicCardTitlePractice,
                          ]}
                          numberOfLines={2}
                        >
                          {entry.topic}
                        </Text>
                        <Text
                          style={[
                            styles.topicCardMeta,
                            isCompleted ? styles.topicCardMetaCompleted : styles.topicCardMetaPractice,
                          ]}
                        >
                          {entry.quizCount} quiz{entry.quizCount === 1 ? '' : 'zes'} · {entry.count}{' '}
                          questions
                        </Text>
                        <Text
                          style={[
                            styles.topicCardMeta,
                            isCompleted ? styles.topicCardMetaCompleted : styles.topicCardMetaPractice,
                          ]}
                        >
                          Year {yearLabel}
                        </Text>

                        {summary.bestLabel && (
                          <Text
                            style={[
                              styles.topicCardScore,
                              isCompleted
                                ? styles.topicCardScoreCompleted
                                : styles.topicCardScorePractice,
                            ]}
                          >
                            Best {summary.bestLabel}
                          </Text>
                        )}
                        {summary.completedCount > 0 && (
                          <Text
                            style={[
                              styles.topicCardMeta,
                              isCompleted
                                ? styles.topicCardMetaCompleted
                                : styles.topicCardMetaPractice,
                            ]}
                          >
                            Completed {summary.completedCount}/{entry.quizCount}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.topicStartHint,
                            isCompleted
                              ? styles.topicStartHintCompleted
                              : styles.topicStartHintPractice,
                          ]}
                        >
                          View quizzes →
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* TAB 3: TEXTBOOKS (E-READER HUB) */}
        {activeTab === 'textbooks' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header info */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Prescribed Textbooks & Syllabi</Text>
                <Text style={styles.sectionSubheading}>
                  MoEAC approved learning materials & official past papers
                </Text>
              </View>
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.textbookCategoriesScroll}
            >
              {['All', 'Approved Textbook', 'MoEAC Syllabus', 'Learner Guide', 'Past Paper Archive'].map(
                (cat) => {
                  const isSelected = textbookCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setTextbookCategory(cat)}
                      style={[styles.textbookCatChip, isSelected && styles.textbookCatChipActive]}
                    >
                      <Text
                        style={[
                          styles.textbookCatChipText,
                          isSelected && styles.textbookCatChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </ScrollView>

            {/* Books List */}
            {studyData.textbooks
              .filter((book) => textbookCategory === 'All' || book.category === textbookCategory)
              .map((book) => {
                const isDownloaded = downloadedBookIds[book.id];
                return (
                  <View key={book.id} style={styles.textbookCard}>
                    <View style={styles.bookSpine} />

                    <View style={styles.bookMainContent}>
                      <View style={styles.bookBadgeRow}>
                        <View style={styles.bookCategoryPill}>
                          <Text style={styles.bookCategoryText}>{book.category}</Text>
                        </View>
                        {isDownloaded && (
                          <View style={styles.offlineStatusChip}>
                            <Text style={styles.offlineStatusText}>✓ Offline Ready</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookPublisher}>Publisher: {book.publisher}</Text>

                      <View style={styles.bookMetaDetails}>
                        <Text style={styles.bookMetaItem}>{book.pages} Pages</Text>
                        <Text style={styles.bookMetaDot}>•</Text>
                        <Text style={styles.bookMetaItem}>{book.fileSize}</Text>
                        <Text style={styles.bookMetaDot}>•</Text>
                        <Text style={styles.bookMetaItem}>{book.chapters.length} Chapters</Text>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.bookActionRow}>
                        <Pressable
                          onPress={() => {
                            setActiveReaderBook(book);
                            setReaderCurrentChapter(1);
                            setReaderSearchTerm('');
                          }}
                          style={({ pressed }) => [styles.readBookBtn, pressed && styles.pressedState]}
                        >
                          <Text style={styles.readBookBtnText}>Open E-Reader</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => toggleBookDownload(book.id)}
                          style={({ pressed }) => [
                            styles.downloadBookBtn,
                            isDownloaded && styles.downloadBookBtnActive,
                            pressed && styles.pressedState,
                          ]}
                        >
                          <Text
                            style={[
                              styles.downloadBookBtnText,
                              isDownloaded && styles.downloadBookBtnTextActive,
                            ]}
                          >
                            {isDownloaded ? 'Saved Offline' : 'Download ↓'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
          </ScrollView>
        )}

        {/* TAB 4: SUMMARIES (CHEAT SHEETS & QUICK REVISION) */}
        {activeTab === 'summaries' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header info */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Night-Before-Exam Summaries</Text>
                <Text style={styles.sectionSubheading}>
                  Formulas, definitions, mind maps & 1-page cheat sheets
                </Text>
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.textbookCategoriesScroll}
            >
              {(
                [
                  { id: 'All', label: 'All Resources' },
                  { id: 'Formulas', label: 'Key Formulas' },
                  { id: 'Definitions', label: 'Definitions' },
                  { id: 'MindMaps', label: 'Mind Maps' },
                  { id: 'CheatSheets', label: 'Cheat Sheets' },
                ] as const
              ).map((sec) => {
                const isSelected = summarySectionFilter === sec.id;
                return (
                  <Pressable
                    key={sec.id}
                    onPress={() => setSummarySectionFilter(sec.id)}
                    style={[styles.textbookCatChip, isSelected && styles.textbookCatChipActive]}
                  >
                    <Text
                      style={[
                        styles.textbookCatChipText,
                        isSelected && styles.textbookCatChipTextActive,
                      ]}
                    >
                      {sec.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 1. KEY FORMULAS SECTION */}
            {(summarySectionFilter === 'All' || summarySectionFilter === 'Formulas') && (
              <View style={styles.summaryGroup}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupTitle}>Essential Formulas & Units</Text>
                  <Text style={styles.groupCountBadge}>
                    {studyData.summaries.formulas.length} Formulas
                  </Text>
                </View>

                {studyData.summaries.formulas.map((item, idx) => (
                  <View key={idx} style={styles.formulaCard}>
                    <Text style={styles.formulaName}>{item.name}</Text>
                    <View style={styles.formulaEquationBox}>
                      <Text style={styles.formulaEquationText}>{item.formula}</Text>
                    </View>

                    <View style={styles.variableGrid}>
                      {item.variables.map((v, vIdx) => (
                        <View key={vIdx} style={styles.variablePill}>
                          <Text style={styles.variableSymbol}>{v.symbol}</Text>
                          <Text style={styles.variableDesc}>
                            {v.meaning} ({v.unit})
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.examCautionBox}>
                      <Text style={styles.examCautionText}>Exam Note: {item.examCaution}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 2. OFFICIAL DEFINITIONS & GLOSSARY */}
            {(summarySectionFilter === 'All' || summarySectionFilter === 'Definitions') && (
              <View style={styles.summaryGroup}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupTitle}>Syllabus Definitions & Glossary</Text>
                  <Text style={styles.groupCountBadge}>
                    {studyData.summaries.definitions.length} Terms
                  </Text>
                </View>

                {studyData.summaries.definitions.map((def, idx) => (
                  <View key={idx} style={styles.definitionCard}>
                    <View style={styles.definitionTopRow}>
                      <Text style={styles.definitionTerm}>{def.term}</Text>
                      <View style={styles.marksBadge}>
                        <Text style={styles.marksBadgeText}>[{def.examMarks} Marks]</Text>
                      </View>
                    </View>

                    <Text style={styles.definitionText}>{def.definition}</Text>

                    <View style={styles.keywordHighlightBox}>
                      <Text style={styles.keywordHighlightLabel}>Examiner Key Phrases:</Text>
                      <Text style={styles.keywordHighlightText}>{def.keywordHighlight}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 3. MIND MAPS & DIAGRAMS */}
            {(summarySectionFilter === 'All' || summarySectionFilter === 'MindMaps') && (
              <View style={styles.summaryGroup}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupTitle}>Mind Maps & Visual Flowcharts</Text>
                  <Text style={styles.groupCountBadge}>
                    {studyData.summaries.mindMaps.length} Maps
                  </Text>
                </View>

                {studyData.summaries.mindMaps.map((map, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedMindMapModal(map.title)}
                    style={({ pressed }) => [styles.mindMapCard, pressed && styles.pressedState]}
                  >
                    <View style={styles.mindMapHeader}>
                      <View style={styles.mindMapTitleBox}>
                        <Text style={styles.mindMapTitle}>{map.title}</Text>
                        <Text style={styles.mindMapDesc}>{map.description}</Text>
                      </View>
                    </View>

                    <View style={styles.mindMapTagsRow}>
                      {map.tags.map((t, tIdx) => (
                        <View key={tIdx} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{t}</Text>
                        </View>
                      ))}
                      <View style={styles.viewMapPill}>
                        <Text style={styles.viewMapPillText}>Inspect Map →</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* 4. BULLET-POINT SUMMARIES */}
            {(summarySectionFilter === 'All' || summarySectionFilter === 'CheatSheets') && (
              <View style={styles.summaryGroup}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupTitle}>1-Page Syllabus Cheat Sheets</Text>
                  <Text style={styles.groupCountBadge}>High Yield</Text>
                </View>

                {studyData.summaries.bulletSummaries.map((cheat, idx) => (
                  <View key={idx} style={styles.cheatSheetCard}>
                    <View style={styles.cheatSheetHeader}>
                      <Text style={styles.cheatSheetTitle}>{cheat.title}</Text>
                      <View style={styles.highFrequencyBadge}>
                        <Text style={styles.highFrequencyText}>
                          {cheat.examFrequency} Exam Frequency
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cheatSheetPointsList}>
                      {cheat.points.map((pt, pIdx) => (
                        <View key={pIdx} style={styles.cheatPointRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.cheatPointText}>{pt}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* FIXED STEP 4 BOTTOM NAVIGATION BAR */}
      <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.tabButtonsRow}>
          <Pressable
            onPress={() => setActiveTab('content')}
            style={({ pressed }) => [
              styles.navTabBtn,
              activeTab === 'content' && styles.navTabBtnActive,
              pressed && styles.pressedState,
            ]}
          >
            <Text style={[styles.navTabLabel, activeTab === 'content' && styles.navTabLabelActive]}>
              Content
            </Text>
            {activeTab === 'content' && <View style={styles.activeTabIndicatorDot} />}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('quizzes')}
            style={({ pressed }) => [
              styles.navTabBtn,
              activeTab === 'quizzes' && styles.navTabBtnActive,
              pressed && styles.pressedState,
            ]}
          >
            <Text style={[styles.navTabLabel, activeTab === 'quizzes' && styles.navTabLabelActive]}>
              Quizzes
            </Text>
            {activeTab === 'quizzes' && <View style={styles.activeTabIndicatorDot} />}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('textbooks')}
            style={({ pressed }) => [
              styles.navTabBtn,
              activeTab === 'textbooks' && styles.navTabBtnActive,
              pressed && styles.pressedState,
            ]}
          >
            <Text
              style={[styles.navTabLabel, activeTab === 'textbooks' && styles.navTabLabelActive]}
            >
              Textbooks
            </Text>
            {activeTab === 'textbooks' && <View style={styles.activeTabIndicatorDot} />}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('summaries')}
            style={({ pressed }) => [
              styles.navTabBtn,
              activeTab === 'summaries' && styles.navTabBtnActive,
              pressed && styles.pressedState,
            ]}
          >
            <Text
              style={[styles.navTabLabel, activeTab === 'summaries' && styles.navTabLabelActive]}
            >
              Summaries
            </Text>
            {activeTab === 'summaries' && <View style={styles.activeTabIndicatorDot} />}
          </Pressable>
        </View>
      </View>

      {/* MODAL 1: E-READER HUB FULL EXPERIENCE */}
      {activeReaderBook && (
        <Modal
          visible={Boolean(activeReaderBook)}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setActiveReaderBook(null)}
        >
          <View style={[styles.readerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Reader Navbar */}
            <View style={styles.readerNavbar}>
              <Pressable
                onPress={() => setActiveReaderBook(null)}
                style={styles.readerBackBtn}
                hitSlop={10}
              >
                <Text style={styles.readerBackText}>✕ Close</Text>
              </Pressable>

              <View style={styles.readerBookTitleBox}>
                <Text style={styles.readerHeaderTitle} numberOfLines={1}>
                  {activeReaderBook.title}
                </Text>
                <Text style={styles.readerHeaderSub}>
                  Chapter {readerCurrentChapter} • Page {20 * readerCurrentChapter} of {activeReaderBook.pages}
                </Text>
              </View>

              <Pressable
                onPress={() => setShowChapterJumpSheet(true)}
                style={styles.chapterJumpBtn}
              >
                <Text style={styles.chapterJumpBtnText}>Chapters</Text>
              </Pressable>
            </View>

            {/* Keyword Search & Highlighter Toolbar */}
            <View style={styles.readerToolbar}>
              <View style={styles.readerSearchBox}>
                <TextInput
                  placeholder="Search in book (e.g. Mole, Friction)..."
                  placeholderTextColor="#94A3B8"
                  value={readerSearchTerm}
                  onChangeText={setReaderSearchTerm}
                  style={styles.readerSearchInput}
                />
                {readerSearchTerm.length > 0 && (
                  <Pressable onPress={() => setReaderSearchTerm('')} hitSlop={6}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.highlighterPalette}>
                {['#FEF08A', '#BBF7D0', '#BAE6FD'].map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setActiveHighlightColor(color)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      activeHighlightColor === color && styles.colorDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Simulated Reader Content */}
            <ScrollView style={styles.readerContentScroll} showsVerticalScrollIndicator={true}>
              <View style={styles.readerPage}>
                <Text style={styles.readerChapterHeading}>
                  {activeReaderBook.chapters[readerCurrentChapter - 1]?.title || 'Chapter Content'}
                </Text>

                <Text style={styles.readerBodyParagraph}>
                  The Republic of Namibia national senior secondary curriculum is structured to impart rigorous
                  theoretical grounding, empirical enquiry, and technical mastery. Learning objectives specified
                  by the Ministry of Education, Arts and Culture (MoEAC) require candidates to demonstrate both
                  direct recall and structured application across multi-step calculations.
                </Text>

                <View
                  style={[
                    styles.readerHighlightQuote,
                    { backgroundColor: activeHighlightColor, borderColor: '#E2E8F0' },
                  ]}
                >
                  <Text style={styles.readerHighlightText}>
                    "Key Principle: Always present all intermediate calculation steps clearly in the answer booklet.
                    Examiners award method marks even when numerical answers deviate due to premature rounding."
                  </Text>
                </View>

                <Text style={styles.readerBodyParagraph}>
                  When analyzing experimental data, candidates must plot points accurately using a sharp pencil,
                  draw a smooth line of best fit, and compute the gradient using a large triangle spanning over half
                  the plotted points.
                </Text>

                <View style={styles.readerDiagramContainer}>
                  <Text style={styles.readerDiagramTitle}>
                    Figure {readerCurrentChapter}.1: MoEAC Standard Apparatus Setup
                  </Text>
                  <View style={styles.readerDiagramPlaceholder}>
                    <Text style={styles.readerDiagramPlaceholderText}>
                      [High-Resolution Schematic Diagram & Vector Illustration]
                    </Text>
                  </View>
                </View>

                {readerSearchTerm.length > 0 && (
                  <View style={styles.searchMatchCallout}>
                    <Text style={styles.searchMatchTitle}>
                      Found matches for "{readerSearchTerm}":
                    </Text>
                    <Text style={styles.searchMatchItem}>
                      • Chapter {readerCurrentChapter}: 4 occurrences on pages 45, 48, 52.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Chapter Jump Sheet Modal */}
            {showChapterJumpSheet && (
              <Modal
                visible={showChapterJumpSheet}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowChapterJumpSheet(false)}
              >
                <Pressable
                  style={styles.modalBackdrop}
                  onPress={() => setShowChapterJumpSheet(false)}
                >
                  <View style={styles.jumpSheetCard}>
                    <Text style={styles.jumpSheetTitle}>Jump Directly to Chapter</Text>
                    <ScrollView style={{ maxHeight: 320 }}>
                      {activeReaderBook.chapters.map((ch, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            setReaderCurrentChapter(idx + 1);
                            setShowChapterJumpSheet(false);
                          }}
                          style={[
                            styles.chapterJumpItem,
                            readerCurrentChapter === idx + 1 && styles.chapterJumpItemActive,
                          ]}
                        >
                          <Text style={styles.chapterJumpItemNum}>Ch {idx + 1}</Text>
                          <Text style={styles.chapterJumpItemTitle}>{ch.title}</Text>
                          <Text style={styles.chapterJumpItemPage}>Page {ch.page}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </Pressable>
              </Modal>
            )}
          </View>
        </Modal>
      )}

      {/* MODAL 2: HIGH SCHOOL LEADERBOARD */}
      {showLeaderboard && (
        <Modal
          visible={showLeaderboard}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLeaderboard(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.leaderboardCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.leaderboardTop}>
                <Text style={styles.leaderboardTitle}>Namibian Schools Leaderboard</Text>
                <Pressable onPress={() => setShowLeaderboard(false)} hitSlop={10}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.leaderboardSub}>
                Learners competing across all 14 regions of Namibia this week:
              </Text>

              {[
                { rank: '1', school: 'St. Paul’s College (Khomas)', xp: '18,420 XP' },
                { rank: '2', school: 'Delta Secondary School Windhoek', xp: '16,950 XP' },
                { rank: '3', school: 'Oshigambo High School (Oshikoto)', xp: '15,200 XP' },
                { rank: '4', school: 'Windhoek High School (WHS)', xp: '14,880 XP' },
                { rank: '5', school: 'Gabriel Taapopi SSS (Ongwediva)', xp: '13,740 XP' },
                { rank: '6', school: 'Swakopmund Secondary School (Erongo)', xp: '12,900 XP' },
              ].map((item, idx) => (
                <View key={idx} style={styles.leaderboardItem}>
                  <Text style={styles.leaderboardMedal}>{item.rank}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderboardSchoolName}>{item.school}</Text>
                    <Text style={styles.leaderboardRankNum}>Rank #{item.rank}</Text>
                  </View>
                  <Text style={styles.leaderboardXpVal}>{item.xp}</Text>
                </View>
              ))}

              <View style={styles.yourRankBox}>
                <Text style={styles.yourRankText}>
                  Your Current Contribution: <Text style={{ fontWeight: '900', color: '#0F172A' }}>{xp} XP</Text>
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 3: MIND MAP INSPECTOR */}
      {selectedMindMapModal && (
        <Modal
          visible={Boolean(selectedMindMapModal)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedMindMapModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.mindMapModalCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.mindMapModalTop}>
                <Text style={styles.mindMapModalTitle} numberOfLines={1}>
                  {selectedMindMapModal}
                </Text>
                <Pressable onPress={() => setSelectedMindMapModal(null)} hitSlop={10}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.mindMapModalSub}>
                Full high-resolution revision flowchart designed for quick visual recall:
              </Text>

              <View style={styles.mindMapVisualCanvas}>
                <View style={styles.mindMapCentralNode}>
                  <Text style={styles.centralNodeText}>CENTRAL TOPIC</Text>
                </View>
                <View style={styles.nodeBranchRow}>
                  <View style={styles.branchPill}>
                    <Text style={styles.branchPillText}>Concepts & Laws</Text>
                  </View>
                  <View style={styles.branchPill}>
                    <Text style={styles.branchPillText}>Formulas & Units</Text>
                  </View>
                  <View style={styles.branchPill}>
                    <Text style={styles.branchPillText}>Exam Questions</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Alert.alert('Downloaded', 'Mind map saved to your device photo gallery for quick offline study.');
                  setSelectedMindMapModal(null);
                }}
                style={styles.downloadMindMapBtn}
              >
                <Text style={styles.downloadMindMapText}>Download High-Res PDF / Image ↓</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL 4: DID YOU KNOW? UNREPEATED FACT MODAL (OPENED AUTOMATICALLY ON SELECT) */}
      {showDidYouKnowModal && didYouKnowFact && (
        <Modal
          visible={showDidYouKnowModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDidYouKnowModal(false)}
        >
          <View style={styles.didYouKnowBackdrop}>
            <View style={[styles.didYouKnowCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {/* Top Bar: badge + close */}
              <View style={styles.didYouKnowTopBar}>
                <View style={styles.didYouKnowBadge}>
                  <Text style={styles.didYouKnowBadgeText}>DID YOU KNOW?</Text>
                </View>
                <Pressable
                  onPress={() => setShowDidYouKnowModal(false)}
                  style={styles.didYouKnowCloseBtn}
                  hitSlop={10}
                >
                  <Text style={styles.didYouKnowCloseText}>✕</Text>
                </Pressable>
              </View>

              {/* Centered icon */}
              <View style={styles.didYouKnowIconSquare}>
                <Text style={styles.didYouKnowBigIcon}>{didYouKnowFact.icon}</Text>
              </View>

              {/* Title + fact */}
              <Text style={styles.didYouKnowTitle}>{didYouKnowFact.title}</Text>
              <ScrollView
                style={styles.didYouKnowFactScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.didYouKnowFactScrollContent}
              >
                <Text style={styles.didYouKnowFactText}>{didYouKnowFact.fact}</Text>
              </ScrollView>

              {/* Highlight / syllabus inset */}
              <View style={styles.didYouKnowHighlightBox}>
                <Text style={styles.didYouKnowHighlightLabel} numberOfLines={2}>
                  {didYouKnowFact.syllabusTag.toUpperCase()}
                </Text>
                <Text style={styles.didYouKnowHighlightMain}>
                  {didYouKnowFact.namibianLocationOrContext}
                </Text>
                <Text style={styles.didYouKnowHighlightSub}>
                  {resolvedSubject.name} · +15 XP curiosity bonus
                </Text>
              </View>

              {/* Green Got it button */}
              <Pressable
                onPress={() => setShowDidYouKnowModal(false)}
                style={({ pressed }) => [styles.didYouKnowGotItBtn, pressed && styles.pressedState]}
              >
                <Text style={styles.didYouKnowGotItText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pressedState: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  // Top Navbar
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  navTitleGroup: {
    flex: 1,
    marginHorizontal: 12,
  },
  navSubjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  navGradeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  xpChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },

  // Main Content Area
  mainContent: {
    flex: 1,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },

  // Hero Card
  subjectHeroCard: {
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#0F172A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      },
    }),
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  heroInnerContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 3,
  },
  heroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCategoryPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroCategoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroPillsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFactPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroFactPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStreakPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStreakPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroFactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroFactBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  heroFactBannerArrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E2E8F0',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroContextSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  heroStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Section Headers
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Accordion Modules
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  accordionHeaderActive: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  unitBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBadgeActive: {
    backgroundColor: '#0F172A',
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  unitBadgeTextActive: {
    color: '#FFFFFF',
  },
  unitTitleWrapper: {
    flex: 1,
  },
  unitTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  expandChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandChevronActive: {
    backgroundColor: '#E2E8F0',
  },
  expandChevronText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },

  // Subtopics list inside expanded accordion
  subtopicsContainer: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    gap: 14,
  },
  subtopicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtopicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  completionCheckbox: {
    padding: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxDone: {
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtopicTitleGroup: {
    flex: 1,
  },
  subtopicNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  subtopicTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  durationPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },

  // Quick concept box
  conceptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conceptBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  conceptText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },

  // Worked-out calculation box
  workedExampleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workedExampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  workedExampleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  examMarkBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  examMarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  problemStatementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    lineHeight: 17,
  },
  givenVariablesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  givenTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
  },
  givenItemText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  stepsBox: {
    marginBottom: 8,
    gap: 4,
  },
  stepsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  stepNumBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  finalAnswerBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
  },
  finalAnswerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  finalAnswerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Diagram Embed
  diagramEmbedCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  diagramBody: {
    padding: 12,
    backgroundColor: '#0F172A',
  },
  diagramHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  diagramBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diagramBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  playIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  diagramTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  diagramConceptText: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },

  // Namibian Exam Tip
  examTipCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examTipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  examTipTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 0.5,
  },
  examTipText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Complete Lesson CTA
  completeLessonBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completeLessonBtnDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  completeLessonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  completeLessonTextDone: {
    color: '#334155',
  },

  // TAB 2: Quizzes hub
  quizModeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quizModeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizModeTabActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  quizModeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  quizModeTabTextActive: {
    color: '#FFFFFF',
  },
  modeDescriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  topicCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 132,
  },
  topicCardPractice: {
    backgroundColor: '#ECFDF5',
    borderColor: '#009A44',
  },
  topicCardCompleted: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  topicCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 6,
  },
  topicCardTitlePractice: {
    color: '#14532D',
  },
  topicCardTitleCompleted: {
    color: '#64748B',
  },
  topicCardMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  topicCardMetaPractice: {
    color: '#166534',
  },
  topicCardMetaCompleted: {
    color: '#94A3B8',
  },
  topicCardScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  topicCardScorePractice: {
    color: '#15803D',
  },
  topicCardScoreCompleted: {
    color: '#64748B',
  },
  topicResumePill: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  topicResumeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topicStartHint: {
    marginTop: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  topicStartHintPractice: {
    color: '#009A44',
  },
  topicStartHintCompleted: {
    color: '#94A3B8',
  },
  quizLaunchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizLaunchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  quizLaunchBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  quizLaunchScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 14,
  },
  quizLaunchBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quizLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  competitionSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  competitionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  competitionCardDone: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  competitionCardTop: {
    marginBottom: 10,
  },
  competitionOnceBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  competitionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  competitionCardMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  competitionReviewBtn: {
    marginTop: 12,
    backgroundColor: '#002B7F',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  competitionReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // TAB 3: Textbooks
  textbookCategoriesScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  textbookCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  textbookCatChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  textbookCatChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  textbookCatChipTextActive: {
    color: '#FFFFFF',
  },
  textbookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  bookSpine: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  bookMainContent: {
    flex: 1,
    padding: 14,
  },
  bookBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bookCategoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  offlineStatusChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offlineStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  bookPublisher: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  bookMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  bookMetaItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bookMetaDot: {
    color: '#94A3B8',
  },
  bookActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readBookBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  readBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  downloadBookBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  downloadBookBtnActive: {
    borderColor: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  downloadBookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  downloadBookBtnTextActive: {
    color: '#0F172A',
  },

  // TAB 4: Summaries
  summaryGroup: {
    marginBottom: 18,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  groupCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  formulaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  formulaName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formulaEquationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formulaEquationText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  variableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  variablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variableSymbol: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  variableDesc: {
    fontSize: 10,
    color: '#475569',
  },
  examCautionBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examCautionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Definitions
  definitionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  definitionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  definitionTerm: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  marksBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marksBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  definitionText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  keywordHighlightBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keywordHighlightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  keywordHighlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  // Mind Maps
  mindMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  mindMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  mindMapTitleBox: {
    flex: 1,
  },
  mindMapTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  mindMapDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mindMapTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  viewMapPill: {
    marginLeft: 'auto',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewMapPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Cheat Sheet
  cheatSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cheatSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cheatSheetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  highFrequencyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highFrequencyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#334155',
  },
  cheatSheetPointsList: {
    gap: 6,
  },
  cheatPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  cheatPointText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },

  // FIXED STEP 4 BOTTOM NAVIGATION BAR
  bottomNavBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -3px 12px rgba(0,0,0,0.06)',
      },
    }),
  },
  tabButtonsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  navTabBtnActive: {},
  navTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabLabelActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  activeTabIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F172A',
    marginTop: 3,
  },

  // Reader Modal Styles
  readerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  readerNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  readerBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  readerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  readerBookTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  readerHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  readerHeaderSub: {
    fontSize: 10,
    color: '#64748B',
  },
  chapterJumpBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chapterJumpBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  readerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  readerSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  readerSearchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  readerSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  clearSearchText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  highlighterPalette: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  colorDotActive: {
    borderColor: '#0F172A',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  readerContentScroll: {
    flex: 1,
  },
  readerPage: {
    padding: 20,
  },
  readerChapterHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
    paddingBottom: 6,
  },
  readerBodyParagraph: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 14,
  },
  readerHighlightQuote: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  readerHighlightText: {
    fontSize: 13,
    color: '#713F12',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  readerDiagramContainer: {
    marginVertical: 14,
    alignItems: 'center',
  },
  readerDiagramTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  readerDiagramPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  readerDiagramPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  searchMatchCallout: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  searchMatchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  searchMatchItem: {
    fontSize: 11,
    color: '#1E40AF',
  },

  // Modal Backdrop & Jump Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  jumpSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  jumpSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  chapterJumpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chapterJumpItemActive: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  chapterJumpItemNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    width: 45,
  },
  chapterJumpItemTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  chapterJumpItemPage: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Leaderboard Modal
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  leaderboardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  leaderboardSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  leaderboardMedal: {
    fontSize: 20,
  },
  leaderboardSchoolName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  leaderboardRankNum: {
    fontSize: 10,
    color: '#64748B',
  },
  leaderboardXpVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  yourRankBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  yourRankText: {
    fontSize: 12,
    color: '#1E40AF',
  },

  // Mind map modal
  mindMapModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  mindMapModalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mindMapModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  mindMapModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
  },
  mindMapVisualCanvas: {
    height: 180,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  mindMapCentralNode: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  centralNodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  nodeBranchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  branchPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  branchPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadMindMapBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadMindMapText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // MODAL 4: DID YOU KNOW? FACT MODAL STYLES (dark card, green CTA)
  didYouKnowBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    padding: 24,
  },
  didYouKnowCard: {
    backgroundColor: '#1A1D26',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    overflow: 'hidden',
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  didYouKnowTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  didYouKnowBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  didYouKnowBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A8ADB8',
    letterSpacing: 1,
  },
  didYouKnowCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  didYouKnowCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8EAED',
  },
  didYouKnowIconSquare: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  didYouKnowBigIcon: {
    fontSize: 30,
  },
  didYouKnowTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  didYouKnowFactScroll: {
    maxHeight: 140,
    marginBottom: 16,
  },
  didYouKnowFactScrollContent: {
    paddingHorizontal: 4,
  },
  didYouKnowFactText: {
    fontSize: 15,
    color: '#B8BCC6',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  didYouKnowHighlightBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  didYouKnowHighlightLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9AA0AB',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 10,
  },
  didYouKnowHighlightMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  didYouKnowHighlightSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8ADB8',
    textAlign: 'center',
    lineHeight: 18,
  },
  didYouKnowGotItBtn: {
    backgroundColor: NAMIBIA_GREEN,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  didYouKnowGotItText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
