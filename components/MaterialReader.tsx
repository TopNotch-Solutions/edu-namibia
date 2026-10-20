import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { NAMIBIA } from '@/constants/namibiaTheme';
import {
  getMaterialProgress,
  saveMaterialProgress,
} from '@/constants/materialProgress';
import {
  ensureLocalPdfFile,
  isLikelyPdf,
  readPdfAsBase64,
  readPdfJsScripts,
} from '@/constants/pdfViewerAssets';
import type { TextbookItem } from '@/constants/subjectData';

type MaterialReaderProps = {
  book: TextbookItem;
  fileUrl: string;
  onClose: () => void;
};

type ViewerMessage =
  | { type: 'ready'; totalPages: number; page: number }
  | { type: 'page'; page: number; totalPages: number }
  | { type: 'search'; matches: number; query: string }
  | { type: 'zoom'; scale: number }
  | { type: 'error'; message: string }
  | { type: 'viewerReady' };

const CHUNK_SIZE = 400_000;

function buildViewerHtml(pdfJs: string, workerJs: string, startPage: number) {
  const safeStart = Math.max(1, startPage || 1);
  // Escape </script> so inlined libraries cannot break out of the script tag.
  const safePdfJs = pdfJs.replace(/<\/script/gi, '<\\/script');
  const safeWorkerJs = JSON.stringify(workerJs);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: #F4F1E8; color: #0B1B33;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      touch-action: none;
      overflow: hidden;
      height: 100%;
    }
    #viewport {
      position: fixed; inset: 0;
      overflow: hidden;
      touch-action: none;
    }
    #stage {
      transform-origin: 0 0;
      will-change: transform;
      padding: 12px;
      display: flex;
      justify-content: center;
    }
    canvas {
      max-width: none;
      height: auto;
      box-shadow: 0 10px 28px rgba(0,43,127,0.16);
      border-radius: 8px;
      background: #fff;
    }
    #status {
      position: fixed; left: 12px; right: 12px; bottom: 12px;
      background: rgba(11,27,51,0.88); color: #fff;
      padding: 10px 12px; border-radius: 12px; font-size: 13px;
      display: none; z-index: 5;
      pointer-events: none;
    }
  </style>
  <script>${safePdfJs}</script>
