import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CURRICULUM_SUBJECTS,
  getGradeLabel,
  getSubjectById,
  resolveGradeId,
  SubjectOption,
} from '@/constants/curriculum';
import ContentReader from '@/components/ContentReader';
import { LessonIndex } from '@/components/lessons/LessonIndex';
import MaterialReader from '@/components/MaterialReader';
import { getLessonUnits } from '@/constants/content';
import {
  getContentProgress,
} from '@/constants/contentProgress';
import {
  resolveSubjectStudyData,
  syncCurriculum,
} from '@/constants/curriculumSync';
import { resolveOfflineUrl, hydrateOfflineFiles } from '@/constants/offlineFiles';
import type { GradeId, LessonUnit } from '@/constants/lessonTypes';
import { syncLessons } from '@/constants/lessonSync';
import { NAMIBIA, QUIZ_GRADIENT } from '@/constants/namibiaTheme';
import {
  getMaterialProgress,
} from '@/constants/materialProgress';
import {
  loadLessonProgressMap,
  type LessonProgressMap,
} from '@/constants/lessonProgress';
import { addXp, getStreak, getXp, recordDailyActivity } from '@/constants/learnerStats';
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
  LessonSubtopic,
  SubjectStudyData,
  TextbookItem,
} from '@/constants/subjectData';
import { getNextUnrepeatedFact, SubjectFact } from '@/constants/subjectFacts';

const SUBTOPIC_XP = 25;
const FACT_XP = 15;

function subtopicProgressKey(subjectId: string) {
  return `subtopic_progress_${subjectId}`;
}

async function loadBooleanMap(key: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveBooleanMap(key: string, map: Record<string, boolean>) {
  AsyncStorage.setItem(key, JSON.stringify(map)).catch(() => {});
}

// Official Namibian colors
const NAMIBIA_GREEN = '#009A44';

type StudyTab = 'content' | 'quizzes' | 'materials';
type QuizMode = QuizModeKey;

function TabEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.tabEmptyState}>
      <View style={styles.tabEmptyIconCircle}>
        <Ionicons name="search-outline" size={40} color={NAMIBIA.blue} />
      </View>
      <Text style={styles.tabEmptyTitle}>{title}</Text>
      <Text style={styles.tabEmptyMessage}>{message}</Text>
    </View>
  );
}

