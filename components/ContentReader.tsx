import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZoomableImage } from '@/components/ZoomableImage';
import { ZoomableView } from '@/components/ZoomableView';
import {
  getContentProgress,
  saveContentProgress,
} from '@/constants/contentProgress';
import { NAMIBIA } from '@/constants/namibiaTheme';
import { resolveOfflineUrl } from '@/constants/offlineFiles';
import type { LessonSubtopic } from '@/constants/subjectData';

function ContentVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.play();
  });

  useEffect(() => {
    // Autoplay whenever this video page is shown / source changes.
    try {
      player.play();
    } catch {
      // Native player may not be ready on the first tick.
    }
    return () => {
      try {
        player.pause();
      } catch {
        // ignore
      }
    };
  }, [player, uri]);

  return (
    <ZoomableView style={styles.videoZoom} showHint>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        playsInline
      />
    </ZoomableView>
  );
}

type ContentReaderProps = {
  subtopic: LessonSubtopic;
  moduleTitle?: string;
  lessonLabel?: string;
  onClose: () => void;
  onMarkComplete?: () => void;
  isComplete?: boolean;
};

type ReaderPage =
  | { kind: 'text'; title: string; body: string; searchText: string }
  | { kind: 'worked'; title: string; body: string; searchText: string; example: NonNullable<LessonSubtopic['workedExample']> }
  | { kind: 'tip'; title: string; body: string; searchText: string }
  | { kind: 'diagram'; title: string; body: string; searchText: string }
  | { kind: 'image'; title: string; body: string; searchText: string; uri: string }
  | { kind: 'video'; title: string; body: string; searchText: string; uri: string };

const CHARS_PER_PAGE = 900;

function chunkText(text: string, size = CHARS_PER_PAGE): string[] {
  const clean = String(text || '').trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > size) {
      pushCurrent();
      for (let i = 0; i < paragraph.length; i += size) {
        chunks.push(paragraph.slice(i, i + size).trim());
      }
      continue;
    }
    if (!current) {
      current = paragraph;
      continue;
    }
    if (`${current}\n\n${paragraph}`.length <= size) {
      current = `${current}\n\n${paragraph}`;
    } else {
      pushCurrent();
      current = paragraph;
    }
  }
  pushCurrent();
  return chunks.length ? chunks : [clean];
}

function buildPages(subtopic: LessonSubtopic): ReaderPage[] {
  const pages: ReaderPage[] = [];
  const conceptChunks = chunkText(subtopic.conceptSummary);

  conceptChunks.forEach((body, index) => {
    pages.push({
      kind: 'text',
      title:
        conceptChunks.length > 1
          ? `Concept · part ${index + 1}`
          : 'Quick concept',
      body,
      searchText: body,
    });
  });

  if (subtopic.workedExample) {
    const example = subtopic.workedExample;
    const body = [
      example.problem,
      'Given:',
      ...example.given.map((g) => `• ${g}`),
      'Steps:',
      ...example.steps.map((s, i) => `${i + 1}. ${s}`),
      `Answer: ${example.answer}`,
    ].join('\n');
    pages.push({
      kind: 'worked',
      title: 'Worked example',
      body,
      searchText: body,
      example,
    });
  }

  if (subtopic.diagramTitle) {
    const body = [subtopic.diagramTitle, subtopic.diagramConcept || '']
      .filter(Boolean)
      .join('\n\n');
    pages.push({
      kind: 'diagram',
      title: 'Diagram',
      body,
      searchText: body,
    });
  }

  (subtopic.mediaImages || []).forEach((path, index) => {
    const uri = resolveOfflineUrl(path);
    if (!uri) return;
    pages.push({
      kind: 'image',
      title: `Image ${index + 1}`,
      body: 'Study this diagram carefully.',
      searchText: `Image ${index + 1}`,
      uri,
    });
  });

  (subtopic.mediaVideos || []).forEach((path, index) => {
    const uri = resolveOfflineUrl(path);
    if (!uri) return;
    pages.push({
      kind: 'video',
      title: `Video ${index + 1}`,
      body: 'Watch this lesson video in the app.',
      searchText: `Video ${index + 1}`,
      uri,
    });
  });

  if (subtopic.examTip) {
    pages.push({
      kind: 'tip',
      title: 'Key Namibian exam tip',
      body: subtopic.examTip,
      searchText: subtopic.examTip,
    });
  }

  if (!pages.length) {
    pages.push({
      kind: 'text',
      title: 'Lesson',
      body: 'No content has been published for this lesson yet.',
      searchText: '',
    });
  }

  return pages;
}

function highlightMatches(text: string, query: string) {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  let idx = lower.indexOf(needle, cursor);
  while (idx !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), hit: false });
    parts.push({ text: text.slice(idx, idx + q.length), hit: true });
    cursor = idx + q.length;
    idx = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts.length ? parts : [{ text, hit: false }];
}

