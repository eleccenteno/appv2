'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore, PreventivoFormData } from '@/lib/store';
import {
  saveDraft,
  loadCurrentDraft,
  listDrafts,
  deleteDraft,
  cleanupOldDrafts,
  getLastAutosaveTime,
  queuePendingSubmission,
  getPendingSubmissions,
  removePendingSubmission,
  updatePendingSubmission,
  isOnline,
  DraftData,
  PendingPhoto,
  formatTimeAgo,
  getStorageStats,
  saveOfflinePhoto,
  getOfflinePhotos,
  removeOfflinePhoto,
} from '@/lib/offline-storage';

// ============================================================
// ONLINE/OFFLINE HOOK
// ============================================================

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

// ============================================================
// AUTOSAVE HOOK
// ============================================================

export function useAutosave() {
  const preventivoForm = useAppStore(s => s.preventivoForm);
  const [lastSaved, setLastSaved] = useState<string | null>(getLastAutosaveTime());
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave — saves 2 seconds after the last change
  useEffect(() => {
    // Only autosave if there's meaningful data
    if (!preventivoForm.centroId && !preventivoForm.fecha) return;
    
    // Count filled fields
    const filledCount = Object.values(preventivoForm.fields).filter(v => v && v.trim()).length;
    if (filledCount === 0 && !preventivoForm.centroId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsSaving(true);
      try {
        // Get centro name from the form data if available
        const centroNombre = preventivoForm.fields['nombreCentro'] || preventivoForm.centroId;
        saveDraft(preventivoForm, centroNombre);
        setLastSaved(new Date().toISOString());
      } catch (e) {
        console.error('Autosave error:', e);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2-second debounce

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [preventivoForm]);

  // Cleanup old drafts on mount
  useEffect(() => {
    cleanupOldDrafts(15);
  }, []);

  return { lastSaved, isSaving, formattedTime: lastSaved ? formatTimeAgo(lastSaved) : null };
}

// ============================================================
// DRAFTS MANAGEMENT HOOK
// ============================================================

export function useDrafts() {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const { setPreventivoForm, setPreventivoField, resetPreventivoForm } = useAppStore();

  const refreshDrafts = useCallback(() => {
    setDrafts(listDrafts());
  }, []);

  // Initialize drafts on mount (safe: only reads localStorage, no cascading renders)
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setDrafts(listDrafts());
    setInitialized(true);
  }

  const loadDraft = useCallback((draft: DraftData) => {
    // Load the form data from the draft into the store
    resetPreventivoForm();
    setPreventivoForm({
      tecnicoId: draft.form.tecnicoId,
      tecnicoName: draft.form.tecnicoName,
      fecha: draft.form.fecha,
      centroId: draft.form.centroId,
      estado: draft.form.estado,
      latitud: draft.form.latitud,
      longitud: draft.form.longitud,
    });
    // Restore all dynamic fields
    for (const [key, value] of Object.entries(draft.form.fields)) {
      setPreventivoField(key, value);
    }
  }, [resetPreventivoForm, setPreventivoForm, setPreventivoField]);

  const removeDraft = useCallback((draftId: string) => {
    deleteDraft(draftId);
    refreshDrafts();
  }, [refreshDrafts]);

  const checkForExistingDraft = useCallback((form: PreventivoFormData): DraftData | null => {
    return loadCurrentDraft(form);
  }, []);

  return { drafts, refreshDrafts, loadDraft, removeDraft, checkForExistingDraft };
}

// ============================================================
// OFFLINE SYNC HOOK
// ============================================================

export function useOfflineSync() {
  const online = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingSubmissions().length);
  }, []);

  // Initialize pending count on mount
  const [countInitialized, setCountInitialized] = useState(false);
  if (!countInitialized) {
    setPendingCount(getPendingSubmissions().length);
    setCountInitialized(true);
  }

  const syncPendingSubmissions = useCallback(async () => {
    const submissions = getPendingSubmissions();
    if (submissions.length === 0) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: submissions.length });
    setLastSyncError(null);

    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      setSyncProgress({ current: i + 1, total: submissions.length });

      try {
        // Step 1: Upload any pending photos first
        for (const photo of sub.pendingPhotos) {
          try {
            // Convert base64 to blob for upload
            const byteString = atob(photo.base64.split(',')[1] || photo.base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let j = 0; j < byteString.length; j++) {
              ia[j] = byteString.charCodeAt(j);
            }
            const blob = new Blob([ab], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', blob, `${photo.fieldLabel}.jpg`);
            formData.append('year', photo.year);
            formData.append('provincia', photo.provincia);
            formData.append('centroNombre', photo.centroNombre);
            formData.append('centroCodigo', photo.centroCodigo);
            formData.append('fieldLabel', photo.fieldLabel);
            formData.append('fieldKey', photo.fieldKey);

            const uploadRes = await fetch('/api/fotos-preventivo/upload', {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              // Update the form field with the server path (working on a copy)
              if (!sub.form.fields) sub.form.fields = {};
              sub.form.fields[photo.fieldKey] = uploadData.apiPath;
            }
          } catch (photoErr) {
            console.error('Error uploading pending photo:', photoErr);
            // Continue with submission even if photo upload fails
          }
        }

        // Step 2: Submit the form
        const res = await fetch('/api/preventivos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sub.form,
            estado: sub.estado,
          }),
        });

        if (res.ok) {
          // Success — remove from queue
          removePendingSubmission(sub.id);
        } else if (res.status === 409) {
          // Duplicate — remove from queue, can't retry
          removePendingSubmission(sub.id);
          setLastSyncError(`Preventivo duplicado para centro ${sub.form.centroId}`);
        } else {
          // Server error — increment retry count
          const data = await res.json().catch(() => ({}));
          updatePendingSubmission(sub.id, {
            retryCount: sub.retryCount + 1,
            lastError: data.error || `Error ${res.status}`,
          });

          // Give up after 5 retries
          if (sub.retryCount >= 5) {
            removePendingSubmission(sub.id);
            setLastSyncError(`Descartado tras 5 intentos: ${sub.form.centroId}`);
          }
        }
      } catch (err) {
        // Network error — will retry on next online event
        updatePendingSubmission(sub.id, {
          retryCount: sub.retryCount + 1,
          lastError: err instanceof Error ? err.message : 'Error de red',
        });
        break; // Stop syncing — we're offline again
      }
    }

    setIsSyncing(false);
    refreshPendingCount();
  }, [refreshPendingCount]);

  const submitOffline = useCallback((
    form: PreventivoFormData,
    estado: string,
    pendingPhotos: PendingPhoto[] = []
  ) => {
    // Save to pending queue instead of sending to server
    queuePendingSubmission(form, estado, pendingPhotos);
    refreshPendingCount();
  }, [refreshPendingCount]);

  const getStats = useCallback(() => getStorageStats(), []);

  return {
    online,
    isSyncing,
    syncProgress,
    pendingCount,
    lastSyncError,
    syncPendingSubmissions,
    submitOffline,
    refreshPendingCount,
    getStats,
  };
}
