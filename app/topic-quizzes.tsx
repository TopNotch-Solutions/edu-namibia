import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSubjectById } from '@/constants/curriculum';
import {
  getQuizSetsForTopic,
  loadSubjectQuizProgress,
  sessionKey,
  SubjectQuizProgressMap,
} from '@/constants/quizProgress';
import { getSubjectStudyData } from '@/constants/subjectData';

export default function TopicQuizzesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    grade?: string;
    topic?: string;
    mode?: string;
  }>();

  const subjectId = params.id || 'phys';
  const grade = params.grade || 'Grade 10';
  const topic = params.topic ? String(params.topic) : '';
  const mode = (params.mode === 'pastPapers' ? 'pastPapers' : 'topicPractice') as
    | 'topicPractice'
    | 'pastPapers';

  const subject = useMemo(() => getSubjectById(subjectId), [subjectId]);
  const studyData = useMemo(
    () => getSubjectStudyData(subject.id, subject.name, subject.category),
    [subject]
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
      loadSubjectQuizProgress(subjectId).then((map) => {
        if (active) setProgressMap(map);
      });
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
        mode,
        topic,
        quizId,
        resume: resume ? '1' : '0',
        review: review ? '1' : '0',
      },
    });
  };

  const heading = mode === 'pastPapers' ? 'Choose a past paper quiz' : 'Choose a quiz';
  const subheading =
    mode === 'pastPapers'
      ? `${quizSets.length} quiz${quizSets.length === 1 ? '' : 'zes'} for ${topic || 'this year'}. Finish one to see your score and review answers.`
      : `${quizSets.length} quiz${quizSets.length === 1 ? '' : 'zes'} in this topic. Complete one to see your score and review answers.`;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {topic || (mode === 'pastPapers' ? 'Past papers' : 'Topic quizzes')}
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {subject.name} · {grade}
            {mode === 'pastPapers' ? ' · Past Papers' : ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.subheading}>{subheading}</Text>

        {quizSets.map((set, index) => {
          const key = sessionKey(mode, topic, set.quizId);
          const progress = progressMap[key];
          const hasResume = Boolean(progress?.inProgress);
          const hasScore = (progress?.lastTotal || 0) > 0;
          const canReview = Boolean(progress?.lastAnswers?.length);
          const statusColors = mode === 'topicPractice' || mode === 'pastPapers';

          return (
            <View
              key={set.quizId}
              style={[
                styles.quizCard,
                statusColors && (hasScore ? styles.quizCardCompleted : styles.quizCardPractice),
              ]}
            >
              <View style={styles.quizCardTop}>
                <View
                  style={[
                    styles.quizIndexBadge,
                    statusColors &&
                      (hasScore ? styles.quizIndexBadgeCompleted : styles.quizIndexBadgePractice),
                  ]}
                >
                  <Text style={styles.quizIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.quizCardBody}>
                  <Text
                    style={[
                      styles.quizTitle,
                      statusColors &&
                        (hasScore ? styles.quizTitleCompleted : styles.quizTitlePractice),
                    ]}
                  >
                    {set.quizTitle}
                  </Text>
                  <Text
                    style={[
                      styles.quizMeta,
                      statusColors &&
                        (hasScore ? styles.quizMetaCompleted : styles.quizMetaPractice),
                    ]}
                  >
                    {set.questions.length} question{set.questions.length === 1 ? '' : 's'}
                  </Text>
                  {hasScore && (
                    <Text
                      style={[styles.quizScore, statusColors && styles.quizScoreCompleted]}
                    >
                      Last {progress!.lastScore}/{progress!.lastTotal}
                      {(progress!.bestTotal || 0) > 0
                        ? ` · Best ${progress!.bestScore}/${progress!.bestTotal}`
                        : ''}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.quizActions}>
                <Pressable
                  onPress={() => openQuiz(set.quizId, hasResume)}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    !hasResume && !hasScore && styles.startBtn,
                    !hasResume && hasScore && styles.retakeBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      !hasResume && hasScore && styles.retakeBtnText,
                    ]}
                  >
                    {hasResume ? 'Resume quiz →' : hasScore ? 'Retake quiz →' : 'Start quiz →'}
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
          );
        })}

        {quizSets.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptySub}>
              {mode === 'pastPapers'
                ? 'This year does not have past paper quizzes available.'
                : 'This topic does not have practice quizzes available.'}
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
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  topTitleWrap: {
    flex: 1,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  topSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  quizCardPractice: {
    backgroundColor: '#ECFDF5',
    borderColor: '#009A44',
  },
  quizCardCompleted: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  quizCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  quizIndexBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizIndexBadgePractice: {
    backgroundColor: '#009A44',
  },
  quizIndexBadgeCompleted: {
    backgroundColor: '#94A3B8',
  },
  quizIndexText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  quizCardBody: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  quizTitlePractice: {
    color: '#14532D',
  },
  quizTitleCompleted: {
    color: '#64748B',
  },
  quizMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quizMetaPractice: {
    color: '#166534',
  },
  quizMetaCompleted: {
    color: '#94A3B8',
  },
  quizScore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  quizScoreCompleted: {
    color: '#64748B',
  },
  quizActions: {
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#009A44',
  },
  retakeBtn: {
    backgroundColor: '#FFCE00',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  retakeBtnText: {
    color: '#0F172A',
  },
  reviewBtn: {
    backgroundColor: '#002B7F',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
