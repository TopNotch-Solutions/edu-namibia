import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isLessonComplete, type LessonProgressMap } from '@/constants/lessonProgress';
import type { LessonUnit } from '@/constants/lessonTypes';

/**
 * The Content tab, once a grade + subject has lesson content.
 *
 * Deliberately just an index — title, time, whether there is a lab, what it is
 * worth, and where the learner is. Everything heavy lives inside the lesson.
 */

interface LessonIndexProps {
  units: LessonUnit[];
  progress: LessonProgressMap;
  draft?: boolean;
  onOpenLesson: (lessonId: string) => void;
}

export function LessonIndex({ units, progress, draft, onOpenLesson }: LessonIndexProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Lessons</Text>
          <Text style={styles.subheading}>Read it, try it, then check yourself.</Text>
        </View>
        {draft && (
          <View style={styles.draftChip}>
            <Text style={styles.draftChipText}>DRAFT CONTENT</Text>
          </View>
        )}
      </View>

      {units.map((unit) => {
        const doneCount = unit.lessons.filter((lesson) =>
          isLessonComplete(progress[lesson.id])
        ).length;

        return (
          <View key={unit.id} style={styles.unit}>
            <View style={styles.unitHeader}>
              <View style={styles.unitTitleBox}>
                <Text style={styles.unitTitle}>
                  Unit {unit.unitNumber} · {unit.title}
                </Text>
                <Text style={styles.unitSummary}>{unit.summary}</Text>
              </View>
              <Text style={styles.unitCount}>
                {doneCount}/{unit.lessons.length}
              </Text>
            </View>

            {unit.lessons.map((lesson, index) => {
              const saved = progress[lesson.id];
              const complete = isLessonComplete(saved);
              const started = Boolean(saved && (saved.readDone || saved.labDone));
              const xp = lesson.readXp + (lesson.lab?.xp ?? 0) + lesson.checkXp;

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => onOpenLesson(lesson.id)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={styles.rowIndex}>
                    {unit.unitNumber}.{index + 1}
                  </Text>

                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{lesson.title}</Text>
                    <Text style={styles.rowMeta}>
                      {lesson.durationMinutes} min
                      {lesson.lab ? ' · lab' : ''} · {xp} XP
                      {complete && saved?.checkTotal
                        ? ` · ${saved.checkScore}/${saved.checkTotal}`
                        : ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      started && styles.statusDotStarted,
                      complete && styles.statusDotDone,
                    ]}
                  >
                    {complete && <Text style={styles.statusTick}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headerText: { flex: 1 },
  heading: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  subheading: { fontSize: 13, color: '#64748B', marginTop: 2 },
  draftChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  draftChipText: { fontSize: 9, fontWeight: '900', color: '#92400E', letterSpacing: 0.7 },

  unit: { gap: 8 },
  unitHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 4 },
  unitTitleBox: { flex: 1 },
  unitTitle: { fontSize: 13.5, fontWeight: '800', color: '#334155' },
  unitSummary: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  unitCount: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  rowIndex: { width: 26, fontSize: 11.5, fontWeight: '800', color: '#CBD5E1' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: '#0F172A', lineHeight: 20 },
  rowMeta: { fontSize: 11.5, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotStarted: { backgroundColor: '#C7D2FE' },
  statusDotDone: { backgroundColor: '#059669' },
  statusTick: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});

export default LessonIndex;
