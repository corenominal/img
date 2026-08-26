import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_RECENT_FILES = 10;

function recentFilesPath(): string {
  return path.join(app.getPath('userData'), 'recent-files.json');
}

async function persist(files: string[]): Promise<void> {
  try {
    await mkdir(path.dirname(recentFilesPath()), { recursive: true });
    await writeFile(recentFilesPath(), JSON.stringify(files));
  } catch (error) {
    console.error('[recent-files] Failed to persist recent files list', error);
  }
}

export async function getRecentFiles(): Promise<string[]> {
  try {
    const raw = await readFile(recentFilesPath(), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    // No recent-files.json yet (first launch) or it's unreadable/corrupt —
    // either way, an empty list is a safe, silent fallback.
    return [];
  }
}

// Records a successfully opened/saved path, most-recent first, capped and
// de-duplicated. Also feeds the OS-level recent-documents list (macOS Dock
// menu, Windows Jump List) per plan.md's "use platform conventions".
export async function addRecentFile(filePath: string): Promise<string[]> {
  const existing = await getRecentFiles();
  const next = [filePath, ...existing.filter((entry) => entry !== filePath)].slice(
    0,
    MAX_RECENT_FILES,
  );
  await persist(next);
  app.addRecentDocument(filePath);
  return next;
}

export async function clearRecentFiles(): Promise<void> {
  await persist([]);
  app.clearRecentDocuments();
}
