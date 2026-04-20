/**
 * Offline Storage Utility for Preventivos
 * 
 * Uses IndexedDB instead of localStorage to avoid the ~5-10MB limit
 * that causes overflow with base64 photos.
 * 
 * Provides:
 * - Auto-save form drafts (debounced)
 * - Draft management (save, load, list, delete)
 * - Offline photo queue (store base64 locally, upload when online)
 * - Pending submissions queue (save & sync when back online)
 * - Online/offline detection
 */

import { PreventivoFormData } from './store';
import { sanitizeFormData } from './sanitize';

// ============================================================
// INDEXEDDB SETUP
// ============================================================
const DB_NAME = 'centeno-offline-db';
const DB_VERSION = 1;

const STORES = {
  drafts: 'drafts',
  pendingSubmissions: 'pendingSubmissions',
  offlinePhotos: 'offlinePhotos',
  meta: 'meta',
} as const;

// Singleton DB connection
let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Open (or return the existing) IndexedDB connection.
 * Singleton pattern ensures we don't open multiple connections.
 */
function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    // Guard for SSR
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Drafts store: key = draft ID (tecnicoId_centroId)
      if (!db.objectStoreNames.contains(STORES.drafts)) {
        db.createObjectStore(STORES.drafts, { keyPath: 'id' });
      }

      // Pending submissions store: key = submission id
      if (!db.objectStoreNames.contains(STORES.pendingSubmissions)) {
        db.createObjectStore(STORES.pendingSubmissions, { keyPath: 'id' });
      }

      // Offline photos store: key = fieldKey
      if (!db.objectStoreNames.contains(STORES.offlinePhotos)) {
        db.createObjectStore(STORES.offlinePhotos, { keyPath: 'fieldKey' });
      }

      // Meta store for small key-value data (last autosave time, etc.)
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;

      // Handle connection closing (e.g. version upgrade in another tab)
      dbInstance.onclose = () => {
        dbInstance = null;
        dbInitPromise = null;
      };

      // Handle unexpected version change
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      dbInitPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };

    request.onblocked = () => {
      // Another tab has the DB open; just wait
    };
  });

  return dbInitPromise;
}

// ============================================================
// IDB HELPERS
// ============================================================

/** Run a transaction on a single store in readwrite mode */
async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | IDBRequest[],
): Promise<T> {
  const db = await getDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const requests = fn(store);

    // Handle single or multiple requests — resolve with last result
    const reqs = Array.isArray(requests) ? requests : [requests];
    const last = reqs[reqs.length - 1];

    tx.oncomplete = () => {
      resolve(last.result as T);
    };
    tx.onerror = () => {
      reject(tx.error);
    };
    tx.onabort = () => {
      reject(tx.error || new Error('Transaction aborted'));
    };
  });
}

/** Get all records from a store */
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/** Get a single record by key */
async function getFromStore<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/** Put a record into a store (insert or update) */
async function putToStore<T>(storeName: string, value: T): Promise<void> {
  await withStore<void>(storeName, 'readwrite', (store) => store.put(value));
}

/** Delete a record by key */
async function deleteFromStore(storeName: string, key: string): Promise<void> {
  await withStore<void>(storeName, 'readwrite', (store) => store.delete(key));
}

/** Clear all records in a store */
async function clearStore(storeName: string): Promise<void> {
  await withStore<void>(storeName, 'readwrite', (store) => store.clear());
}