</head>
<body>
  <div id="viewport"><div id="stage"><canvas id="page"></canvas></div></div>
  <div id="status"></div>
  <script>
    (function () {
      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      try {
        var pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;
        if (!pdfjsLib) {
          post({ type: 'error', message: 'PDF engine failed to start.' });
          return;
        }

        var workerSource = ${safeWorkerJs};
        var workerBlob = new Blob([workerSource], { type: 'application/javascript' });
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

        var pdfDoc = null;
        var pageNum = ${safeStart};
        var totalPages = 1;
        var rendering = false;
        var pendingPage = null;
        var searchMatches = [];
        var searchIndex = -1;
        var chunks = [];
        var renderScale = 1.35;
        var viewScale = 1;
        var viewX = 0;
        var viewY = 0;
        var stage = document.getElementById('stage');
        var viewportEl = document.getElementById('viewport');

        function showStatus(text) {
          var el = document.getElementById('status');
          el.textContent = text;
          el.style.display = 'block';
          clearTimeout(showStatus._t);
          showStatus._t = setTimeout(function () { el.style.display = 'none'; }, 2200);
        }

        function applyViewTransform() {
          stage.style.transform =
            'translate(' + viewX + 'px,' + viewY + 'px) scale(' + viewScale + ')';
        }

        function setViewZoom(next, cx, cy) {
          var prev = viewScale;
          viewScale = Math.min(4, Math.max(1, next));
          if (typeof cx === 'number' && typeof cy === 'number' && prev > 0) {
            viewX = cx - (cx - viewX) * (viewScale / prev);
            viewY = cy - (cy - viewY) * (viewScale / prev);
          }
          if (viewScale <= 1.01) {
            viewScale = 1;
            viewX = 0;
            viewY = 0;
          }
          applyViewTransform();
          post({ type: 'zoom', scale: viewScale });
        }

        // Pinch-to-zoom + pan inside the PDF WebView
        var activePointers = {};
        var pinchStartDist = 0;
        var pinchStartScale = 1;
        var panStartX = 0;
        var panStartY = 0;
        var panOriginX = 0;
        var panOriginY = 0;

        function pointerList() {
          return Object.keys(activePointers).map(function (k) { return activePointers[k]; });
        }

        function distance(a, b) {
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          return Math.sqrt(dx * dx + dy * dy);
        }

        viewportEl.addEventListener('pointerdown', function (e) {
          activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
          var pts = pointerList();
          if (pts.length === 1) {
            panStartX = e.clientX;
            panStartY = e.clientY;
            panOriginX = viewX;
            panOriginY = viewY;
          } else if (pts.length === 2) {
            pinchStartDist = distance(pts[0], pts[1]);
            pinchStartScale = viewScale;
          }
          try { viewportEl.setPointerCapture(e.pointerId); } catch (err) {}
        }, { passive: true });

        viewportEl.addEventListener('pointermove', function (e) {
          if (!activePointers[e.pointerId]) return;
          activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
          var pts = pointerList();
          if (pts.length === 2 && pinchStartDist > 0) {
            var dist = distance(pts[0], pts[1]);
            var midX = (pts[0].x + pts[1].x) / 2;
            var midY = (pts[0].y + pts[1].y) / 2;
            setViewZoom(pinchStartScale * (dist / pinchStartDist), midX, midY);
          } else if (pts.length === 1 && viewScale > 1) {
            viewX = panOriginX + (e.clientX - panStartX);
            viewY = panOriginY + (e.clientY - panStartY);
            applyViewTransform();
          }
        }, { passive: true });

        function endPointer(e) {
          delete activePointers[e.pointerId];
          var pts = pointerList();
          if (pts.length === 1) {
            panStartX = pts[0].x;
            panStartY = pts[0].y;
            panOriginX = viewX;
            panOriginY = viewY;
            pinchStartDist = 0;
          } else if (pts.length === 0) {
            pinchStartDist = 0;
          }
        }
        viewportEl.addEventListener('pointerup', endPointer, { passive: true });
        viewportEl.addEventListener('pointercancel', endPointer, { passive: true });

        function base64ToUint8Array(b64) {
          var raw = atob(b64);
          var bytes = new Uint8Array(raw.length);
          for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          return bytes;
        }

        async function renderPage(num) {
          if (!pdfDoc) return;
          if (rendering) { pendingPage = num; return; }
          rendering = true;
          try {
            var page = await pdfDoc.getPage(num);
            var canvas = document.getElementById('page');
            var ctx = canvas.getContext('2d');
            var viewport = page.getViewport({ scale: renderScale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            pageNum = num;
            post({ type: 'page', page: pageNum, totalPages: totalPages });
          } catch (err) {
            post({ type: 'error', message: String(err && err.message || err) });
          } finally {
            rendering = false;
            if (pendingPage != null && pendingPage !== pageNum) {
              var next = pendingPage;
              pendingPage = null;
              renderPage(next);
            }
          }
        }

        async function goToPage(num) {
          if (!pdfDoc) return;
          var target = Math.min(Math.max(1, Number(num) || 1), totalPages);
          setViewZoom(1);
          await renderPage(target);
        }

        async function runSearch(query) {
          var lastQuery = String(query || '').trim();
          searchMatches = [];
          searchIndex = -1;
          if (!pdfDoc || !lastQuery) {
            post({ type: 'search', matches: 0, query: lastQuery });
            return;
          }
          var needle = lastQuery.toLowerCase();
          for (var i = 1; i <= totalPages; i++) {
            var page = await pdfDoc.getPage(i);
            var content = await page.getTextContent();
            var text = content.items.map(function (item) { return item.str || ''; }).join(' ').toLowerCase();
            if (text.indexOf(needle) !== -1) searchMatches.push(i);
          }
          post({ type: 'search', matches: searchMatches.length, query: lastQuery });
          if (searchMatches.length) {
            searchIndex = 0;
            await goToPage(searchMatches[0]);
            showStatus('Found on page ' + searchMatches[0]);
          } else {
            showStatus('No matches');
          }
        }

        async function nextMatch() {
          if (!searchMatches.length) return;
          searchIndex = (searchIndex + 1) % searchMatches.length;
          await goToPage(searchMatches[searchIndex]);
          showStatus('Match ' + (searchIndex + 1) + '/' + searchMatches.length);
        }

        window.__reader = {
          goToPage: goToPage,
          goToEnd: function () { return goToPage(totalPages); },
          nextPage: function () { return goToPage(pageNum + 1); },
          prevPage: function () { return goToPage(pageNum - 1); },
          search: runSearch,
          nextMatch: nextMatch,
          zoomIn: function () {
            var cx = window.innerWidth / 2;
            var cy = window.innerHeight / 2;
            setViewZoom(viewScale + 0.35, cx, cy);
            showStatus(Math.round(viewScale * 100) + '%');
          },
          zoomOut: function () {
            var cx = window.innerWidth / 2;
            var cy = window.innerHeight / 2;
            setViewZoom(viewScale - 0.35, cx, cy);
            showStatus(Math.round(viewScale * 100) + '%');
          },
          resetZoom: function () {
            setViewZoom(1);
            showStatus('100%');
          },
          pushChunk: function (part) { chunks.push(String(part || '')); },
          clearChunks: function () { chunks = []; },
          openFromChunks: async function () {
            try {
              var b64 = chunks.join('');
              chunks = [];
              if (!b64) {
                post({ type: 'error', message: 'PDF data was empty.' });
                return;
              }
              var bytes = base64ToUint8Array(b64);
              pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
              totalPages = pdfDoc.numPages || 1;
              var start = Math.min(Math.max(1, pageNum), totalPages);
              post({ type: 'ready', totalPages: totalPages, page: start });
              await renderPage(start);
            } catch (err) {
              post({ type: 'error', message: String(err && err.message || err) });
            }
          }
        };

        post({ type: 'viewerReady' });
      } catch (err) {
        post({ type: 'error', message: String(err && err.message || err) });
      }
    })();
  </script>
</body>
</html>`;
}

export default function MaterialReader({ book, fileUrl, onClose }: MaterialReaderProps) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const pdfBase64Ref = useRef<string | null>(null);
  const injectedRef = useRef(false);

  const [viewerHtml, setViewerHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState(0);
  const [jumpValue, setJumpValue] = useState('1');
  const [zoomPercent, setZoomPercent] = useState(100);
  const pdf = isLikelyPdf(fileUrl, book.title);

  useEffect(() => {
    let active = true;
    injectedRef.current = false;
    pdfBase64Ref.current = null;

    (async () => {
      if (!pdf) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setViewerHtml(null);

        const progress = await getMaterialProgress(book.id);
        const initial = progress?.page || 1;
        if (!active) return;
        setPage(initial);
        setJumpValue(String(initial));
        if (progress?.totalPages) setTotalPages(progress.totalPages);

        const [{ pdfJs, workerJs }, localPdf] = await Promise.all([
          readPdfJsScripts(),
          ensureLocalPdfFile(fileUrl, book.id),
        ]);
        if (!active) return;

        const base64 = await readPdfAsBase64(localPdf);
        if (!active) return;
        if (!base64) {
          throw new Error('Could not read the PDF file from device storage.');
        }

        pdfBase64Ref.current = base64;
        setViewerHtml(buildViewerHtml(pdfJs, workerJs, initial));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to open this PDF.');
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [book.id, book.title, fileUrl, pdf]);

  function sendCommand(script: string) {
    webRef.current?.injectJavaScript(`${script}; true;`);
  }

  function injectPdfData() {
    const base64 = pdfBase64Ref.current;
    if (!base64 || injectedRef.current) return;
    injectedRef.current = true;

    sendCommand('window.__reader && window.__reader.clearChunks()');

    for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
      const chunk = base64.slice(i, i + CHUNK_SIZE);
      sendCommand(
        `window.__reader && window.__reader.pushChunk(${JSON.stringify(chunk)})`
      );
    }

    sendCommand('window.__reader && window.__reader.openFromChunks()');
  }

  async function persistPage(nextPage: number, nextTotal: number) {
    setPage(nextPage);
    setTotalPages(nextTotal);
    setJumpValue(String(nextPage));
    await saveMaterialProgress(book.id, nextPage, nextTotal);
  }

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as ViewerMessage;
      if (data.type === 'viewerReady') {
        injectPdfData();
        return;
      }
      if (data.type === 'ready') {
        setLoading(false);
        setError(null);
        setZoomPercent(100);
        void persistPage(data.page, data.totalPages);
        return;
      }
      if (data.type === 'page') {
        setLoading(false);
        setZoomPercent(100);
        void persistPage(data.page, data.totalPages);
        return;
      }
      if (data.type === 'search') {
        setSearchMatches(data.matches);
        return;
      }
      if (data.type === 'zoom') {
        setZoomPercent(Math.round((data.scale || 1) * 100));
        return;
      }
      if (data.type === 'error') {
        setLoading(false);
        setError(data.message || 'Unable to open this document.');
      }
    } catch {
      // ignore malformed messages
    }
  }

  function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    sendCommand(`window.__reader && window.__reader.search(${JSON.stringify(q)})`);
  }

  function handleJump() {
    const target = Number(jumpValue);
    if (!Number.isFinite(target)) return;
    sendCommand(`window.__reader && window.__reader.goToPage(${target})`);
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {book.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {pdf
                ? `Page ${page} of ${totalPages}`
                : 'In-app preview works best for PDF files'}
            </Text>
          </View>
        </View>

        {pdf ? (
          <>
            <View style={styles.toolbar}>
              <View style={styles.searchRow}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search in document…"
                  placeholderTextColor={NAMIBIA.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <Pressable onPress={handleSearch} style={styles.toolBtn}>
                  <Text style={styles.toolBtnText}>Find</Text>
                </Pressable>
                {searchMatches > 0 && (
                  <Pressable
                    onPress={() => sendCommand('window.__reader && window.__reader.nextMatch()')}
                    style={[styles.toolBtn, styles.toolBtnSecondary]}
                  >
                    <Text style={[styles.toolBtnText, styles.toolBtnTextDark]}>Next</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.navRow}>
                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.prevPage()')}
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
                    onSubmitEditing={handleJump}
                  />
                  <Pressable onPress={handleJump} style={styles.jumpGo}>
                    <Text style={styles.jumpGoText}>Go</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.nextPage()')}
                  style={[styles.navBtn, page >= totalPages && styles.navBtnDisabled]}
                  disabled={page >= totalPages}
                >
                  <Text style={styles.navBtnText}>Next →</Text>
                </Pressable>

                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.goToEnd()')}
                  style={styles.endBtn}
                >
                  <Text style={styles.endBtnText}>End</Text>
                </Pressable>
              </View>

              <View style={styles.zoomRow}>
                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.zoomOut()')}
                  style={[styles.navBtn, zoomPercent <= 100 && styles.navBtnDisabled]}
                  disabled={zoomPercent <= 100}
                >
                  <Text style={styles.navBtnText}>−</Text>
                </Pressable>
                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.resetZoom()')}
                  style={styles.zoomLabelBtn}
                >
                  <Text style={styles.zoomLabelText}>{zoomPercent}%</Text>
                </Pressable>
                <Pressable
                  onPress={() => sendCommand('window.__reader && window.__reader.zoomIn()')}
                  style={styles.navBtn}
                >
                  <Text style={styles.navBtnText}>+</Text>
                </Pressable>
                <Text style={styles.zoomHint}>Pinch to zoom · drag when zoomed</Text>
              </View>
            </View>

            <View style={styles.viewer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={NAMIBIA.blue} size="large" />
                  <Text style={styles.loadingText}>Opening document…</Text>
                </View>
              )}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Could not open PDF</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    onPress={() => {
                      injectedRef.current = false;
                      setError(null);
                      setLoading(true);
                      setViewerHtml(null);
                      // Remount by re-running effect dependencies via state bump
                      setJumpValue((value) => value);
                      void (async () => {
                        try {
                          const [{ pdfJs, workerJs }, localPdf] = await Promise.all([
                            readPdfJsScripts(),
                            ensureLocalPdfFile(fileUrl, book.id),
                          ]);
                          const base64 = await readPdfAsBase64(localPdf);
                          pdfBase64Ref.current = base64;
                          const progress = await getMaterialProgress(book.id);
                          setViewerHtml(
                            buildViewerHtml(pdfJs, workerJs, progress?.page || 1)
                          );
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : 'Unable to open this PDF.'
                          );
                          setLoading(false);
                        }
                      })();
                    }}
                    style={styles.retryBtn}
                  >
                    <Text style={styles.retryBtnText}>Try again</Text>
                  </Pressable>
                </View>
              ) : viewerHtml ? (
                <WebView
                  ref={webRef}
                  originWhitelist={['*']}
                  source={{ html: viewerHtml }}
                  onMessage={onMessage}
                  javaScriptEnabled
                  domStorageEnabled
                  allowFileAccess
                  mixedContentMode="always"
                  scalesPageToFit={false}
                  setBuiltInZoomControls={false}
                  setDisplayZoomControls={false}
                  style={styles.webview}
                />
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.nonPdfBox}>
            <Text style={styles.errorTitle}>PDF reader</Text>
            <Text style={styles.errorText}>
              This file is not a PDF. Convert it to PDF in the portal for in-app reading with page
              memory, search, and jump-to-end.
            </Text>
            <Pressable onPress={onClose} style={styles.endBtn}>
              <Text style={styles.endBtnText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NAMIBIA.sand,
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
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomLabelBtn: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: NAMIBIA.sand,
    borderWidth: 1,
    borderColor: NAMIBIA.line,
    alignItems: 'center',
  },
  zoomLabelText: {
    color: NAMIBIA.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  zoomHint: {
    flex: 1,
    color: NAMIBIA.muted,
    fontSize: 11,
    fontWeight: '600',
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
  viewer: {
    flex: 1,
    position: 'relative',
    backgroundColor: NAMIBIA.sand,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(244,241,232,0.92)',
    zIndex: 2,
  },
  loadingText: {
    color: NAMIBIA.muted,
    fontWeight: '600',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAMIBIA.ink,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: NAMIBIA.muted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: NAMIBIA.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: NAMIBIA.white,
    fontWeight: '800',
  },
  nonPdfBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
});