export default function ContentReader({
  subtopic,
  moduleTitle,
  lessonLabel,
  onClose,
  onMarkComplete,
  isComplete,
}: ContentReaderProps) {
  const insets = useSafeAreaInsets();
  const pages = useMemo(() => buildPages(subtopic), [subtopic]);
  const totalPages = pages.length;

  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [jumpValue, setJumpValue] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const progress = await getContentProgress(subtopic.id);
      if (!active) return;
      const initial = Math.min(Math.max(1, progress?.page || 1), totalPages);
      setPage(initial);
      setJumpValue(String(initial));
      setReady(true);
      await saveContentProgress(subtopic.id, initial, totalPages);
    })();
    return () => {
      active = false;
    };
  }, [subtopic.id, totalPages]);

  async function goToPage(next: number) {
    const target = Math.min(Math.max(1, Math.floor(next) || 1), totalPages);
    setPage(target);
    setJumpValue(String(target));
    await saveContentProgress(subtopic.id, target, totalPages);
  }

  function handleSearch() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchMatches([]);
      setSearchIndex(-1);
      setStatus(null);
      return;
    }
    const matches = pages
      .map((p, i) => (p.searchText.toLowerCase().includes(q) ? i + 1 : -1))
      .filter((n) => n > 0);
    setSearchMatches(matches);
    if (!matches.length) {
      setSearchIndex(-1);
      setStatus('No matches');
      return;
    }
    setSearchIndex(0);
    void goToPage(matches[0]);
    setStatus(`Found on page ${matches[0]}`);
  }

  function nextMatch() {
    if (!searchMatches.length) return;
    const next = (searchIndex + 1) % searchMatches.length;
    setSearchIndex(next);
    void goToPage(searchMatches[next]);
    setStatus(`Match ${next + 1}/${searchMatches.length}`);
  }

  const current = pages[page - 1];
  if (!ready || !current) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <Text style={styles.loadingText}>Opening lesson…</Text>
        </View>
      </Modal>
    );
  }

  const highlighted = highlightMatches(current.body, searchQuery);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {subtopic.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {lessonLabel ? `${lessonLabel} · ` : ''}
              {moduleTitle ? `${moduleTitle} · ` : ''}
              Page {page} of {totalPages}
            </Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search in this lesson…"
              placeholderTextColor={NAMIBIA.muted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable onPress={handleSearch} style={styles.toolBtn}>
              <Text style={styles.toolBtnText}>Find</Text>
            </Pressable>
            {searchMatches.length > 0 && (
              <Pressable onPress={nextMatch} style={[styles.toolBtn, styles.toolBtnSecondary]}>
                <Text style={[styles.toolBtnText, styles.toolBtnTextDark]}>Next</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.navRow}>
            <Pressable
              onPress={() => void goToPage(page - 1)}
              style={[styles.navBtn, page <= 1 && styles.navBtnDisabled]}
              disabled={page <= 1}
            >
              <Text style={styles.navBtnText}>← Prev</Text>
            </Pressable>

            <View style={styles.jumpWrap}>
              <TextInput
                value={jumpValue}
                onChangeText={setJumpValue}
                keyboardType="number-pad"
                style={styles.jumpInput}
                onSubmitEditing={() => void goToPage(Number(jumpValue))}
              />
              <Pressable onPress={() => void goToPage(Number(jumpValue))} style={styles.jumpGo}>
                <Text style={styles.jumpGoText}>Go</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => void goToPage(page + 1)}
              style={[styles.navBtn, page >= totalPages && styles.navBtnDisabled]}
              disabled={page >= totalPages}
            >
              <Text style={styles.navBtnText}>Next →</Text>
            </Pressable>

            <Pressable onPress={() => void goToPage(totalPages)} style={styles.endBtn}>
              <Text style={styles.endBtnText}>End</Text>
            </Pressable>
          </View>

          {status ? <Text style={styles.statusText}>{status}</Text> : null}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          scrollEnabled={current.kind !== 'video' && current.kind !== 'image'}
          nestedScrollEnabled
        >
          <Text style={styles.pageKind}>{current.title}</Text>

          {current.kind === 'worked' ? (
            <View style={styles.workedBox}>
              <Text style={styles.workedProblem}>{current.example.problem}</Text>
              <Text style={styles.workedLabel}>Given</Text>
              {current.example.given.map((g, i) => (
                <Text key={i} style={styles.bodyText}>
                  • {g}
                </Text>
              ))}
              <Text style={styles.workedLabel}>Steps</Text>
              {current.example.steps.map((step, i) => (
                <Text key={i} style={styles.bodyText}>
                  {i + 1}. {step}
                </Text>
              ))}
              <View style={styles.answerBox}>
                <Text style={styles.workedLabel}>Final answer</Text>
                <Text style={styles.answerText}>{current.example.answer}</Text>
              </View>
            </View>
          ) : current.kind === 'image' ? (
            <View style={styles.mediaBox}>
              <ZoomableImage
                uri={current.uri}
                title={current.title}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.bodyText}>{current.body}</Text>
            </View>
          ) : current.kind === 'video' ? (
            <View style={styles.mediaBox}>
              <ContentVideoPlayer key={current.uri} uri={current.uri} />
              <Text style={styles.bodyText}>{current.body}</Text>
            </View>
          ) : current.kind === 'tip' ? (
            <View style={styles.tipBox}>
              <Text style={styles.bodyText}>
                {highlighted.map((part, i) => (
                  <Text key={i} style={part.hit ? styles.hit : undefined}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            </View>
          ) : (
            <Text style={styles.bodyText}>
              {highlighted.map((part, i) => (
                <Text key={i} style={part.hit ? styles.hit : undefined}>
                  {part.text}
                </Text>
              ))}
            </Text>
          )}
        </ScrollView>

        {onMarkComplete ? (
          <View style={styles.footer}>
            <Pressable
              onPress={onMarkComplete}
              style={[styles.completeBtn, isComplete && styles.completeBtnDone]}
            >
              <Text style={[styles.completeBtnText, isComplete && styles.completeBtnTextDone]}>
                {isComplete ? '✓ Completed' : 'Mark lesson complete'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAMIBIA.sand,
  },
  loadingText: {
    marginTop: 40,
    textAlign: 'center',
    color: NAMIBIA.muted,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: NAMIBIA.blueDeep,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeBtnText: {
    color: NAMIBIA.white,
    fontWeight: '700',
    fontSize: 13,
  },
  titleWrap: { flex: 1 },
  title: {
    color: NAMIBIA.white,
    fontWeight: '800',
    fontSize: 15,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: NAMIBIA.line,
    backgroundColor: NAMIBIA.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: NAMIBIA.ink,
    backgroundColor: NAMIBIA.sand,
    fontSize: 14,
  },
  toolBtn: {
    backgroundColor: NAMIBIA.blue,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toolBtnSecondary: {
    backgroundColor: NAMIBIA.blueSoft,
  },
  toolBtnText: {
    color: NAMIBIA.white,
    fontWeight: '800',
    fontSize: 12,
  },
  toolBtnTextDark: {
    color: NAMIBIA.blueDeep,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    backgroundColor: NAMIBIA.blueSoft,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: NAMIBIA.blueDeep,
    fontWeight: '800',
    fontSize: 12,
  },
  jumpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  jumpInput: {
    width: 52,
    height: 36,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    borderRadius: 8,
    textAlign: 'center',
    color: NAMIBIA.ink,
    fontWeight: '700',
    backgroundColor: NAMIBIA.sand,
  },
  jumpGo: {
    backgroundColor: NAMIBIA.green,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  jumpGoText: {
    color: NAMIBIA.white,
    fontWeight: '800',
    fontSize: 12,
  },
  endBtn: {
    backgroundColor: NAMIBIA.red,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  endBtnText: {
    color: NAMIBIA.white,
    fontWeight: '800',
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    color: NAMIBIA.muted,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  pageKind: {
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.blue,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    color: NAMIBIA.ink,
    fontWeight: '500',
  },
  hit: {
    backgroundColor: NAMIBIA.yellowSoft,
    color: NAMIBIA.ink,
    fontWeight: '800',
  },
  workedBox: {
    gap: 10,
    backgroundColor: NAMIBIA.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
  },
  workedProblem: {
    fontSize: 16,
    fontWeight: '700',
    color: NAMIBIA.ink,
    lineHeight: 24,
  },
  workedLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: NAMIBIA.blue,
    textTransform: 'uppercase',
  },
  answerBox: {
    marginTop: 6,
    backgroundColor: NAMIBIA.greenSoft,
    borderRadius: 10,
    padding: 12,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '800',
    color: NAMIBIA.greenDeep,
  },
  tipBox: {
    backgroundColor: NAMIBIA.yellowSoft,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,206,0,0.45)',
  },
  mediaBox: {
    gap: 12,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: NAMIBIA.white,
  },
  videoZoom: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: NAMIBIA.line,
    backgroundColor: NAMIBIA.white,
  },
  completeBtn: {
    backgroundColor: NAMIBIA.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeBtnDone: {
    backgroundColor: NAMIBIA.greenSoft,
  },
  completeBtnText: {
    color: NAMIBIA.white,
    fontWeight: '800',
    fontSize: 14,
  },
  completeBtnTextDone: {
    color: NAMIBIA.greenDeep,
  },
});
