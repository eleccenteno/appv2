# Task 3 - indexeddb-migrator

## Task
Fix CRITICAL bug: localStorage overflow with base64 photos by migrating to IndexedDB.

## What Was Done

### 1. Rewrote `src/lib/offline-storage.ts`
- Completely replaced localStorage implementation with IndexedDB
- Database: `centeno-offline-db` (version 1) with 4 object stores:
  - `drafts` — keyed by draft ID (tecnicoId_centroId)
  - `pendingSubmissions` — single document `__all_submissions__` containing all submissions
  - `offlinePhotos` — keyed by fieldKey
  - `meta` — small key-value pairs (e.g., lastAutosaveTime)
- Singleton DB connection with automatic reconnection
- All public functions now async (IndexedDB is inherently async)
- Same function names and parameters preserved; return types wrapped in Promise
- `isOnline()` and `formatTimeAgo()` remain synchronous
- Graceful error handling throughout

### 2. Updated `src/hooks/useOfflineSync.ts`
- Converted from synchronous to async storage access patterns
- Used `useEffect` for async initialization (replaces sync useState initializers)
- `checkForExistingDraft` now returns `Promise<DraftData | null>`
- All IDB write operations properly awaited

### 3. Updated `src/components/PreventivosForm.tsx`
- `saveOfflinePhoto(...)` → `await saveOfflinePhoto(...)`
- `checkForExistingDraft(form)` → `checkForExistingDraft(form).then(...)`
- Removed unused imports (`removeOfflinePhoto`, `getOfflinePhotos`)

### 4. Updated `src/components/TareasView.tsx`
- `saveOfflinePhoto(...)` → `await saveOfflinePhoto(...)`

## Verification
- `bun run lint` — zero errors
- Dev server compiles cleanly
