import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURRICULUM_SUBJECTS, getSubjectById, resolveGradeId } from '@/constants/curriculum';
import {
  resolveSubjectStudyData,
  syncCurriculum,
} from '@/constants/curriculumSync';
import { NAMIBIA, QUIZ_GRADIENT } from '@/constants/namibiaTheme';
import {
  getQuizSetsForTopic,
  loadSubjectQuizProgress,
  sessionKey,
  SubjectQuizProgressMap,
} from '@/constants/quizProgress';

export default function TopicQuizzesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    grade?: string;
    gradeId?: string;
    topic?: string;
    mode?: string;
  }>();

  const subjectId = params.id || 'phys';
  const grade = params.grade || 'Grade 10';
  const gradeId = String(resolveGradeId(params.gradeId || params.grade || grade));
  const topic = params.topic ? String(params.topic) : '';
  const mode = (params.mode === 'pastPapers' ? 'pastPapers' : 'topicPractice') as
    | 'topicPractice'
    | 'pastPapers';

  const subject = useMemo(
    () => getSubjectById(subjectId) ?? CURRICULUM_SUBJECTS[0],
    [subjectId]
  );
  const [studyTick, setStudyTick] = useState(0);
  const studyData = useMemo(
    () =>
      resolveSubjectStudyData(subject.id, subject.name, subject.category, gradeId),
    [subject, gradeId, studyTick]
  );

  const quizSets = useMemo(() => {
    const bank =
      mode === 'pastPapers'
        ? studyData.quizQuestions.pastPapers
        : studyData.quizQuestions.topicPractice;
    return getQuizSetsForTopic(bank, topic);
  }, [studyData, mode, topic]);

  const [progressMap, setProgressMap] = useState<SubjectQuizProgressMap>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await syncCurriculum();
        const map = await loadSubjectQuizProgress(subjectId);
        if (!active) return;
        setProgressMap(map);
        setStudyTick((value) => value + 1);
      })();
      return () => {
        active = false;
      };
    }, [subjectId])
  );

  const openQuiz = (quizId: string, resume: boolean, review = false) => {
    router.push({
      pathname: '/quiz',
      params: {
        id: subjectId,
        grade,
        gradeId,
        mode,
        topic,
        quizId,
        resume: resume ? '1' : '0',
        review: review ? '1' : '0',
      },
    });
  };

  const completedCount = quizSets.filter((set) => {
    const progress = progressMap[sessionKey(mode, topic, set.quizId)];
    return (progress?.lastTotal || 0) > 0;
  }).length;

  const heading = mode === 'pastPapers' ? 'Past paper quizzes' : 'Topic quizzes';
  const subheading =
    mode === 'pastPapers'
      ? `${quizSets.length} quiz${quizSets.length === 1 ? '' : 'zes'} for this paper set`
      : `${quizSets.length} quiz${quizSets.length === 1 ? '' : 'zes'} · ${completedCount} completed`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...QUIZ_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.flagStrip}>
          <View style={[styles.flagBand, { backgroundColor: NAMIBIA.blue }]} />
          <View style={[styles.flagBand, { backgroundColor: NAMIBIA.red }]} />
          <View style={[styles.flagBand, { backgroundColor: NAMIBIA.green }]} />
          <View style={[styles.flagBand, { backgroundColor: NAMIBIA.yellow }]} />
        </View>

        <Pressable onPress={() => router.back()} style={styles.backPill} hitSlop={10}>
          <Text style={styles.backPillText}>← Back</Text>
        </Pressable>

        <Text style={styles.heroKicker}>
          {mode === 'pastPapers' ? 'Exam practice' : 'Namibia curriculum'}
        </Text>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {topic || heading}
        </Text>
        <Text style={styles.heroMeta}>
          {subject.name} · {grade}
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{quizSets.length}</Text>
            <Text style={styles.heroStatLabel}>Quizzes</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{completedCount}</Text>
            <Text style={styles.heroStatLabel}>Done</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {quizSets.reduce((sum, set) => sum + set.questions.length, 0)}
            </Text>
            <Text style={styles.heroStatLabel}>Questions</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 28) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.subheading}>{subheading}</Text>

        {quizSets.map((set, index) => {
          const key = sessionKey(mode, topic, set.quizId);
          const progress = progressMap[key];
          const hasResume = Boolean(progress?.inProgress);
          const hasScore = (progress?.lastTotal || 0) > 0;
          const canReview = Boolean(progress?.lastAnswers?.length);
          const accent = hasScore ? NAMIBIA.blue : hasResume ? NAMIBIA.yellow : NAMIBIA.green;

          return (
            <View key={set.quizId} style={styles.quizCard}>
              <View style={[styles.quizAccent, { backgroundColor: accent }]} />
              <View style={styles.quizCardInner}>
                <View style={styles.quizCardTop}>
                  <View style={[styles.quizIndexBadge, { backgroundColor: accent }]}>
                    <Text style={styles.quizIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.quizCardBody}>
                    <Text style={styles.quizTitle}>{set.quizTitle}</Text>
                    <Text style={styles.quizMeta}>
                      {set.questions.length} question
                      {set.questions.length === 1 ? '' : 's'}
                      {hasResume ? ' · In progress' : ''}
                    </Text>
                    {hasScore && (
                      <View style={styles.scoreRow}>
                        <View style={styles.scorePill}>
                          <Text style={styles.scorePillText}>
                            Last {progress!.lastScore}/{progress!.lastTotal}
                          </Text>
                        </View>
                        {(progress!.bestTotal || 0) > 0 && (
                          <View style={[styles.scorePill, styles.scorePillBest]}>
                            <Text style={[styles.scorePillText, styles.scorePillBestText]}>
                              Best {progress!.bestScore}/{progress!.bestTotal}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.quizActions}>
                  <Pressable
                    onPress={() => openQuiz(set.quizId, hasResume)}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      hasResume && styles.resumeBtn,
                      !hasResume && hasScore && styles.retakeBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryBtnText,
                        (!hasResume && hasScore) || hasResume
                          ? styles.primaryBtnTextDark
                          : null,
                      ]}
                    >
                      {hasResume ? 'Resume →' : hasScore ? 'Retake →' : 'Start quiz →'}
                    </Text>
                  </Pressable>
                  {canReview && (
                    <Pressable
                      onPress={() => openQuiz(set.quizId, false, true)}
                      style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.reviewBtnText}>Review</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {quizSets.length === 0 && (
          <View style={styles.emptyBox}>
            <View style={styles.emptyFlag}>
              <View style={[styles.emptyBand, { backgroundColor: NAMIBIA.blue }]} />
              <View style={[styles.emptyBand, { backgroundColor: NAMIBIA.red }]} />
              <View style={[styles.emptyBand, { backgroundColor: NAMIBIA.green }]} />
            </View>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptySub}>
              {mode === 'pastPapers'
                ? 'Past paper quizzes for this set will appear here once published.'
                : 'Practice quizzes for this topic will appear here once published.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAMIBIA.sand,
  },
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
  },
  flagBand: {
    flex: 1,
  },
  backPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backPillText: {
    color: NAMIBIA.white,
    fontSize: 13,
    fontWeight: '700',
  },
  heroKicker: {
    color: NAMIBIA.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: NAMIBIA.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 6,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: NAMIBIA.white,
    fontSize: 18,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    padding: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: NAMIBIA.muted,
    lineHeight: 19,
    marginBottom: 16,
  },
  quizCard: {
    flexDirection: 'row',
    backgroundColor: NAMIBIA.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    shadowColor: NAMIBIA.blue,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  quizAccent: {
    width: 5,
  },
  quizCardInner: {
    flex: 1,
    padding: 14,
  },
  quizCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  quizIndexBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizIndexText: {
    color: NAMIBIA.white,
    fontSize: 15,
    fontWeight: '800',
  },
  quizCardBody: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 4,
  },
  quizMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: NAMIBIA.muted,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  scorePill: {
    backgroundColor: NAMIBIA.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scorePillBest: {
    backgroundColor: NAMIBIA.yellowSoft,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAMIBIA.blue,
  },
  scorePillBestText: {
    color: '#8A6A00',
  },
  quizActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: NAMIBIA.green,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resumeBtn: {
    backgroundColor: NAMIBIA.yellow,
  },
  retakeBtn: {
    backgroundColor: NAMIBIA.yellow,
  },
  primaryBtnText: {
    color: NAMIBIA.white,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtnTextDark: {
    color: NAMIBIA.ink,
  },
  reviewBtn: {
    paddingHorizontal: 16,
    backgroundColor: NAMIBIA.blue,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: {
    color: NAMIBIA.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyFlag: {
    flexDirection: 'row',
    width: 72,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  emptyBand: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAMIBIA.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: NAMIBIA.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
