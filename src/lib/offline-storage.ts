/**
 * Offline Storage Utility for Preventivos
 * 
 * Provides:
 * - Auto-save form drafts to localStorage (debounced)
 * - Draft management (save, load, list, delete)
 * - Offline photo queue (store base64 locally, upload when online)
 * - Pending submissions queue (save & sync when back online)
 * - Online/offline detection
 */

import { PreventivoFormData } from './store';

// ============================================================
// STORAGE KEYS
// ============================================================
const DRAFT_PREFIX = 'ec_draft_';
const PENDING_SUBMISSIONS_KEY = 'ec_pending_submissions';
const OFFLINE_PHOTOS_KEY = 'ec_offline_photos';
const LAST_AUTOSAVE_KEY = 'ec_last_autosave';

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
 * Save a form draft to localStorage.
 * Keyed by tecnicoId + centroId to allow multiple concurrent drafts.
 */
export function saveDraft(form: PreventivoFormData, centroNombre?: string): DraftData {
  const id = generateDraftId(form);
  
  // Count filled fields and photos
  const fieldCount = Object.values(form.fields).filter(v => v && v.trim() !== '').length;
  let photoCount = 0;
  Object.values(form.fotos).forEach(arr => { photoCount += arr.length; });
  photoCount += form.fotosAdicionales.length;
  // Also count image fields in form.fields that have values
  Object.values(form.fields).forEach(v => {
    if (v && (v.startsWith('/api/') || v.startsWith('data:image') || v.length > 200)) {
      photoCount++;
    }
  });

  const draft: DraftData = {
    id,
    savedAt: new Date().toISOString(),
    tecnicoName: form.tecnicoName || 'Sin técnico',
    centroId: form.centroId || '',
    centroNombre: centroNombre || form.centroId || 'Sin centro',
    fecha: form.fecha || '',
    form,
    photoCount,
    fieldCount,
  };

  try {
    localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(draft));
    localStorage.setItem(LAST_AUTOSAVE_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Error saving draft to localStorage:', e);
    // localStorage might be full — try to clean up old drafts
    cleanupOldDrafts(5);
    try {
      localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(draft));
    } catch (e2) {
      console.error('Still cannot save draft after cleanup:', e2);
    }
  }

  return draft;
}

/**
 * Load a specific draft by ID
 */
export function loadDraft(draftId: string): DraftData | null {
  try {
    const data = localStorage.getItem(DRAFT_PREFIX + draftId);
    if (!data) return null;
    return JSON.parse(data) as DraftData;
  } catch {
    return null;
  }
}

/**
 * Load the most recent draft for the current form state
 */
export function loadCurrentDraft(form: PreventivoFormData): DraftData | null {
  const id = generateDraftId(form);
  return loadDraft(id);
}

/**
 * List all saved drafts, sorted by most recent first
 */
export function listDrafts(): DraftData[] {
  const drafts: DraftData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            drafts.push(JSON.parse(data));
          } catch { /* skip corrupt */ }
        }
      }
    }
  } catch { /* localStorage unavailable */ }
  
  return drafts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

/**
 * Delete a specific draft
 */
export function deleteDraft(draftId: string): void {
  localStorage.removeItem(DRAFT_PREFIX + draftId);
}

/**
 * Clean up old drafts, keeping only the N most recent
 */
export function cleanupOldDrafts(keepCount: number = 10): void {
  const drafts = listDrafts();
  if (drafts.length > keepCount) {
    const toDelete = drafts.slice(keepCount);
    toDelete.forEach(d => deleteDraft(d.id));
  }
}

/**
 * Get the last autosave timestamp
 */
export function getLastAutosaveTime(): string | null {
  return localStorage.getItem(LAST_AUTOSAVE_KEY);
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
export function queuePendingSubmission(
  form: PreventivoFormData,
  estado: string,
  pendingPhotos: PendingPhoto[] = []
): PendingSubmission {
  const submissions = getPendingSubmissions();
  
  const submission: PendingSubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    form: { ...form },
    estado,
    pendingPhotos,
    retryCount: 0,
  };

  submissions.push(submission);
  
  try {
    localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch (e) {
    console.error('Error queuing pending submission:', e);
  }

  return submission;
}

/**
 * Get all pending submissions
 */
export function getPendingSubmissions(): PendingSubmission[] {
  try {
    const data = localStorage.getItem(PENDING_SUBMISSIONS_KEY);
    if (!data) return [];
    return JSON.parse(data) as PendingSubmission[];
  } catch {
    return [];
  }
}

/**
 * Remove a pending submission after successful sync
 */
export function removePendingSubmission(submissionId: string): void {
  const submissions = getPendingSubmissions().filter(s => s.id !== submissionId);
  localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

/**
 * Update a pending submission (e.g., increment retry count)
 */
export function updatePendingSubmission(submissionId: string, updates: Partial<PendingSubmission>): void {
  const submissions = getPendingSubmissions().map(s => 
    s.id === submissionId ? { ...s, ...updates } : s
  );
  localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

/**
 * Get count of pending submissions
 */
export function getPendingSubmissionCount(): number {
  return getPendingSubmissions().length;
}

// ============================================================
// OFFLINE PHOTOS
// ============================================================

/**
 * Save a photo to the offline queue (for uploading when back online)
 */
export function saveOfflinePhoto(entry: OfflinePhotoEntry): void {
  const photos = getOfflinePhotos();
  // Replace existing entry for same fieldKey
  const filtered = photos.filter(p => p.fieldKey !== entry.fieldKey);
  filtered.push(entry);
  localStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(filtered));
}

/**
 * Get all offline photos
 */
export function getOfflinePhotos(): OfflinePhotoEntry[] {
  try {
    const data = localStorage.getItem(OFFLINE_PHOTOS_KEY);
    if (!data) return [];
    return JSON.parse(data) as OfflinePhotoEntry[];
  } catch {
    return [];
  }
}

/**
 * Remove an offline photo after successful upload
 */
export function removeOfflinePhoto(fieldKey: string): void {
  const photos = getOfflinePhotos().filter(p => p.fieldKey !== fieldKey);
  localStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(photos));
}

/**
 * Clear all offline photos for a specific form session
 */
export function clearOfflinePhotos(): void {
  localStorage.removeItem(OFFLINE_PHOTOS_KEY);
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
 * Calculate localStorage usage stats
 */
export function getStorageStats(): { usedMB: number; draftsCount: number; pendingCount: number } {
  let totalSize = 0;
  let draftsCount = 0;
  const pendingCount = getPendingSubmissionCount();
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
        if (key.startsWith(DRAFT_PREFIX)) draftsCount++;
      }
    }
  } catch { /* ignore */ }
  
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
