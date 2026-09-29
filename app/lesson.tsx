import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonVisual } from '@/components/lessons/LessonVisual';
import { LabStage } from '@/components/labs/LabStage';
import { getLessonById, getNextLesson } from '@/constants/content';
import { getStreak, recordDailyActivity } from '@/constants/learnerStats';
import {
  awardComponent,
  loadLessonProgress,
  resetLesson,
  type LessonProgress,
} from '@/constants/lessonProgress';
import type { LabGoalStep, ReadCard } from '@/constants/lessonTypes';

type Phase = 'read' | 'lab' | 'check' | 'done';

export default function LessonScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lesson = params.lessonId ? getLessonById(String(params.lessonId)) : undefined;

  const [phase, setPhase] = useState<Phase>('read');
  const [readIndex, setReadIndex] = useState(0);
  const [labGoalMet, setLabGoalMet] = useState(false);
  const [labSteps, setLabSteps] = useState<LabGoalStep[]>([]);
  const [checkIndex, setCheckIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [streak, setStreak] = useState(0);
  const [booted, setBooted] = useState(false);

  // Resume where the learner left off.
  useEffect(() => {
    if (!lesson) return;
    let active = true;
    Promise.all([
      loadLessonProgress(lesson.gradeId, lesson.subjectId, lesson.id),
      recordDailyActivity().then(() => getStreak()),
    ]).then(([saved, currentStreak]) => {
      if (!active) return;
      setProgress(saved);
      setStreak(currentStreak);
      if (saved.checkDone) {
        setPhase('done');
      } else if (saved.labDone || (saved.readDone && !lesson.lab)) {
        setPhase('check');
      } else if (saved.readDone) {
        setPhase('lab');
      }
      setBooted(true);
    });
    return () => {
      active = false;
    };
  }, [lesson]);

  // Stable identities — the lab reports through these on every render.
  const handleGoalReached = useCallback(() => setLabGoalMet(true), []);
  const handleLabProgress = useCallback((steps: LabGoalStep[]) => setLabSteps(steps), []);

  if (!lesson) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>Lesson not found</Text>
        <Text style={styles.missingBody}>
          This lesson is not available yet. It may have been moved or not written for your grade.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const nextLesson = getNextLesson(lesson);
  const readCard = lesson.read[readIndex];
  const question = lesson.check[checkIndex];
  const phaseIndex = phase === 'read' ? 0 : phase === 'lab' ? 1 : 2;

  const earned = progress
    ? progress.xpAwarded.read + progress.xpAwarded.lab + progress.xpAwarded.check
    : 0;

  const advanceRead = async () => {
    if (readIndex < lesson.read.length - 1) {
      setReadIndex(readIndex + 1);
      return;
    }
    const result = await awardComponent(
      lesson.gradeId,
      lesson.subjectId,
      lesson.id,
      'read',
      lesson.readXp
    );
    setProgress(result.progress);
    setPhase(lesson.lab ? 'lab' : 'check');
  };

  const finishLab = async () => {
    if (!lesson.lab) return;
    const result = await awardComponent(
      lesson.gradeId,
      lesson.subjectId,
      lesson.id,
      'lab',
      lesson.lab.xp
    );
    setProgress(result.progress);
    setPhase('check');
  };

  const chooseOption = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    const isRight = index === question.correctIndex;
    if (isRight) setCorrectCount((count) => count + 1);
    Haptics.notificationAsync(
      isRight ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    ).catch(() => {});
  };

  const advanceCheck = async () => {
    if (checkIndex < lesson.check.length - 1) {
      setCheckIndex(checkIndex + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    const result = await awardComponent(
      lesson.gradeId,
      lesson.subjectId,
      lesson.id,
      'check',
      lesson.checkXp,
      { checkScore: correctCount, checkTotal: lesson.check.length }
    );
    setProgress(result.progress);
    setPhase('done');
  };

  const redoLesson = async () => {
    const cleared = await resetLesson(lesson.gradeId, lesson.subjectId, lesson.id);
    setProgress(cleared);
    setReadIndex(0);
    setCheckIndex(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setLabGoalMet(false);
    setLabSteps([]);
    setPhase('read');
  };

  const openNextLesson = () => {
    if (!nextLesson) {
      router.back();
      return;
    }
    router.replace({ pathname: '/lesson', params: { lessonId: nextLesson.id } });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {phase === 'done' ? 'Lesson complete' : `${lesson.durationMinutes} min · ${lesson.objective}`}
          </Text>
        </View>
        {lesson.draft && (
          <View style={styles.draftChip}>
            <Text style={styles.draftChipText}>DRAFT</Text>
          </View>
        )}
      </View>

      {/* Progress segments */}
      <View style={styles.segRow}>
        {['Read', 'Try', 'Check'].map((label, index) => (
          <View key={label} style={styles.segCol}>
            <View
              style={[
                styles.seg,
                index < phaseIndex && styles.segDone,
                index === phaseIndex && styles.segActive,
              ]}
            />
            <Text style={[styles.segLabel, index === phaseIndex && styles.segLabelActive]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {!booted ? (
        <View style={styles.centered}>
          <Text style={styles.missingBody}>Loading…</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ------------------------------------------------------ READ */}
            {phase === 'read' && readCard && (
              <>
                <Text style={styles.stepCounter}>
                  Card {readIndex + 1} of {lesson.read.length}
                </Text>
                <ReadCardView card={readCard} />
              </>
            )}

            {/* ------------------------------------------------------- LAB */}
            {phase === 'lab' && lesson.lab && (
              <>
                <View style={styles.goalBanner}>
                  <Text style={styles.goalLabel}>YOUR GOAL</Text>
                  <Text style={styles.goalText}>{lesson.lab.goal}</Text>
                </View>
                <Text style={styles.labBrief}>{lesson.lab.brief}</Text>

                <LabStage
                  labId={lesson.lab.labId}
                  onGoalReached={handleGoalReached}
                  onProgress={handleLabProgress}
                />

                {labSteps.length > 0 && (
                  <View style={styles.checklist}>
                    {labSteps.map((step) => (
                      <View key={step.id} style={styles.checkRow}>
                        <View style={[styles.tick, step.done && styles.tickDone]}>
                          {step.done && <Text style={styles.tickMark}>✓</Text>}
                        </View>
                        <Text style={[styles.checkText, step.done && styles.checkTextDone]}>
                          {step.label}
                        </Text>
                        {step.hint && <Text style={styles.checkHint}>{step.hint}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* ----------------------------------------------------- CHECK */}
            {phase === 'check' && question && (
              <>
                <Text style={styles.stepCounter}>
                  Question {checkIndex + 1} of {lesson.check.length}
                </Text>
                <Text style={styles.questionText}>{question.question}</Text>

                {question.options.map((option, index) => {
                  const isChosen = selected === index;
                  const isRight = index === question.correctIndex;
                  const showRight = answered && isRight;
                  const showWrong = answered && isChosen && !isRight;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => chooseOption(index)}
                      disabled={answered}
                      style={({ pressed }) => [
                        styles.option,
                        isChosen && !answered && styles.optionChosen,
                        showRight && styles.optionRight,
                        showWrong && styles.optionWrong,
                        answered && !showRight && !showWrong && styles.optionDim,
                        pressed && !answered && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionBullet,
                          showRight && styles.optionBulletRight,
                          showWrong && styles.optionBulletWrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionBulletText,
                            (showRight || showWrong) && styles.optionBulletTextOn,
                          ]}
                        >
                          {showRight ? '✓' : showWrong ? '✕' : String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  );
                })}

                {answered && (
                  <View
                    style={[
                      styles.explainBox,
                      selected === question.correctIndex
                        ? styles.explainRight
                        : styles.explainWrong,
                    ]}
                  >
                    <Text style={styles.explainTitle}>
                      {selected === question.correctIndex ? 'Correct' : 'Not quite'}
                    </Text>
                    <Text style={styles.explainText}>{question.explanation}</Text>
                  </View>
                )}
              </>
            )}

            {/* ------------------------------------------------------ DONE */}
            {phase === 'done' && (
              <>
                <View style={styles.doneHero}>
                  <Text style={styles.doneEmoji}>🎉</Text>
                  <Text style={styles.doneTitle}>Lesson complete</Text>
                  <Text style={styles.doneSub}>{lesson.title}</Text>
                </View>

                <View style={styles.xpCard}>
                  <XpRow label="Read all the cards" value={progress?.xpAwarded.read ?? 0} />
                  {lesson.lab && (
                    <XpRow
                      label={`${lesson.lab.title} goal`}
                      value={progress?.xpAwarded.lab ?? 0}
                    />
                  )}
                  <XpRow
                    label={
                      progress?.checkTotal
                        ? `Check · ${progress.checkScore} of ${progress.checkTotal}`
                        : 'Check'
                    }
                    value={progress?.xpAwarded.check ?? 0}
                  />
                  <View style={styles.xpTotalRow}>
                    <Text style={styles.xpTotalLabel}>Earned from this lesson</Text>
                    <Text style={styles.xpTotalValue}>+{earned} XP</Text>
                  </View>
                </View>

                <View style={styles.pillRow}>
                  <View style={styles.streakPill}>
                    <Text style={styles.streakPillText}>🔥 {streak}-day streak</Text>
                  </View>
                  <Pressable
                    onPress={redoLesson}
                    style={({ pressed }) => [styles.redoBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.redoBtnText}>Redo lesson</Text>
                  </Pressable>
                </View>

                <Text style={styles.doneNote}>
                  XP is paid once. Redo the lesson any time to practise — redoing clears this
                  lesson&apos;s XP so you can earn it again.
                </Text>

                {nextLesson && (
                  <View style={styles.nextCard}>
                    <Text style={styles.nextLabel}>UP NEXT</Text>
                    <Text style={styles.nextTitle}>{nextLesson.title}</Text>
                    <Text style={styles.nextMeta}>
                      {nextLesson.durationMinutes} min
                      {nextLesson.lab ? ' · has a lab' : ''}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Fixed action button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            {phase === 'read' && (
              <ActionButton
                label={readIndex < lesson.read.length - 1 ? 'Next' : lesson.lab ? 'Start the lab' : 'Go to the check'}
                onPress={advanceRead}
              />
            )}
            {phase === 'lab' && (
              <ActionButton
                label={labGoalMet ? 'Goal reached — continue' : 'Reach the goal to continue'}
                disabled={!labGoalMet}
                onPress={finishLab}
              />
            )}
            {phase === 'check' && (
              <ActionButton
                label={
                  !answered
                    ? 'Choose an answer'
                    : checkIndex < lesson.check.length - 1
                      ? 'Next question'
                      : 'Finish lesson'
                }
                disabled={!answered}
                onPress={advanceCheck}
              />
            )}
            {phase === 'done' && (
              <ActionButton
                label={nextLesson ? 'Start the next lesson' : 'Back to lessons'}
                onPress={openNextLesson}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnOff,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextOff]}>{label}</Text>
    </Pressable>
  );
}

function XpRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.xpRow}>
      <Text style={styles.xpRowLabel}>{label}</Text>
      <Text style={styles.xpRowValue}>+{value}</Text>
    </View>
  );
}

function ReadCardView({ card }: { card: ReadCard }) {
  switch (card.kind) {
    case 'idea':
      return (
        <View style={styles.card}>
          {card.visual && <LessonVisual id={card.visual} />}
          <Text style={styles.cardHeading}>{card.heading}</Text>
          <Text style={styles.cardBody}>{card.body}</Text>
        </View>
      );

    case 'definition':
      return (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DEFINITION</Text>
          <Text style={styles.cardHeading}>{card.term}</Text>
          <Text style={styles.cardBody}>{card.meaning}</Text>
          {card.inOtherWords && (
            <View style={styles.insetBox}>
              <Text style={styles.insetLabel}>IN OTHER WORDS</Text>
              <Text style={styles.insetText}>{card.inOtherWords}</Text>
            </View>
          )}
        </View>
      );

    case 'formula':
      return (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FORMULA</Text>
          <Text style={styles.cardHeading}>{card.name}</Text>
          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>{card.formula}</Text>
          </View>
          {card.where.map((item) => (
            <View key={item.symbol} style={styles.whereRow}>
              <Text style={styles.whereSymbol}>{item.symbol}</Text>
              <Text style={styles.whereMeaning}>{item.meaning}</Text>
              <Text style={styles.whereUnit}>{item.unit}</Text>
            </View>
          ))}
        </View>
      );

    case 'example':
      return (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>WORKED EXAMPLE</Text>
          <Text style={styles.cardBody}>{card.problem}</Text>
          <View style={styles.insetBox}>
            <Text style={styles.insetLabel}>GIVEN</Text>
            {card.given.map((item) => (
              <Text key={item} style={styles.insetText}>
                • {item}
              </Text>
            ))}
          </View>
          {card.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>ANSWER</Text>
            <Text style={styles.answerText}>{card.answer}</Text>
          </View>
        </View>
      );

    case 'tip':
      return (
        <View style={[styles.card, styles.tipCard]}>
          <Text style={styles.tipLabel}>EXAM TIP</Text>
          <Text style={styles.cardHeading}>{card.heading}</Text>
          <Text style={styles.cardBody}>{card.body}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
  draftChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  draftChipText: { fontSize: 9, fontWeight: '900', color: '#92400E', letterSpacing: 0.8 },

  segRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segCol: { flex: 1, gap: 5 },
  seg: { height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  segDone: { backgroundColor: '#4338CA' },
  segActive: { backgroundColor: '#A5B4FC' },
  segLabel: { fontSize: 9.5, fontWeight: '700', color: '#CBD5E1', letterSpacing: 0.6 },
  segLabelActive: { color: '#4338CA' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },

  stepCounter: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.6 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  tipCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  cardLabel: { fontSize: 9.5, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  tipLabel: { fontSize: 9.5, fontWeight: '900', color: '#B45309', letterSpacing: 1 },
  cardHeading: { fontSize: 19, fontWeight: '800', color: '#0F172A', lineHeight: 25 },
  cardBody: { fontSize: 15.5, lineHeight: 24, color: '#334155' },

  insetBox: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, gap: 4 },
  insetLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
  insetText: { fontSize: 14, lineHeight: 21, color: '#475569' },

  formulaBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  formulaText: { fontSize: 20, fontWeight: '800', color: '#3730A3' },
  whereRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  whereSymbol: { width: 26, fontSize: 15, fontWeight: '800', color: '#4338CA' },
  whereMeaning: { flex: 1, fontSize: 14, color: '#475569' },
  whereUnit: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },

  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14.5, lineHeight: 22, color: '#334155' },
  answerBox: { backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, gap: 3 },
  answerLabel: { fontSize: 9, fontWeight: '900', color: '#047857', letterSpacing: 1 },
  answerText: { fontSize: 16, fontWeight: '800', color: '#065F46' },

  goalBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 4,
  },
  goalLabel: { fontSize: 9.5, fontWeight: '900', color: '#B45309', letterSpacing: 1 },
  goalText: { fontSize: 15.5, fontWeight: '700', color: '#78350F', lineHeight: 22 },
  labBrief: { fontSize: 14.5, lineHeight: 22, color: '#475569' },

  checklist: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDone: { backgroundColor: '#059669', borderColor: '#059669' },
  tickMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  checkText: { flex: 1, fontSize: 14.5, color: '#94A3B8', fontWeight: '600' },
  checkTextDone: { color: '#0F172A' },
  checkHint: { fontSize: 11.5, color: '#94A3B8', fontWeight: '700' },

  questionText: { fontSize: 18, fontWeight: '800', color: '#0F172A', lineHeight: 26 },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 13,
  },
  optionChosen: { borderColor: '#4338CA', backgroundColor: '#EEF2FF' },
  optionRight: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  optionWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  optionDim: { opacity: 0.55 },
  optionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBulletRight: { backgroundColor: '#059669', borderColor: '#059669' },
  optionBulletWrong: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  optionBulletText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  optionBulletTextOn: { color: '#FFFFFF' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#1E293B' },

  explainBox: { borderRadius: 14, padding: 14, gap: 4, borderWidth: 1 },
  explainRight: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  explainWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  explainTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  explainText: { fontSize: 14.5, lineHeight: 22, color: '#334155' },

  doneHero: { alignItems: 'center', gap: 6, paddingVertical: 14 },
  doneEmoji: { fontSize: 44 },
  doneTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  doneSub: { fontSize: 14.5, color: '#64748B', textAlign: 'center' },

  xpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpRowLabel: { flex: 1, fontSize: 14.5, color: '#475569' },
  xpRowValue: { fontSize: 14.5, fontWeight: '800', color: '#4338CA' },
  xpTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 2,
  },
  xpTotalLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  xpTotalValue: { fontSize: 15, fontWeight: '900', color: '#059669' },

  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  streakPillText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  redoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  redoBtnText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  doneNote: { fontSize: 12.5, lineHeight: 19, color: '#94A3B8' },

  nextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 3,
  },
  nextLabel: { fontSize: 9.5, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  nextTitle: { fontSize: 16.5, fontWeight: '800', color: '#0F172A' },
  nextMeta: { fontSize: 12.5, color: '#94A3B8', fontWeight: '600' },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnOff: { backgroundColor: '#E2E8F0' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  primaryBtnTextOff: { color: '#94A3B8' },

  missingTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  missingBody: { fontSize: 14.5, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
