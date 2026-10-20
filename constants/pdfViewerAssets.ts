import * as FileSystem from 'expo-file-system/legacy';

import { CURRICULUM_API_BASE } from '@/constants/curriculumSync';

const PDFJS_DIR = `${FileSystem.documentDirectory || ''}edu_offline/pdfjs/`;
const PDF_MIN = 'pdf.min.js';
const PDF_WORKER = 'pdf.worker.min.js';
const PDFJS_VERSION = '3.11.174';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

export function getPdfJsDir() {
  return PDFJS_DIR;
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

async function downloadIfMissing(fileName: string, remoteUrl: string) {
  const localPath = `${PDFJS_DIR}${fileName}`;
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists && (info.size || 0) > 1000) return localPath;
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (result.status && result.status >= 400) {
    throw new Error(`Failed to download ${fileName}`);
  }
  return result.uri;
}

/** Cache pdf.js scripts on device so the materials reader works offline. */
export async function ensurePdfJsAssets(): Promise<{ dir: string }> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Local storage is not available on this device.');
  }
  await ensureDir(PDFJS_DIR);
  await downloadIfMissing(PDF_MIN, `${PDFJS_CDN}/${PDF_MIN}`);
  await downloadIfMissing(PDF_WORKER, `${PDFJS_CDN}/${PDF_WORKER}`);
  return { dir: PDFJS_DIR };
}

export async function readPdfJsScripts(): Promise<{ pdfJs: string; workerJs: string }> {
  await ensurePdfJsAssets();
  const pdfJs = await FileSystem.readAsStringAsync(`${PDFJS_DIR}${PDF_MIN}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const workerJs = await FileSystem.readAsStringAsync(`${PDFJS_DIR}${PDF_WORKER}`, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (!pdfJs || pdfJs.length < 1000) {
    throw new Error('PDF engine is incomplete. Connect to the internet once to download it.');
  }
  return { pdfJs, workerJs };
}

async function looksLikePdf(localPath: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (!info.exists || (info.size || 0) < 5) return false;
    const head = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.UTF8,
      length: 5,
      position: 0,
    });
    return head.startsWith('%PDF');
  } catch {
    return false;
  }
}

/**
 * Make sure the PDF bytes are on disk (download remote URL if needed).
 * Returns a local file:// URI.
 */
export async function ensureLocalPdfFile(
  fileUrl: string,
  materialId: string
): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Local storage is not available on this device.');
  }
  await ensureDir(PDFJS_DIR);

  if (fileUrl.startsWith('file:')) {
    const info = await FileSystem.getInfoAsync(fileUrl);
    if (!info.exists) throw new Error('Saved PDF file is missing on this device.');
    if (!(await looksLikePdf(fileUrl))) {
      throw new Error('Saved file is not a valid PDF.');
    }
    return fileUrl;
  }

  const safeId = String(materialId || 'doc').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const localPath = `${PDFJS_DIR}material-${safeId}.pdf`;
  const existing = await FileSystem.getInfoAsync(localPath);
  if (existing.exists && (existing.size || 0) > 100 && (await looksLikePdf(localPath))) {
    return localPath;
  }
  if (existing.exists) {
    await FileSystem.deleteAsync(localPath, { idempotent: true });
  }

  const remote = /^https?:\/\//i.test(fileUrl)
    ? fileUrl
    : `${CURRICULUM_API_BASE}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;

  const result = await FileSystem.downloadAsync(remote, localPath);
  if (result.status && result.status >= 400) {
    throw new Error(
      `Could not download the PDF (${result.status}). Check the server and your connection.`
    );
  }
  if (!(await looksLikePdf(result.uri))) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error(
      'The downloaded file is not a valid PDF. Re-upload a PDF in the teacher portal.'
    );
  }
  return result.uri;
}

export async function readPdfAsBase64(localUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export function isLikelyPdf(url: string, title?: string | null) {
  const value = `${url || ''} ${title || ''}`.toLowerCase();
  if (/\.docx?($|\?)/i.test(url)) return false;
  if (/\.pdf($|\?)/i.test(url)) return true;
  if (value.includes('application/pdf')) return true;
  if (value.includes('.pdf')) return true;
  if (/\/uploads\//i.test(url) && !/\.docx?($|\?)/i.test(url)) return true;
  return false;
}