export default function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; gradeId?: string; grade?: string }>();
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

  // The id is what content is keyed by; the label is derived from it. The
  // legacy `grade` param is still accepted so older navigation paths keep working.
  // String() keeps this provably a primitive for the React Compiler, which
  // has no type information and otherwise treats the result as mutable.
  const gradeId = String(
    resolveGradeId(params.gradeId || params.grade)
  ) as GradeId;
  const activeGrade = getGradeLabel(gradeId);

  // Lesson content for this grade + subject. Remote portal packs are merged
  // on focus; when empty, the screen falls back to the legacy accordion.
  const [lessonUnits, setLessonUnits] = useState<LessonUnit[]>(() =>
    getLessonUnits(gradeId, resolvedSubject.id)
  );
  const hasLessons = lessonUnits.length > 0;
  const [lessonProgressMap, setLessonProgressMap] = useState<LessonProgressMap>({});

  const [studyTick, setStudyTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await Promise.all([
          hydrateOfflineFiles(),
          syncLessons(),
          syncCurriculum(true),
        ]);
        if (!active) return;
        setLessonUnits(getLessonUnits(gradeId, resolvedSubject.id));
        const map = await loadLessonProgressMap(gradeId, resolvedSubject.id);
        if (active) {
          setLessonProgressMap(map);
          setStudyTick((value) => value + 1);
        }
      })();
      return () => {
        active = false;
      };
    }, [gradeId, resolvedSubject.id])
  );

  // Study data for this subject — portal curriculum overlays local packs when present
  const studyData: SubjectStudyData = useMemo(() => {
    return resolveSubjectStudyData(
      resolvedSubject.id,
      resolvedSubject.name,
      resolvedSubject.category,
      gradeId
    );
  }, [resolvedSubject, gradeId, studyTick]);

  // Tab state
  const [activeTab, setActiveTab] = useState<StudyTab>('content');

  // Gamification & User Stats
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Tab 1: Content Module Accordion State
  const [expandedModuleId, setExpandedModuleId] = useState<string>(
    hasLessons ? '' : studyData.modules[0]?.id || 'mod-1'
  );
  const [completedSubtopics, setCompletedSubtopics] = useState<Record<string, boolean>>({});
  const [activeContentLesson, setActiveContentLesson] = useState<{
    subtopic: LessonSubtopic;
    moduleTitle: string;
    lessonLabel: string;
  } | null>(null);
  const [contentPageHints, setContentPageHints] = useState<Record<string, number>>({});

  // Tab 2: Quiz hub state (past papers live under Materials)
  const [quizMode, setQuizMode] = useState<'topicPractice' | 'competition'>('topicPractice');
  const [quizProgressMap, setQuizProgressMap] = useState<SubjectQuizProgressMap>({});
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Tab 3: Materials (portal textbooks / syllabus / learning guides / past papers)
  const [textbookCategory, setTextbookCategory] = useState<string>('All');
  const [activeReaderBook, setActiveReaderBook] = useState<TextbookItem | null>(null);
  const [materialPageHints, setMaterialPageHints] = useState<Record<string, number>>({});

  // Did You Know State (Unrepeated fact on each subject open)
  const [didYouKnowFact, setDidYouKnowFact] = useState<SubjectFact | null>(null);
  const [showDidYouKnowModal, setShowDidYouKnowModal] = useState<boolean>(false);
  // Optional did-you-know (only when portal/local facts exist)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { fact } = await getNextUnrepeatedFact(resolvedSubject.id, AsyncStorage);
        if (!active || !fact) return;
        setDidYouKnowFact(fact);
        setShowDidYouKnowModal(true);
        const nextXp = await addXp(FACT_XP);
        if (active) setXp(nextXp);
      } catch (e) {
        console.warn('Error fetching Did You Know fact', e);
      }
    })();
    return () => {
      active = false;
    };
  }, [resolvedSubject.id]);

  // Load saved lesson completion for this subject
  useEffect(() => {
    let active = true;
    loadBooleanMap(subtopicProgressKey(resolvedSubject.id)).then((subtopics) => {
      if (!active) return;
      setCompletedSubtopics(subtopics);
    });
    return () => {
      active = false;
    };
  }, [resolvedSubject.id]);

  // Load last-read page hints for materials + content lessons
  useEffect(() => {
    let active = true;
    (async () => {
      const materialHints: Record<string, number> = {};
      await Promise.all(
        studyData.textbooks.map(async (book) => {
          const progress = await getMaterialProgress(book.id);
          if (progress?.page) materialHints[book.id] = progress.page;
        })
      );

      const contentHints: Record<string, number> = {};
      const subtopics = studyData.modules.flatMap((module) => module.subtopics);
      await Promise.all(
        subtopics.map(async (subtopic) => {
          const progress = await getContentProgress(subtopic.id);
          if (progress?.page) contentHints[subtopic.id] = progress.page;
        })
      );

      if (!active) return;
      setMaterialPageHints(materialHints);
      setContentPageHints(contentHints);
    })();
    return () => {
      active = false;
    };
  }, [studyData.textbooks, studyData.modules, studyTick]);

  // Refresh XP & streak whenever this screen gains focus (e.g. back from a quiz)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      recordDailyActivity()
        .then(() => Promise.all([getXp(), getStreak()]))
        .then(([savedXp, savedStreak]) => {
          if (!active) return;
          setXp(savedXp);
          setStreak(savedStreak);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  // Toggle Subtopic Completion (+XP when completed, refunded when un-ticked)
  const toggleSubtopicCompleted = (subtopicId: string) => {
    const nowDone = !completedSubtopics[subtopicId];
    const next = { ...completedSubtopics, [subtopicId]: nowDone };
    setCompletedSubtopics(next);
    saveBooleanMap(subtopicProgressKey(resolvedSubject.id), next);
    addXp(nowDone ? SUBTOPIC_XP : -SUBTOPIC_XP).then(setXp);
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

  const hasContent = hasLessons || studyData.modules.length > 0;
  const hasQuizzes =
    studyData.quizQuestions.topicPractice.length > 0 ||
    studyData.quizQuestions.competition.length > 0;
  const hasMaterials = studyData.textbooks.length > 0;

  const openTopicQuizzes = (topic: string, mode: QuizMode = 'topicPractice') => {
    router.push({
      pathname: '/topic-quizzes',
      params: {
        id: resolvedSubject.id,
        grade: activeGrade,
        gradeId,
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
        gradeId,
        mode: 'competition',
        topic,
        quizId,
        resume: resume ? '1' : '0',
        review: review ? '1' : '0',
      },
    });
  };

  // Manual "Did You Know?" — shows the next unseen fact (XP is only awarded on subject open)
  const showAnotherFact = async () => {
    try {
      const { fact } = await getNextUnrepeatedFact(resolvedSubject.id, AsyncStorage);
      if (!fact) return;
      setDidYouKnowFact(fact);
      setShowDidYouKnowModal(true);
    } catch (e) {
      console.warn('Error fetching Did You Know fact', e);
    }
  };

  const openMaterial = (book: TextbookItem) => {
    const url = resolveOfflineUrl(book.fileUrl);
    if (!url) {
      Alert.alert('No file', 'This material has no file attached yet.');
      return;
    }
    setActiveReaderBook(book);
  };

  const closeMaterialReader = () => {
    setActiveReaderBook(null);
    // Refresh continue-reading hints after closing
    void (async () => {
      const hints: Record<string, number> = {};
      await Promise.all(
        studyData.textbooks.map(async (book) => {
          const progress = await getMaterialProgress(book.id);
          if (progress?.page) hints[book.id] = progress.page;
        })
      );
      setMaterialPageHints(hints);
    })();
  };

  const openContentLesson = (
    subtopic: LessonSubtopic,
    moduleTitle: string,
    lessonLabel: string
  ) => {
    setActiveContentLesson({ subtopic, moduleTitle, lessonLabel });
  };

  const closeContentReader = () => {
    setActiveContentLesson(null);
    void (async () => {
      const hints: Record<string, number> = {};
      const subtopics = studyData.modules.flatMap((module) => module.subtopics);
      await Promise.all(
        subtopics.map(async (subtopic) => {
          const progress = await getContentProgress(subtopic.id);
          if (progress?.page) hints[subtopic.id] = progress.page;
        })
      );
      setContentPageHints(hints);
    })();
  };

  const leaderboardRows = useMemo(
    () => [{ school: 'You', xp, isYou: true as const, rank: 1 }],
    [xp]
  );

  const materialFilters = useMemo(
    () =>
      [
        { id: 'All', label: 'All', color: NAMIBIA.blue },
        { id: 'Approved Textbook', label: 'Textbooks', color: '#9A3412' },
        { id: 'MoEAC Syllabus', label: 'Syllabus', color: NAMIBIA.green },
        { id: 'Learner Guide', label: 'Guides', color: NAMIBIA.blue },
        { id: 'Past Paper Archive', label: 'Papers', color: NAMIBIA.red },
      ] as const,
    []
  );

  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = { All: studyData.textbooks.length };
    for (const book of studyData.textbooks) {
      counts[book.category] = (counts[book.category] || 0) + 1;
    }
    return counts;
  }, [studyData.textbooks]);

  const filteredMaterials = useMemo(
    () =>
      studyData.textbooks.filter(
        (book) => textbookCategory === 'All' || book.category === textbookCategory
      ),
    [studyData.textbooks, textbookCategory]
  );

  function materialAccent(category: TextbookItem['category']) {
    if (category === 'MoEAC Syllabus') return NAMIBIA.green;
    if (category === 'Learner Guide') return NAMIBIA.blue;
    if (category === 'Past Paper Archive') return NAMIBIA.red;
    return '#9A3412';
  }

  function materialShortLabel(category: TextbookItem['category']) {
    if (category === 'Approved Textbook') return 'Textbook';
    if (category === 'MoEAC Syllabus') return 'Syllabus';
    if (category === 'Learner Guide') return 'Guide';
    if (category === 'Past Paper Archive') return 'Past paper';
    return category;
  }

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

        <View style={styles.navBarSpacer} />
      </View>

      {/* Main Tab View Area */}
      <View style={styles.mainContent}>
        {/* TAB 1: INTERACTIVE CONTENT LESSON MODULES */}
        {activeTab === 'content' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={[
              styles.tabScrollContent,
              !hasContent && styles.tabScrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {!hasContent ? (
              <TabEmptyState
                title="Content not found"
                message="No lessons or subject content have been published for this subject yet. "
              />
            ) : (
              <>
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
                    {didYouKnowFact ? (
                      <Pressable
                        onPress={showAnotherFact}
                        style={({ pressed }) => [
                          styles.heroFactPill,
                          pressed && styles.pressedState,
                        ]}
                        hitSlop={6}
                      >
                        <Text style={styles.heroFactPillText}>Did You Know?</Text>
                      </Pressable>
                    ) : null}
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
                    <Text style={styles.heroStatLabel}>Materials</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Paced lesson index — used wherever lesson content exists */}
            {hasLessons && (
              <LessonIndex
                units={lessonUnits}
                progress={lessonProgressMap}
                draft
                onOpenLesson={(lessonId) =>
                  router.push({ pathname: '/lesson', params: { lessonId } })
                }
              />
            )}

            {/* Syllabus Roadmap Title */}
            {studyData.modules.length > 0 && (
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Subject content</Text>
                  <Text style={styles.sectionSubheading}>
                    Topics, units, and tips published.
                  </Text>
                </View>
              </View>
            )}

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

                  {/* Compact lesson cards — open in-app reader */}
                  {isExpanded && (
                    <View style={styles.subtopicsContainer}>
                      {module.subtopics.map((subtopic, index) => {
                        const isDone = completedSubtopics[subtopic.id];
                        const lastPage = contentPageHints[subtopic.id];
                        const lessonLabel = `Lesson ${module.unitNumber}.${index + 1}`;
                        const mediaCount =
                          (subtopic.mediaImages?.length || 0) + (subtopic.mediaVideos?.length || 0);
                        return (
                          <View key={subtopic.id} style={styles.subtopicCard}>
                            <View style={styles.subtopicTopRow}>
                              <View
                                style={[styles.checkboxBox, isDone && styles.checkboxBoxDone]}
                              >
                                {isDone && <Text style={styles.checkMark}>✓</Text>}
                              </View>

                              <View style={styles.subtopicTitleGroup}>
                                <Text style={styles.subtopicNumber}>{lessonLabel}</Text>
                                <Text style={styles.subtopicTitle}>{subtopic.title}</Text>
                              </View>

                              <View style={styles.durationPill}>
                                <Text style={styles.durationText}>{subtopic.durationMinutes} min</Text>
                              </View>
                            </View>

                            <Text style={styles.conceptText} numberOfLines={2}>
                              {subtopic.conceptSummary}
                            </Text>

                            <View style={styles.bookMetaDetails}>
                              {lastPage ? (
                                <Text style={styles.bookMetaItem}>Continue from page {lastPage}</Text>
                              ) : (
                                <Text style={styles.bookMetaItem}>Opens in app</Text>
                              )}
                              {mediaCount > 0 ? (
                                <>
                                  <Text style={styles.bookMetaDot}>•</Text>
                                  <Text style={styles.bookMetaItem}>
                                    {mediaCount} media
                                  </Text>
                                </>
                              ) : null}
                              {isDone ? (
                                <>
                                  <Text style={styles.bookMetaDot}>•</Text>
                                  <Text style={styles.bookMetaItem}>Completed</Text>
                                </>
                              ) : null}
                            </View>

                            <View style={styles.bookActionRow}>
                              <Pressable
                                onPress={() =>
                                  openContentLesson(subtopic, module.unitTitle, lessonLabel)
                                }
                                style={({ pressed }) => [
                                  styles.readBookBtn,
                                  { backgroundColor: NAMIBIA.blue, flex: 1 },
                                  pressed && styles.pressedState,
                                ]}
                              >
                                <Text style={styles.readBookBtnText}>
                                  {lastPage ? 'Continue reading →' : 'Open lesson →'}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
              </>
            )}
          </ScrollView>
        )}

        {/* TAB 2: QUIZZES HUB */}
        {activeTab === 'quizzes' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={[
              styles.tabScrollContent,
              !hasQuizzes && styles.tabScrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {!hasQuizzes ? (
              <TabEmptyState
                title="Quizzes not found"
                message="No practice quizzes or competitions have been published for this subject yet. Check back after your teacher adds quizzes."
              />
            ) : (
              <>
            <LinearGradient
              colors={[...QUIZ_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quizHubHero}
            >
              <View style={styles.quizHubFlagStrip}>
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.blue }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.red }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.green }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.yellow }]} />
              </View>
              <Text style={styles.quizHubKicker}>Namibia curriculum</Text>
              <Text style={styles.quizHubTitle}>Practice Quizzes</Text>
              <Text style={styles.quizHubSub}>
                Topic drills and competitions synced. Past papers live under
                Materials.
              </Text>
              <View style={styles.quizHubStatRow}>
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>{topicPracticeEntries.length}</Text>
                  <Text style={styles.quizHubStatLabel}>Topics</Text>
                </View>
                <View style={styles.quizHubStatDivider} />
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>
                    {studyData.quizQuestions.topicPractice.length}
                  </Text>
                  <Text style={styles.quizHubStatLabel}>Questions</Text>
                </View>
                <View style={styles.quizHubStatDivider} />
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>{xp}</Text>
                  <Text style={styles.quizHubStatLabel}>Your XP</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Quiz Mode Switcher */}
            <View style={styles.quizModeTabsRow}>
              {(
                [
                  { id: 'topicPractice', label: 'Topics', color: NAMIBIA.green },
                  { id: 'competition', label: 'Compete', color: NAMIBIA.red },
                ] as const
              ).map((mode) => {
                const isActive = quizMode === mode.id;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => setQuizMode(mode.id)}
                    style={[
                      styles.quizModeTab,
                      isActive && {
                        backgroundColor: mode.color,
                        borderColor: mode.color,
                      },
                    ]}
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

            {quizMode === 'topicPractice' && topicPracticeEntries.length === 0 && (
              <TabEmptyState
                title="Quizzes not found"
                message="No topic quizzes are available in this mode yet."
              />
            )}

            {quizMode === 'topicPractice' && topicPracticeEntries.length > 0 && (
              <>
                <Text style={styles.modeDescriptionText}>
                  Choose a topic, then pick one of its quizzes. Scores and review stay saved.
                </Text>
                <View style={styles.topicQuizList}>
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
                          styles.topicQuizCard,
                          isCompleted && styles.topicQuizCardDone,
                          pressed && styles.pressedState,
                        ]}
                      >
                        <View
                          style={[
                            styles.topicQuizAccent,
                            isCompleted && styles.topicQuizAccentDone,
                          ]}
                        />
                        <View style={styles.topicQuizBody}>
                          <View style={styles.topicQuizTopRow}>
                            <View
                              style={[
                                styles.topicQuizBadge,
                                isCompleted && styles.topicQuizBadgeDone,
                              ]}
                            >
                              <Text style={styles.topicQuizBadgeText}>
                                {entry.quizCount}
                              </Text>
                            </View>
                            <View style={styles.topicQuizCopy}>
                              <Text style={styles.topicQuizTitle} numberOfLines={2}>
                                {entry.topic}
                              </Text>
                              <Text style={styles.topicQuizMeta}>
                                {entry.quizCount} quiz{entry.quizCount === 1 ? '' : 'zes'} ·{' '}
                                {entry.count} question{entry.count === 1 ? '' : 's'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.topicQuizFooter}>
                            <View style={styles.topicQuizPills}>
                              {summary.bestLabel ? (
                                <View style={styles.topicQuizScorePill}>
                                  <Text style={styles.topicQuizScorePillText}>
                                    Best {summary.bestLabel}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.topicQuizReadyPill}>
                                  <Text style={styles.topicQuizReadyPillText}>Ready to start</Text>
                                </View>
                              )}
                              {summary.completedCount > 0 && (
                                <View style={styles.topicQuizProgressPill}>
                                  <Text style={styles.topicQuizProgressPillText}>
                                    {summary.completedCount}/{entry.quizCount} done
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.topicQuizCta}>Open →</Text>
                          </View>
                        </View>
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
              </>
            )}
          </ScrollView>
        )}

        {/* TAB 3: MATERIALS (portal textbooks / syllabus / guides / past papers) */}
        {activeTab === 'materials' && (
          <ScrollView
            style={styles.tabScrollView}
            contentContainerStyle={[
              styles.tabScrollContent,
              !hasMaterials && styles.tabScrollContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {!hasMaterials ? (
              <TabEmptyState
                title="Materials not found"
                message="No textbooks, syllabus docs, guides, or past papers have been uploaded for this subject yet."
              />
            ) : (
              <>
            <LinearGradient
              colors={[NAMIBIA.blueDeep, NAMIBIA.blue, '#0F4C81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.materialsHero}
            >
              <View style={styles.quizHubFlagStrip}>
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.blue }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.red }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.green }]} />
                <View style={[styles.quizHubFlagBand, { backgroundColor: NAMIBIA.yellow }]} />
              </View>
              <Text style={styles.quizHubKicker}>Teacher portal</Text>
              <Text style={styles.quizHubTitle}>Subject materials</Text>
              <Text style={styles.quizHubSub}>
                Textbooks, syllabus, learning guides, and past papers synced for{' '}
                {resolvedSubject.name}.
              </Text>
              <View style={styles.quizHubStatRow}>
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>{materialCounts.All || 0}</Text>
                  <Text style={styles.quizHubStatLabel}>Total</Text>
                </View>
                <View style={styles.quizHubStatDivider} />
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>
                    {materialCounts['Past Paper Archive'] || 0}
                  </Text>
                  <Text style={styles.quizHubStatLabel}>Papers</Text>
                </View>
                <View style={styles.quizHubStatDivider} />
                <View style={styles.quizHubStat}>
                  <Text style={styles.quizHubStatValue}>
                    {(materialCounts['Approved Textbook'] || 0) +
                      (materialCounts['MoEAC Syllabus'] || 0) +
                      (materialCounts['Learner Guide'] || 0)}
                  </Text>
                  <Text style={styles.quizHubStatLabel}>Guides</Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.textbookCategoriesScroll}
            >
              {materialFilters.map((cat) => {
                const isSelected = textbookCategory === cat.id;
                const count = materialCounts[cat.id] || 0;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setTextbookCategory(cat.id)}
                    style={[
                      styles.textbookCatChip,
                      isSelected && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.textbookCatChipText,
                        isSelected && styles.textbookCatChipTextActive,
                      ]}
                    >
                      {cat.label}
                      {cat.id !== 'All' ? ` · ${count}` : count ? ` · ${count}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredMaterials.length === 0 && (
              <TabEmptyState
                title="Materials not found"
                message="Nothing matches this filter. Try another category or check back later."
              />
            )}

            <View style={styles.materialsList}>
              {filteredMaterials.map((book) => {
                const hasFile = Boolean(book.fileUrl);
                const accent = materialAccent(book.category);
                const lastPage = materialPageHints[book.id];
                return (
                  <View key={book.id} style={styles.materialCard}>
                    <View style={[styles.materialAccent, { backgroundColor: accent }]} />
                    <View style={styles.materialCardInner}>
                      <View style={styles.bookBadgeRow}>
                        <View style={[styles.bookCategoryPill, { backgroundColor: `${accent}18` }]}>
                          <Text style={[styles.bookCategoryText, { color: accent }]}>
                            {materialShortLabel(book.category)}
                          </Text>
                        </View>
                        {lastPage ? (
                          <View style={styles.offlineStatusChip}>
                            <Text style={styles.offlineStatusText}>Page {lastPage}</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookPublisher}>{book.publisher}</Text>
                      {!!book.description && (
                        <Text style={styles.bookDescription} numberOfLines={2}>
                          {book.description}
                        </Text>
                      )}

                      <View style={styles.bookMetaDetails}>
                        <Text style={styles.bookMetaItem}>{book.fileSize}</Text>
                        {hasFile ? (
                          <>
                            <Text style={styles.bookMetaDot}>•</Text>
                            <Text style={styles.bookMetaItem}>
                              {lastPage ? `Continue from page ${lastPage}` : 'Opens in app'}
                            </Text>
                          </>
                        ) : null}
                      </View>

                      <View style={styles.bookActionRow}>
                        <Pressable
                          onPress={() => openMaterial(book)}
                          disabled={!hasFile}
                          style={({ pressed }) => [
                            styles.readBookBtn,
                            { backgroundColor: hasFile ? accent : '#94A3B8', flex: 1 },
                            pressed && styles.pressedState,
                          ]}
                        >
                          <Text style={styles.readBookBtnText}>
                            {hasFile
                              ? lastPage
                                ? 'Continue reading →'
                                : 'Open file →'
                              : 'No file yet'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
              </>
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
            onPress={() => setActiveTab('materials')}
            style={({ pressed }) => [
              styles.navTabBtn,
              activeTab === 'materials' && styles.navTabBtnActive,
              pressed && styles.pressedState,
            ]}
          >
            <Text
              style={[styles.navTabLabel, activeTab === 'materials' && styles.navTabLabelActive]}
            >
              Materials
            </Text>
            {activeTab === 'materials' && <View style={styles.activeTabIndicatorDot} />}
          </Pressable>
        </View>
      </View>

      {activeContentLesson ? (
        <ContentReader
          subtopic={activeContentLesson.subtopic}
          moduleTitle={activeContentLesson.moduleTitle}
          lessonLabel={activeContentLesson.lessonLabel}
          isComplete={Boolean(completedSubtopics[activeContentLesson.subtopic.id])}
          onMarkComplete={() => toggleSubtopicCompleted(activeContentLesson.subtopic.id)}
          onClose={closeContentReader}
        />
      ) : null}

      {activeReaderBook && resolveOfflineUrl(activeReaderBook.fileUrl) ? (
        <MaterialReader
          book={activeReaderBook}
          fileUrl={resolveOfflineUrl(activeReaderBook.fileUrl)!}
          onClose={closeMaterialReader}
        />
      ) : null}

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
                Preview with sample school scores. Live rankings arrive once accounts sync online — your XP below is real.
              </Text>

              {leaderboardRows.map((item) => (
                <View
                  key={item.school}
                  style={[
                    styles.leaderboardItem,
                    'isYou' in item && { backgroundColor: '#FEF9C3', borderRadius: 12 },
                  ]}
                >
                  <Text style={styles.leaderboardMedal}>{item.rank}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leaderboardSchoolName}>{item.school}</Text>
                    <Text style={styles.leaderboardRankNum}>
                      {'isYou' in item ? 'Your progress on this device' : 'Sample'}
                    </Text>
                  </View>
                  <Text style={styles.leaderboardXpVal}>{item.xp.toLocaleString()} XP</Text>
                </View>
              ))}

              <View style={styles.yourRankBox}>
                <Text style={styles.yourRankText}>
                  Your XP: <Text style={{ fontWeight: '900', color: '#0F172A' }}>{xp} XP</Text>
                  {streak > 0 ? `  ·  ${streak}-day streak` : ''}
                </Text>
              </View>
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
  navBarSpacer: {
    width: 38,
    height: 38,
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
  tabScrollContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  tabEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  tabEmptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: NAMIBIA.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  tabEmptyIcon: {
    fontSize: 40,
    color: NAMIBIA.blue,
    fontWeight: '300',
  },
  tabEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAMIBIA.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  tabEmptyMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: NAMIBIA.muted,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 300,
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
  mediaStrip: {
    gap: 8,
    paddingBottom: 8,
  },
  mediaThumb: {
    width: 120,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  mediaVideoList: {
    gap: 6,
    marginBottom: 10,
  },
  mediaVideoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  mediaVideoBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
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
  quizHubHero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  quizHubFlagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
  },
  quizHubFlagBand: {
    flex: 1,
  },
  quizHubKicker: {
    color: NAMIBIA.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  quizHubTitle: {
    color: NAMIBIA.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  quizHubSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 14,
  },
  quizHubStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  quizHubStat: {
    flex: 1,
    alignItems: 'center',
  },
  quizHubStatValue: {
    color: NAMIBIA.white,
    fontSize: 16,
    fontWeight: '800',
  },
  quizHubStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  quizHubStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quizModeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quizModeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAMIBIA.white,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
  },
  quizModeTabActive: {
    backgroundColor: NAMIBIA.blue,
    borderColor: NAMIBIA.blue,
  },
  quizModeTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.muted,
  },
  quizModeTabTextActive: {
    color: NAMIBIA.white,
  },
  modeDescriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
    lineHeight: 18,
    marginBottom: 14,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  topicQuizList: {
    gap: 12,
  },
  topicQuizCard: {
    flexDirection: 'row',
    backgroundColor: NAMIBIA.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: NAMIBIA.green,
    minHeight: 118,
    shadowColor: NAMIBIA.green,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  topicQuizCardDone: {
    borderColor: NAMIBIA.blue,
    shadowColor: NAMIBIA.blue,
  },
  topicQuizAccent: {
    width: 7,
    backgroundColor: NAMIBIA.green,
  },
  topicQuizAccentDone: {
    backgroundColor: NAMIBIA.blue,
  },
  topicQuizBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    gap: 12,
  },
  topicQuizTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  topicQuizBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: NAMIBIA.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicQuizBadgeDone: {
    backgroundColor: NAMIBIA.blue,
  },
  topicQuizBadgeText: {
    color: NAMIBIA.white,
    fontSize: 16,
    fontWeight: '900',
  },
  topicQuizCopy: {
    flex: 1,
  },
  topicQuizTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.ink,
    lineHeight: 21,
    marginBottom: 4,
  },
  topicQuizMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
  },
  topicQuizFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topicQuizPills: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicQuizScorePill: {
    backgroundColor: NAMIBIA.yellowSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicQuizScorePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A6A00',
  },
  topicQuizReadyPill: {
    backgroundColor: NAMIBIA.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicQuizReadyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.greenDeep,
  },
  topicQuizProgressPill: {
    backgroundColor: NAMIBIA.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicQuizProgressPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.blue,
  },
  topicQuizCta: {
    fontSize: 14,
    fontWeight: '900',
    color: NAMIBIA.green,
  },
  topicCard: {
    width: '48.5%',
    backgroundColor: NAMIBIA.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
    minHeight: 140,
    shadowColor: NAMIBIA.blue,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topicCardPractice: {
    backgroundColor: NAMIBIA.greenSoft,
    borderColor: NAMIBIA.green,
  },
  topicCardCompleted: {
    backgroundColor: NAMIBIA.blueSoft,
    borderColor: NAMIBIA.blue,
  },
  topicCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAMIBIA.ink,
    lineHeight: 19,
    marginBottom: 6,
  },
  topicCardTitlePractice: {
    color: NAMIBIA.greenDeep,
  },
  topicCardTitleCompleted: {
    color: NAMIBIA.blue,
  },
  topicCardMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: NAMIBIA.muted,
    marginBottom: 8,
  },
  topicCardMetaPractice: {
    color: NAMIBIA.greenDeep,
  },
  topicCardMetaCompleted: {
    color: NAMIBIA.blue,
  },
  topicCardScore: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 8,
  },
  topicCardScorePractice: {
    color: NAMIBIA.green,
  },
  topicCardScoreCompleted: {
    color: NAMIBIA.blue,
  },
  topicResumePill: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    backgroundColor: NAMIBIA.blue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  topicResumeText: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.white,
  },
  topicStartHint: {
    marginTop: 'auto',
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.ink,
  },
  topicStartHintPractice: {
    color: NAMIBIA.green,
  },
  topicStartHintCompleted: {
    color: NAMIBIA.blue,
  },
  quizLaunchCard: {
    backgroundColor: NAMIBIA.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  quizLaunchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 8,
  },
  quizLaunchBody: {
    fontSize: 13,
    color: NAMIBIA.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  quizLaunchScore: {
    fontSize: 13,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 14,
  },
  quizLaunchBtn: {
    backgroundColor: NAMIBIA.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quizLaunchBtnText: {
    color: NAMIBIA.white,
    fontSize: 14,
    fontWeight: '800',
  },
  competitionSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 10,
  },
  competitionCard: {
    backgroundColor: NAMIBIA.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: NAMIBIA.red,
    marginBottom: 10,
  },
  competitionCardDone: {
    backgroundColor: NAMIBIA.blueSoft,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    marginBottom: 10,
  },
  competitionCardTop: {
    marginBottom: 10,
  },
  competitionOnceBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    color: NAMIBIA.red,
    backgroundColor: NAMIBIA.redSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  competitionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 4,
  },
  competitionCardMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
  },
  competitionReviewBtn: {
    marginTop: 12,
    backgroundColor: NAMIBIA.blue,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  competitionReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAMIBIA.white,
  },

  // TAB 3: Materials
  materialsHero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  materialsList: {
    gap: 12,
  },
  materialsEmptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  materialsEmptyFlag: {
    flexDirection: 'row',
    width: 72,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  materialsEmptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 6,
  },
  textbookCategoriesScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  textbookCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: NAMIBIA.white,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
  },
  textbookCatChipActive: {
    backgroundColor: NAMIBIA.blue,
    borderColor: NAMIBIA.blue,
  },
  textbookCatChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.muted,
  },
  textbookCatChipTextActive: {
    color: NAMIBIA.white,
  },
  materialCard: {
    flexDirection: 'row',
    backgroundColor: NAMIBIA.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    shadowColor: NAMIBIA.blue,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  materialAccent: {
    width: 6,
  },
  materialCardInner: {
    flex: 1,
    padding: 14,
  },
  textbookCard: {
    flexDirection: 'row',
    backgroundColor: NAMIBIA.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
    overflow: 'hidden',
  },
  bookSpine: {
    width: 8,
    backgroundColor: NAMIBIA.blue,
  },
  bookMainContent: {
    flex: 1,
    padding: 14,
  },
  bookBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookCategoryPill: {
    backgroundColor: NAMIBIA.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bookCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: NAMIBIA.blue,
  },
  offlineStatusChip: {
    backgroundColor: NAMIBIA.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  offlineStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: NAMIBIA.greenDeep,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 3,
  },
  bookPublisher: {
    fontSize: 12,
    color: NAMIBIA.muted,
    fontWeight: '600',
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 12,
    color: NAMIBIA.muted,
    lineHeight: 17,
    marginBottom: 8,
  },
  emptyMaterialsText: {
    fontSize: 13,
    color: NAMIBIA.muted,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
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
    color: NAMIBIA.muted,
  },
  bookMetaDot: {
    color: NAMIBIA.muted,
  },
  bookActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readBookBtn: {
    flex: 1,
    backgroundColor: NAMIBIA.green,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  readBookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAMIBIA.white,
  },
  downloadBookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: NAMIBIA.line,
    backgroundColor: NAMIBIA.white,
  },
  downloadBookBtnActive: {
    borderColor: NAMIBIA.green,
    backgroundColor: NAMIBIA.greenSoft,
  },
  downloadBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.muted,
  },
  downloadBookBtnTextActive: {
    color: NAMIBIA.greenDeep,
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
