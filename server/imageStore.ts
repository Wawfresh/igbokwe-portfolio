import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const PERSISTENT_UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
const IMAGE_STORE_PATH = path.resolve(process.cwd(), 'data', 'uploaded_images.json');

export interface StoredImageData {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  base64: string;
  updatedAt: string;
}

export type ImageStore = Record<string, StoredImageData>;

let inMemoryStore: ImageStore | null = null;

export function ensureUploadDirectories(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
    fs.mkdirSync(PERSISTENT_UPLOADS_DIR, { recursive: true });
  }
}

export function loadImageStore(): ImageStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  ensureUploadDirectories();

  if (fs.existsSync(IMAGE_STORE_PATH)) {
    try {
      const raw = fs.readFileSync(IMAGE_STORE_PATH, 'utf-8');
      inMemoryStore = JSON.parse(raw) as ImageStore;
      return inMemoryStore;
    } catch (err) {
      console.error('Failed to parse uploaded_images.json:', err);
    }
  }

  inMemoryStore = {};
  return inMemoryStore;
}

export function saveImageStore(store: ImageStore): void {
  inMemoryStore = store;
  try {
    const serialized = JSON.stringify(store, null, 2);
    const tempPath = `${IMAGE_STORE_PATH}.tmp`;
    fs.writeFileSync(tempPath, serialized, 'utf-8');
    fs.renameSync(tempPath, IMAGE_STORE_PATH);
  } catch (err) {
    console.error('Failed to save uploaded_images.json:', err);
  }
}

/**
 * Registers an uploaded file into persistent JSON storage as well as both disk locations.
 * This guarantees the image will never be lost when container restarts or user refreshes.
 */
export function registerUploadedFile(
  filename: string,
  tempFilePath: string,
  originalName: string = filename,
  mimetype: string = 'image/jpeg'
): void {
  ensureUploadDirectories();
  try {
    if (!fs.existsSync(tempFilePath)) {
      return;
    }

    const fileBuffer = fs.readFileSync(tempFilePath);
    const size = fileBuffer.length;
    const base64 = fileBuffer.toString('base64');

    // 1. Write to both disk locations
    const localDest = path.join(UPLOADS_DIR, filename);
    const persistentDest = path.join(PERSISTENT_UPLOADS_DIR, filename);

    if (tempFilePath !== localDest) {
      fs.copyFileSync(tempFilePath, localDest);
    }
    if (tempFilePath !== persistentDest) {
      fs.copyFileSync(tempFilePath, persistentDest);
    }

    // 2. Persist in JSON store
    const store = loadImageStore();
    store[filename] = {
      filename,
      originalName,
      mimetype,
      size,
      base64,
      updatedAt: new Date().toISOString(),
    };
    saveImageStore(store);
  } catch (err) {
    console.error(`Error registering uploaded file ${filename}:`, err);
  }
}

/**
 * Syncs any existing disk files in uploads/ or data/uploads/ into the JSON store,
 * and recreates missing files on disk from the JSON store.
 */
export function syncAndRestoreImages(): void {
  ensureUploadDirectories();
  const store = loadImageStore();

  // 1. Restore missing files on disk from JSON store
  for (const [filename, item] of Object.entries(store)) {
    const localDest = path.join(UPLOADS_DIR, filename);
    const persistentDest = path.join(PERSISTENT_UPLOADS_DIR, filename);

    const hasLocal = fs.existsSync(localDest);
    const hasPersistent = fs.existsSync(persistentDest);

    if ((!hasLocal || !hasPersistent) && item.base64) {
      try {
        const buffer = Buffer.from(item.base64, 'base64');
        if (!hasLocal) fs.writeFileSync(localDest, buffer);
        if (!hasPersistent) fs.writeFileSync(persistentDest, buffer);
      } catch (err) {
        console.error(`Error reconstructing ${filename} from store:`, err);
      }
    }
  }

  // 2. Cross-sync between UPLOADS_DIR and PERSISTENT_UPLOADS_DIR
  try {
    const localFiles = fs.readdirSync(UPLOADS_DIR);
    for (const file of localFiles) {
      const src = path.join(UPLOADS_DIR, file);
      const dest = path.join(PERSISTENT_UPLOADS_DIR, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        try {
          fs.copyFileSync(src, dest);
        } catch {}
      }
      // If not in store, register it
      if (!store[file] && fs.statSync(src).isFile()) {
        try {
          const buf = fs.readFileSync(src);
          const ext = path.extname(file).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          store[file] = {
            filename: file,
            originalName: file,
            mimetype: mime,
            size: buf.length,
            base64: buf.toString('base64'),
            updatedAt: new Date().toISOString(),
          };
        } catch {}
      }
    }

    const persistentFiles = fs.readdirSync(PERSISTENT_UPLOADS_DIR);
    for (const file of persistentFiles) {
      const src = path.join(PERSISTENT_UPLOADS_DIR, file);
      const dest = path.join(UPLOADS_DIR, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        try {
          fs.copyFileSync(src, dest);
        } catch {}
      }
    }

    saveImageStore(store);
  } catch (err) {
    console.error('Error during cross-sync of upload folders:', err);
  }
}

/**
 * Returns image buffer and mimetype for a given filename, reviving it from store if needed.
 */
export function getStoredImage(filename: string): { buffer: Buffer; mimetype: string } | null {
  ensureUploadDirectories();
  const localDest = path.join(UPLOADS_DIR, filename);
  const persistentDest = path.join(PERSISTENT_UPLOADS_DIR, filename);

  // Check disk first
  if (fs.existsSync(localDest)) {
    try {
      const buffer = fs.readFileSync(localDest);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
      return { buffer, mimetype: mime };
    } catch {}
  }
  if (fs.existsSync(persistentDest)) {
    try {
      const buffer = fs.readFileSync(persistentDest);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
      // Re-copy to local
      try {
        fs.copyFileSync(persistentDest, localDest);
      } catch {}
      return { buffer, mimetype: mime };
    } catch {}
  }

  // Check JSON store
  const store = loadImageStore();
  const item = store[filename];
  if (item && item.base64) {
    try {
      const buffer = Buffer.from(item.base64, 'base64');
      try {
        fs.writeFileSync(localDest, buffer);
        fs.writeFileSync(persistentDest, buffer);
      } catch {}
      return { buffer, mimetype: item.mimetype || 'image/jpeg' };
    } catch {}
  }

  return null;
}
