import { getSubjectById } from '@/constants/curriculum';
import {
  getSubjectMaterials,
  hydrateCurriculumFromCache,
  resolveSubjectStudyData,
  syncCurriculum,
} from '@/constants/curriculumSync';
import { hydrateLessonsFromCache, syncLessons } from '@/constants/lessonSync';
import { isDeviceOnline } from '@/constants/network';
import {
  downloadOfflineFile,
  hydrateOfflineFiles,
} from '@/constants/offlineFiles';
import { ensurePdfJsAssets } from '@/constants/pdfViewerAssets';

export type OfflineBootstrapProgress = {
  phase: 'checking' | 'curriculum' | 'lessons' | 'files' | 'done' | 'error';
  message: string;
  current?: number;
  total?: number;
};

export type OfflineBootstrapResult = {
  ok: boolean;
  error?: string;
  filesDownloaded: number;
  filesFailed: number;
};

function collectAssetPaths(gradeId: string, subjectIds: string[]): string[] {
  const paths = new Set<string>();

  for (const subjectId of subjectIds) {
    const subject = getSubjectById(subjectId);
    if (!subject) continue;

    const materials = getSubjectMaterials(subject.name);
    for (const item of materials) {
      if (item.fileUrl) paths.add(item.fileUrl);
    }

    const study = resolveSubjectStudyData(
      subject.id,
      subject.name,
      subject.category,
      gradeId
    );
    for (const module of study.modules) {
      for (const subtopic of module.subtopics) {
        for (const image of subtopic.mediaImages || []) {
          if (image) paths.add(image);
        }
        for (const video of subtopic.mediaVideos || []) {
          if (video) paths.add(video);
        }
      }
    }
  }

  return Array.from(paths);
}

/**
 * Requires internet. Syncs curriculum + lessons, then downloads material/media
 * files for the learner's selected subjects so the app can run offline.
 */
export async function bootstrapLearnerOffline(options: {
  gradeId: string;
  subjectIds: string[];
  onProgress?: (progress: OfflineBootstrapProgress) => void;
}): Promise<OfflineBootstrapResult> {
  const { gradeId, subjectIds, onProgress } = options;
  const report = (progress: OfflineBootstrapProgress) => onProgress?.(progress);

  report({ phase: 'checking', message: 'Checking internet connection…' });
  const online = await isDeviceOnline();
  if (!online) {
    const error =
      'Internet is required to download your grade content. Connect to Wi‑Fi or mobile data, then try again.';
    report({ phase: 'error', message: error });
    return { ok: false, error, filesDownloaded: 0, filesFailed: 0 };
  }

  await hydrateOfflineFiles();
  await hydrateCurriculumFromCache();
  await hydrateLessonsFromCache();

  report({ phase: 'curriculum', message: 'Preparing offline PDF reader…' });
  try {
    await ensurePdfJsAssets();
  } catch {
    // PDF engine can still download later when a material is opened online.
  }

  report({ phase: 'curriculum', message: 'Downloading curriculum, quizzes, and materials…' });
  const curriculum = await syncCurriculum(true);
  if (curriculum.error && curriculum.count === 0) {
    const error =
      'Could not download curriculum from the server. Check your connection and try again.';
    report({ phase: 'error', message: error });
    return { ok: false, error, filesDownloaded: 0, filesFailed: 0 };
  }

  report({ phase: 'lessons', message: 'Downloading lessons…' });
  const lessons = await syncLessons(true);
  if (lessons.error && lessons.count === 0) {
    // Lessons may be empty for some grades — only fail if we also have no curriculum.
    if (curriculum.count === 0) {
      const error = 'Could not download lessons. Check your connection and try again.';
      report({ phase: 'error', message: error });
      return { ok: false, error, filesDownloaded: 0, filesFailed: 0 };
    }
  }

  const assets = collectAssetPaths(gradeId, subjectIds);
  let filesDownloaded = 0;
  let filesFailed = 0;

  if (assets.length) {
    report({
      phase: 'files',
      message: 'Saving files for offline use…',
      current: 0,
      total: assets.length,
    });

    for (let i = 0; i < assets.length; i++) {
      const path = assets[i];
      report({
        phase: 'files',
        message: `Saving file ${i + 1} of ${assets.length}…`,
        current: i + 1,
        total: assets.length,
      });
      const local = await downloadOfflineFile(path);
      if (local) filesDownloaded += 1;
      else filesFailed += 1;
    }
  }

  report({
    phase: 'done',
    message: 'Your content is saved for offline learning.',
    current: filesDownloaded,
    total: assets.length,
  });

  return { ok: true, filesDownloaded, filesFailed };
}