/** Count records in a store */
async function countStore(storeName: string): Promise<number> {
  const db = await getDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/** Meta store helpers */
async function getMeta(key: string): Promise<string | null> {
  try {
    const record = await getFromStore<{ key: string; value: string }>(STORES.meta, key);
    return record?.value ?? null;
  } catch {
    return null;
  }
}

async function setMeta(key: string, value: string): Promise<void> {
  try {
    await putToStore(STORES.meta, { key, value });
  } catch {
    // Silently fail — meta data is non-critical
  }
}

// ============================================================
// TYPES
// ============================================================
export interface DraftData {
  id: string;
  savedAt: string;              // ISO date
  tecnicoName: string;
  centroId: string;
  centroNombre?: string;
  fecha: string;
  form: PreventivoFormData;
  photoCount: number;
  fieldCount: number;
}

export interface PendingSubmission {
  id: string;
  createdAt: string;            // ISO date
  form: PreventivoFormData;
  estado: string;
  // Photos stored as base64 that need uploading when online
  pendingPhotos: PendingPhoto[];
  retryCount: number;
  lastError?: string;
}

export interface PendingPhoto {
  fieldKey: string;
  fieldLabel: string;
  base64: string;               // Compressed base64 data
  year: string;
  provincia: string;
  centroNombre: string;
  centroCodigo: string;
}

export interface OfflinePhotoEntry {
  fieldKey: string;
  fieldLabel: string;
  base64: string;
  timestamp: string;
}

// ============================================================
// DRAFT MANAGEMENT
// ============================================================

/**
 * Save a form draft to IndexedDB.
 * Keyed by tecnicoId + centroId to allow multiple concurrent drafts.
 */
export async function saveDraft(form: PreventivoFormData, centroNombre?: string): Promise<DraftData> {
  // Sanitize form fields before saving (XSS prevention for localStorage/IndexedDB)
  const sanitizedForm: PreventivoFormData = {
    ...form,
    fields: sanitizeFormData(form.fields),
  };

  const id = generateDraftId(sanitizedForm);
  
  // Count filled fields and photos
  const fieldCount = Object.values(sanitizedForm.fields).filter(v => v && v.trim() !== '').length;
  let photoCount = 0;
  Object.values(sanitizedForm.fotos).forEach(arr => { photoCount += arr.length; });
  photoCount += sanitizedForm.fotosAdicionales.length;
  // Also count image fields in form.fields that have values
  Object.values(sanitizedForm.fields).forEach(v => {
    if (v && (v.startsWith('/api/') || v.startsWith('data:image') || v.length > 200)) {
      photoCount++;
    }
  });

  const draft: DraftData = {
    id,
    savedAt: new Date().toISOString(),
    tecnicoName: sanitizedForm.tecnicoName || 'Sin técnico',
    centroId: sanitizedForm.centroId || '',
    centroNombre: centroNombre || sanitizedForm.centroId || 'Sin centro',
    fecha: sanitizedForm.fecha || '',
    form: sanitizedForm,
    photoCount,
    fieldCount,
  };

  try {
    await putToStore(STORES.drafts, draft);
    await setMeta('lastAutosave', new Date().toISOString());
  } catch (e) {
    console.error('Error saving draft to IndexedDB:', e);
    // Try to clean up old drafts and retry
    await cleanupOldDrafts(5);
    try {
      await putToStore(STORES.drafts, draft);
    } catch (e2) {
      console.error('Still cannot save draft after cleanup:', e2);
    }
  }

  return draft;
}

/**
 * Load a specific draft by ID
 */
export async function loadDraft(draftId: string): Promise<DraftData | null> {
  try {
    const data = await getFromStore<DraftData>(STORES.drafts, draftId);
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Load the most recent draft for the current form state
 */
export async function loadCurrentDraft(form: PreventivoFormData): Promise<DraftData | null> {
  const id = generateDraftId(form);
  return loadDraft(id);
}

/**
 * List all saved drafts, sorted by most recent first
 */
export async function listDrafts(): Promise<DraftData[]> {
  try {
    const drafts = await getAllFromStore<DraftData>(STORES.drafts);
    return drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Delete a specific draft
 */
export async function deleteDraft(draftId: string): Promise<void> {
  try {
    await deleteFromStore(STORES.drafts, draftId);
  } catch {
    // Silently fail
  }
}

/**
 * Clean up old drafts, keeping only the N most recent
 */
export async function cleanupOldDrafts(keepCount: number = 10): Promise<void> {
  try {
    const drafts = await listDrafts();
    if (drafts.length > keepCount) {
      const toDelete = drafts.slice(keepCount);
      await Promise.all(toDelete.map(d => deleteDraft(d.id)));
    }
  } catch {
    // Silently fail
  }
}

/**
 * Get the last autosave timestamp
 */
export async function getLastAutosaveTime(): Promise<string | null> {
  return getMeta('lastAutosave');
}

/**
 * Generate a deterministic draft ID from form data
 */
function generateDraftId(form: PreventivoFormData): string {
  // Use tecnicoId + centroId as the key — one draft per centro per técnico
  return `${form.tecnicoId || 'no-tech'}_${form.centroId || 'no-centro'}`;
}

// ============================================================
// PENDING SUBMISSIONS (OFFLINE QUEUE)
// ============================================================

/**
 * Save a submission to the pending queue (for when connectivity returns)
 */
export async function queuePendingSubmission(
  form: PreventivoFormData,
  estado: string,
  pendingPhotos: PendingPhoto[] = []
): Promise<PendingSubmission> {
  const submissions = await getPendingSubmissions();
  
  const submission: PendingSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    form: { ...form, fields: sanitizeFormData(form.fields) },
    estado,
    pendingPhotos,
    retryCount: 0,
  };

  submissions.push(submission);
  
  try {
    // Store the full array — we use a single key for all submissions
    await putToStore(STORES.pendingSubmissions, { id: '__all_submissions__', submissions });
  } catch (e) {
    console.error('Error queuing pending submission:', e);
  }

  return submission;
}

/**
 * Get all pending submissions
 */
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  try {
    const record = await getFromStore<{ id: string; submissions: PendingSubmission[] }>(
      STORES.pendingSubmissions,
      '__all_submissions__',
    );
    return record?.submissions ?? [];
  } catch {
    return [];
  }
}

/**
 * Remove a pending submission after successful sync
 */
export async function removePendingSubmission(submissionId: string): Promise<void> {
  try {
    const submissions = (await getPendingSubmissions()).filter(s => s.id !== submissionId);
    await putToStore(STORES.pendingSubmissions, { id: '__all_submissions__', submissions });
  } catch {
    // Silently fail
  }
}

/**
 * Update a pending submission (e.g., increment retry count)
 */
export async function updatePendingSubmission(submissionId: string, updates: Partial<PendingSubmission>): Promise<void> {
  try {
    const submissions = (await getPendingSubmissions()).map(s => 
      s.id === submissionId ? { ...s, ...updates } : s
    );
    await putToStore(STORES.pendingSubmissions, { id: '__all_submissions__', submissions });
  } catch {
    // Silently fail
  }
}

/**
 * Get count of pending submissions
 */
export async function getPendingSubmissionCount(): Promise<number> {
  const submissions = await getPendingSubmissions();
  return submissions.length;
}

// ============================================================
// OFFLINE PHOTOS
// ============================================================

/**
 * Save a photo to the offline queue (for uploading when back online)
 */
export async function saveOfflinePhoto(entry: OfflinePhotoEntry): Promise<void> {
  try {
    await putToStore(STORES.offlinePhotos, entry);
  } catch (e) {
    console.error('Error saving offline photo to IndexedDB:', e);
  }
}

/**
 * Get all offline photos
 */
export async function getOfflinePhotos(): Promise<OfflinePhotoEntry[]> {
  try {
    return await getAllFromStore<OfflinePhotoEntry>(STORES.offlinePhotos);
  } catch {
    return [];
  }
}

/**
 * Remove an offline photo after successful upload
 */
export async function removeOfflinePhoto(fieldKey: string): Promise<void> {
  try {
    await deleteFromStore(STORES.offlinePhotos, fieldKey);
  } catch {
    // Silently fail
  }
}

/**
 * Clear all offline photos for a specific form session
 */
export async function clearOfflinePhotos(): Promise<void> {
  try {
    await clearStore(STORES.offlinePhotos);
  } catch {
    // Silently fail
  }
}

// ============================================================
// ONLINE/OFFLINE DETECTION
// ============================================================

/**
 * Check if the browser is currently online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Calculate IndexedDB storage usage stats
 */
export async function getStorageStats(): Promise<{ usedMB: number; draftsCount: number; pendingCount: number }> {
  let draftsCount = 0;
  let pendingCount = 0;

  try {
    draftsCount = await countStore(STORES.drafts);
    const submissions = await getPendingSubmissions();
    pendingCount = submissions.length;
  } catch {
    // Fall through with zeros
  }

  // Estimate storage usage by reading all data
  let totalSize = 0;
  try {
    // Drafts
    const drafts = await getAllFromStore<DraftData>(STORES.drafts);
    totalSize += new Blob([JSON.stringify(drafts)]).size;

    // Pending submissions
    const subsRecord = await getFromStore<{ submissions: PendingSubmission[] }>(STORES.pendingSubmissions, '__all_submissions__');
    if (subsRecord?.submissions) {
      totalSize += new Blob([JSON.stringify(subsRecord.submissions)]).size;
    }

    // Offline photos
    const photos = await getAllFromStore<OfflinePhotoEntry>(STORES.offlinePhotos);
    totalSize += new Blob([JSON.stringify(photos)]).size;

    // Meta
    const allMeta = await getAllFromStore<Record<string, string>>(STORES.meta);
    totalSize += new Blob([JSON.stringify(allMeta)]).size;
  } catch {
    // Fall through with whatever we have
  }

  return {
    usedMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
    draftsCount,
    pendingCount,
  };
}

/**
 * Format a timestamp for display
 */
export function formatTimeAgo(isoDate: string): string {
  const now = new Date().getTime();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  
  if (diffMs < 60000) return 'hace un momento';
  if (diffMs < 3600000) return `hace ${Math.floor(diffMs / 60000)} min`;
  if (diffMs < 86400000) return `hace ${Math.floor(diffMs / 3600000)} h`;
  return `hace ${Math.floor(diffMs / 86400000)} días`;
}
