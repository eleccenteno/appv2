# Task 7 - Fix Fotos base64 en SQLite

## Agent: main
## Status: completed

### Summary
Updated `/home/z/my-project/src/app/api/preventivos/route.ts` to save preventivo photos to the filesystem instead of storing base64 data directly in SQLite.

### Key Changes
1. **POST handler**: Base64 photos from `fotosAdicionales` are now decoded and saved to `fotografias preventivos atw / {year} / {provincia} / {centroNombre} - {centroCodigo} / {categoria}_{index}.jpg`. Only the relative path is stored in the `fotoBase64` DB field.
2. **GET handler**: Foto paths are automatically converted to API URLs (`/api/fotos-preventivo/file?path=...`), while old base64 data is returned as-is.
3. **PUT handler**: Same path-to-URL transformation applied to responses.
4. **Backward compatibility**: `isFilePath()` helper distinguishes file paths from raw base64 data.

### Lint
- Passes with no errors.
