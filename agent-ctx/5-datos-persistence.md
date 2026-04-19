# Task 5: Fix DatosCentrosView fake save — implement real server-side persistence

## Summary
Replaced the fake `setTimeout` save in DatosCentrosView with real server-side persistence using a new `datosJson` column on the Centro model and a dedicated API endpoint.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added `datosJson String?` column to the Centro model (line 61)
- Stores JSON string of `{ [sectionKey]: { [fieldKey]: value } }` for DatosCentros field overrides
- Ran `bun run db:push` to sync database

### 2. New API Endpoint (`src/app/api/centros/datos/route.ts`)
- **PUT /api/centros/datos**: Accepts `{ codigo, edits: [{ sectionKey, fieldKey, value }] }` and merges edits into the centro's `datosJson` field
- Uses `authenticateRequest` for authentication
- Only admins (role check) can update — returns 403 for non-admins
- Merges new fields into existing datosJson (preserves previously saved fields)
- Returns the updated `datosJson` object in the response

### 3. Updated DatosCentrosView (`src/components/DatosCentrosView.tsx`)
- Added `dbOverrides` state to store the parsed `datosJson` from DB
- Added `loadingOverrides` state for loading indicator
- **`handleSelectCentro`**: Now fetches DB overrides via `/api/centros?codigo=XXX` when selecting a centro
- **`getFieldValue`**: Updated priority chain: local edits > DB overrides > static JSON data
- **`handleSave`**: Replaced fake `setTimeout` with real API call to `/api/centros/datos`:
  - Builds edits array from `editedData` state
  - Sends batch PUT request with all edited fields
  - Shows success toast with count of saved fields
  - Shows error toast with descriptive message on failure
  - Clears local edits after successful save
  - Updates `dbOverrides` with saved data
- **`handleBack`**: Clears `dbOverrides` when going back
- Save button now shows edit count and is disabled when no edits exist
- Added loading spinner in tab header when overrides are being fetched

## Architecture
- Static JSON file remains the primary data source (has all centro data)
- DB overrides layer on top of static data for admin-edited fields
- This hybrid approach avoids duplicating all centro data in the DB while enabling persistence
