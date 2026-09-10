import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSubjectById } from '@/constants/curriculum';
import {
  getQuizSetsForTopic,
  loadSubjectQuizProgress,
  sessionKey,
  upsertTopicProgress,
  type QuizModeKey,
} from '@/constants/quizProgress';
import { getSubjectStudyData, QuizQuestion } from '@/constants/subjectData';

const FLOWER_EMOJIS = ['🌸', '🌺', '🌻', '🌼', '🌷', '💮', '🏵️'] as const;

type FlowerSpec = {
  id: number;
  emoji: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
};

function FallingFlower({
  flower,
  fallDistance,
}: {
  flower: FlowerSpec;
  fallDistance: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(flower.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: flower.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [flower.delay, flower.duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, fallDistance],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, flower.drift, flower.drift * 0.3],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${flower.spin}deg`],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.75, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.Text
      style={[
        styles.fallingFlower,
        {
          left: flower.left,
          fontSize: flower.size,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    >
      {flower.emoji}
    </Animated.Text>
  );
}

function FallingFlowers() {
  const { width, height } = useWindowDimensions();
  const bandHeight = Math.max(160, Math.round(height * 0.28));

  const flowers = useMemo<FlowerSpec[]>(
    () =>
      Array.from({ length: 22 }, (_, id) => ({
        id,
        emoji: FLOWER_EMOJIS[id % FLOWER_EMOJIS.length],
        left: Math.random() * Math.max(width - 28, 1),
        size: 18 + Math.random() * 14,
        delay: Math.random() * 1800,
        duration: 2200 + Math.random() * 1800,
        drift: (Math.random() - 0.5) * 70,
        spin: (Math.random() > 0.5 ? 1 : -1) * (160 + Math.random() * 320),
      })),
    [width]
  );

  return (
    <View style={[styles.fallingFlowersLayer, { height: bandHeight }]} pointerEvents="none">
      {flowers.map((flower) => (
        <FallingFlower key={flower.id} flower={flower} fallDistance={bandHeight} />
      ))}
    </View>
  );
}

export default function QuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    grade?: string;
    mode?: string;
    topic?: string;
    quizId?: string;
    resume?: string;
    review?: string;
  }>();

  const subjectId = params.id || 'phys';
  const grade = params.grade || 'Grade 10';
  const mode = (params.mode || 'topicPractice') as QuizModeKey;
  const topicParam = params.topic ? String(params.topic) : '';
  const quizIdParam = params.quizId ? String(params.quizId) : '';
  const wantResume = params.resume === '1';
  const openInReview = params.review === '1';

  const subject = useMemo(() => getSubjectById(subjectId), [subjectId]);
  const studyData = useMemo(
    () => getSubjectStudyData(subject.id, subject.name, subject.category),
    [subject]
  );

  const questions: QuizQuestion[] = useMemo(() => {
    const bank =
      mode === 'competition'
        ? studyData.quizQuestions.competition
        : mode === 'pastPapers'
          ? studyData.quizQuestions.pastPapers
          : studyData.quizQuestions.topicPractice;

    if ((mode === 'topicPractice' || mode === 'pastPapers' || mode === 'competition') && topicParam) {
      const sets = getQuizSetsForTopic(bank, topicParam);
      if (quizIdParam) {
        const match = sets.find((s) => s.quizId === quizIdParam);
        return match?.questions || [];
      }
      return bank.filter((q) => q.topic === topicParam);
    }
    return bank;
  }, [studyData, mode, topicParam, quizIdParam]);

  const quizTitle = useMemo(() => {
    if ((mode === 'topicPractice' || mode === 'pastPapers' || mode === 'competition') && topicParam) {
      const bank =
        mode === 'competition'
          ? studyData.quizQuestions.competition
          : mode === 'pastPapers'
            ? studyData.quizQuestions.pastPapers
            : studyData.quizQuestions.topicPractice;
      const sets = getQuizSetsForTopic(bank, topicParam);
      const match = sets.find((s) => s.quizId === quizIdParam);
      return match?.quizTitle || topicParam;
    }
    return mode === 'competition'
      ? 'Competition'
      : mode === 'pastPapers'
        ? 'Past Papers'
        : 'Quiz';
  }, [mode, topicParam, quizIdParam, studyData]);

  const isCompetition = mode === 'competition';

  const progressKey = sessionKey(mode, topicParam || mode, quizIdParam || undefined);

  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [bestTotal, setBestTotal] = useState(0);
  const [xp, setXp] = useState(0);

  const activeQuestion = questions[currentIndex] || questions[0];
  const total = questions.length;
  const progressRatio = total > 0 ? (finished || reviewing ? 1 : currentIndex / total) : 0;

  const persistInProgress = useCallback(
    async (next: {
      currentIndex: number;
      score: number;
      selectedOptionIndex: number | null;
      hasAnswered: boolean;
      answers: (number | null)[];
    }) => {
      await upsertTopicProgress(subjectId, progressKey, {
        inProgress: next,
        bestScore,
        bestTotal,
      });
    },
    [subjectId, progressKey, bestScore, bestTotal]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [map, savedXp] = await Promise.all([
        loadSubjectQuizProgress(subjectId),
        AsyncStorage.getItem('learner_xp'),
      ]);
      if (!mounted) return;

      if (savedXp) setXp(parseInt(savedXp, 10) || 0);

      const entry = map[progressKey];
      if (entry) {
        setBestScore(entry.bestScore || 0);
        setBestTotal(entry.bestTotal || 0);
      }

      if (openInReview && entry?.lastAnswers && questions.length > 0) {
        setAnswers(entry.lastAnswers);
        setScore(entry.lastScore || 0);
        setFinished(true);
        setReviewing(false);
        setReady(true);
        return;
      }

      // Competition quizzes are one-attempt only — reopen shows locked results
      if (
        mode === 'competition' &&
        entry &&
        entry.lastTotal > 0 &&
        !entry.inProgress &&
        questions.length > 0
      ) {
        setAnswers(entry.lastAnswers || Array(questions.length).fill(null));
        setScore(entry.lastScore || 0);
        setFinished(true);
        setReviewing(false);
        setReady(true);
        return;
      }

      const canResume = wantResume && entry?.inProgress && questions.length > 0;
      if (canResume && entry?.inProgress) {
        const ip = entry.inProgress;
        setCurrentIndex(Math.min(ip.currentIndex, Math.max(0, questions.length - 1)));
        setScore(ip.score);
        setSelectedOptionIndex(ip.selectedOptionIndex);
        setHasAnswered(ip.hasAnswered);
        setAnswers(
          ip.answers.length === questions.length
            ? ip.answers
            : Array(questions.length).fill(null)
        );
      } else {
        setAnswers(Array(questions.length).fill(null));
        if (entry?.inProgress && !wantResume) {
          await upsertTopicProgress(subjectId, progressKey, {
            bestScore: entry.bestScore || 0,
            bestTotal: entry.bestTotal || 0,
            lastScore: entry.lastScore || 0,
            lastTotal: entry.lastTotal || 0,
            lastAnswers: entry.lastAnswers || null,
            inProgress: null,
          });
        }
      }
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [subjectId, progressKey, wantResume, openInReview, questions.length]);

  const awardXp = async (amount: number) => {
    const next = xp + amount;
    setXp(next);
    try {
      await AsyncStorage.setItem('learner_xp', next.toString());
    } catch {}
  };

  const handleSelectOption = async (optionIndex: number) => {
    if (!activeQuestion || hasAnswered || finished || reviewing) return;

    const isCorrect = optionIndex === activeQuestion.correctIndex;
    const nextScore = score + (isCorrect ? 1 : 0);
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = optionIndex;

    setSelectedOptionIndex(optionIndex);
    setHasAnswered(true);
    setScore(nextScore);
    setAnswers(nextAnswers);

    if (isCorrect) {
      await awardXp(50);
    }

    await persistInProgress({
      currentIndex,
      score: nextScore,
      selectedOptionIndex: optionIndex,
      hasAnswered: true,
      answers: nextAnswers,
    });
  };

  const completeQuiz = async (finalScore: number, finalAnswers: (number | null)[]) => {
    const nextBest =
      finalScore > bestScore || (finalScore === bestScore && total > bestTotal)
        ? finalScore
        : bestScore;
    const nextBestTotal = finalScore >= bestScore ? total : bestTotal;

    setBestScore(nextBest);
    setBestTotal(nextBestTotal);
    setFinished(true);
    setReviewing(false);

    await upsertTopicProgress(subjectId, progressKey, {
      bestScore: nextBest,
      bestTotal: nextBestTotal,
      lastScore: finalScore,
      lastTotal: total,
      lastAnswers: finalAnswers,
      inProgress: null,
    });
  };

  const handleNext = async () => {
    if (!activeQuestion) return;

    if (currentIndex < total - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedOptionIndex(null);
      setHasAnswered(false);
      await persistInProgress({
        currentIndex: nextIndex,
        score,
        selectedOptionIndex: null,
        hasAnswered: false,
        answers,
      });
      return;
    }

    await completeQuiz(score, answers);
  };

  const handleRestart = async () => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setHasAnswered(false);
    setScore(0);
    setAnswers(Array(total).fill(null));
    setFinished(false);
    setReviewing(false);
    await upsertTopicProgress(subjectId, progressKey, {
      bestScore,
      bestTotal,
      lastScore: 0,
      lastTotal: 0,
      lastAnswers: null,
      inProgress: null,
    });
  };

  if (!ready) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading quiz…</Text>
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No questions yet</Text>
          <Text style={styles.emptySub}>This quiz has no practice items available.</Text>
        </View>
      </View>
    );
  }

  if (reviewing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (finished) setReviewing(false);
              else router.back();
            }}
            style={styles.backBtn}
            hitSlop={10}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle} numberOfLines={1}>
              Review
            </Text>
            <Text style={styles.topSub} numberOfLines={1}>
              {quizTitle} · {score}/{total}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {questions.map((q, idx) => {
            const chosen = answers[idx];
            const isCorrect = chosen === q.correctIndex;
            return (
              <View key={q.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewIndex}>Question {idx + 1}</Text>
                  <Text style={[styles.reviewBadge, isCorrect ? styles.reviewOk : styles.reviewBad]}>
                    {chosen == null ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
                <Text style={styles.reviewPrompt}>{q.question}</Text>
                {q.options.map((opt, optIdx) => {
                  const isChosen = chosen === optIdx;
                  const isRight = optIdx === q.correctIndex;
                  return (
                    <View
                      key={optIdx}
                      style={[
                        styles.reviewOption,
                        isRight && styles.reviewOptionCorrect,
                        isChosen && !isRight && styles.reviewOptionWrong,
                      ]}
                    >
                      <Text
                        style={[
                          styles.reviewOptionText,
                          isRight && styles.reviewOptionTextCorrect,
                          isChosen && !isRight && styles.reviewOptionTextWrong,
                        ]}
                      >
                        {['A', 'B', 'C', 'D'][optIdx]}. {opt}
                        {isRight ? '  ✓' : ''}
                        {isChosen && !isRight ? '  ✗ (your answer)' : ''}
                      </Text>
                    </View>
                  );
                })}
                <Text style={styles.reviewExplain}>{q.explanation}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (finished) {
    const percent = Math.round((score / total) * 100);
    const isPerfect = percent === 100;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {isPerfect && <FallingFlowers />}
        <View style={styles.topBar}>
          <View style={styles.topSpacer} />
          <Text style={styles.topTitle} numberOfLines={1}>
            Results
          </Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.resultsContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 88 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreHero}>
            <View style={styles.scoreFlagRow}>
              <Text style={styles.scoreFlagEmoji}>🇳🇦</Text>
              <Text style={styles.scoreFlagLabel}>Namibia</Text>
            </View>
            <View style={styles.scoreFlagStripes}>
              <View style={[styles.scoreStripe, { backgroundColor: '#002B7F' }]} />
              <View style={[styles.scoreStripe, { backgroundColor: '#D21034' }]} />
              <View style={[styles.scoreStripe, { backgroundColor: '#009A44' }]} />
              <View style={[styles.scoreStripe, { backgroundColor: '#FFCE00' }]} />
            </View>
            <Text style={styles.scoreHeroLabel}>Your score</Text>
            <Text style={styles.scoreHeroValue}>
              {score}/{total}
            </Text>
            <Text style={styles.scoreHeroPercent}>{percent}%</Text>
          </View>

          <View style={styles.resultsMetaCard}>
            <View style={styles.resultsMetaRow}>
              <Text style={styles.resultsMetaLabel}>Quiz</Text>
              <Text style={styles.resultsMetaValue}>{quizTitle}</Text>
            </View>
            {!!topicParam && (
              <View style={styles.resultsMetaRow}>
                <Text style={styles.resultsMetaLabel}>Topic</Text>
                <Text style={styles.resultsMetaValue}>{topicParam}</Text>
              </View>
            )}
            <View style={styles.resultsMetaRow}>
              <Text style={styles.resultsMetaLabel}>Best score</Text>
              <Text style={styles.resultsMetaValue}>
                {bestScore}/{bestTotal || total}
              </Text>
            </View>
            <View style={styles.resultsMetaRow}>
              <Text style={styles.resultsMetaLabel}>Subject</Text>
              <Text style={styles.resultsMetaValue}>{subject.name}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setReviewing(true)}
            style={({ pressed }) => [styles.reviewAnswersBtn, pressed && styles.pressed]}
          >
            <Text style={styles.reviewAnswersBtnText}>Review answers</Text>
          </Pressable>
          {!isCompetition && (
            <Pressable
              onPress={handleRestart}
              style={({ pressed }) => [styles.tryAgainBtn, pressed && styles.pressed]}
            >
              <Text style={styles.tryAgainBtnText}>Try again</Text>
            </Pressable>
          )}
          {isCompetition && (
            <View style={styles.competitionLockNote}>
              <Text style={styles.competitionLockNoteText}>
                Competition complete. This round will not appear again.
              </Text>
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.floatingBackBtn,
            { bottom: Math.max(insets.bottom, 16) + 8 },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isCompetition ? 'Back to competitions' : 'Back to quizzes'}
        >
          <Text style={styles.floatingBackBtnIcon}>←</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {quizTitle}
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {topicParam ? `${topicParam} · ` : ''}
            {subject.name} · {grade}
          </Text>
        </View>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreChipText}>
            {score}/{total}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(6, progressRatio * 100)}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionMeta}>
          <Text style={styles.questionCount}>
            Question {currentIndex + 1} of {total}
          </Text>
          {bestTotal > 0 && (
            <Text style={styles.bestHint}>
              Best {bestScore}/{bestTotal}
            </Text>
          )}
        </View>

        <Text style={styles.prompt}>{activeQuestion.question}</Text>

        <View style={styles.options}>
          {activeQuestion.options.map((option, optIdx) => {
            const isSelected = selectedOptionIndex === optIdx;
            const isCorrect = optIdx === activeQuestion.correctIndex;
            const showCorrect = hasAnswered && isCorrect;
            const showIncorrect = hasAnswered && isSelected && !isCorrect;
            const showSelected = !hasAnswered && isSelected;
            const letter = ['A', 'B', 'C', 'D'][optIdx];

            return (
              <Pressable
                key={optIdx}
                onPress={() => handleSelectOption(optIdx)}
                disabled={hasAnswered}
                style={({ pressed }) => [
                  styles.option,
                  showSelected && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showIncorrect && styles.optionIncorrect,
                  pressed && !hasAnswered && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.optionLetter,
                    showCorrect && styles.optionLetterCorrect,
                    showIncorrect && styles.optionLetterIncorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      showCorrect && styles.optionLetterTextCorrect,
                      showIncorrect && styles.optionLetterTextIncorrect,
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    showCorrect && styles.optionTextCorrect,
                    showIncorrect && styles.optionTextIncorrect,
                  ]}
                >
                  {option}
                </Text>
                {showCorrect && <Text style={[styles.feedback, styles.feedbackCorrect]}>✓</Text>}
                {showIncorrect && <Text style={[styles.feedback, styles.feedbackIncorrect]}>✗</Text>}
              </Pressable>
            );
          })}
        </View>

        {hasAnswered && (
          <View style={styles.explainBox}>
            <Text
              style={[
                styles.explainTitle,
                selectedOptionIndex === activeQuestion.correctIndex
                  ? styles.explainTitleCorrect
                  : styles.explainTitleIncorrect,
              ]}
            >
              {selectedOptionIndex === activeQuestion.correctIndex ? 'Correct' : 'Incorrect'}
            </Text>
            <Text style={styles.explainText}>{activeQuestion.explanation}</Text>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [styles.nextQuestionBtn, pressed && styles.pressed]}
            >
              <Text style={styles.nextQuestionBtnText}>
                {currentIndex < total - 1 ? 'Next question →' : 'See score'}
              </Text>
            </Pressable>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
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
  topSpacer: {
    width: 56,
  },
  scoreChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  bestHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 18,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    borderColor: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  optionCorrect: {
    borderColor: '#009A44',
    backgroundColor: '#ECFDF5',
  },
  optionIncorrect: {
    borderColor: '#D21034',
    backgroundColor: '#FEF2F2',
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionLetterCorrect: {
    backgroundColor: '#009A44',
    borderColor: '#009A44',
  },
  optionLetterIncorrect: {
    backgroundColor: '#D21034',
    borderColor: '#D21034',
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  optionLetterTextCorrect: {
    color: '#FFFFFF',
  },
  optionLetterTextIncorrect: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: '#166534',
    fontWeight: '700',
  },
  optionTextIncorrect: {
    color: '#991B1B',
    fontWeight: '700',
  },
  feedback: {
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  feedbackCorrect: {
    color: '#009A44',
  },
  feedbackIncorrect: {
    color: '#D21034',
  },
  explainBox: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  explainTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  explainTitleCorrect: {
    color: '#009A44',
  },
  explainTitleIncorrect: {
    color: '#D21034',
  },
  explainText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 14,
  },
  nextQuestionBtn: {
    backgroundColor: '#FFCE00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextQuestionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  competitionLockNote: {
    marginTop: 10,
    marginBottom: 2,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  competitionLockNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultsContent: {
    padding: 20,
  },
  scoreHero: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  scoreFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  scoreFlagEmoji: {
    fontSize: 28,
  },
  scoreFlagLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.6,
  },
  scoreFlagStripes: {
    flexDirection: 'row',
    width: '100%',
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreStripe: {
    flex: 1,
  },
  scoreHeroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  scoreHeroValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  scoreHeroPercent: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  reviewAnswersBtn: {
    backgroundColor: '#002B7F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewAnswersBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tryAgainBtn: {
    marginTop: 10,
    backgroundColor: '#009A44',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tryAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D21034',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  floatingBackBtnIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: -1,
  },
  fallingFlowersLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 15,
    elevation: 15,
  },
  fallingFlower: {
    position: 'absolute',
    top: 0,
  },
  resultsMetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultsMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  resultsMetaValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  reviewBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewOk: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  reviewBad: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  reviewPrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewOptionCorrect: {
    borderColor: '#009A44',
    backgroundColor: '#ECFDF5',
  },
  reviewOptionWrong: {
    borderColor: '#D21034',
    backgroundColor: '#FEF2F2',
  },
  reviewOptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewOptionTextCorrect: {
    color: '#166534',
    fontWeight: '700',
  },
  reviewOptionTextWrong: {
    color: '#991B1B',
    fontWeight: '700',
  },
  reviewExplain: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
