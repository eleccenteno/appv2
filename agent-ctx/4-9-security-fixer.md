# Task 4, 9 - security-fixer

## Summary
Fixed two security vulnerabilities: Mass Assignment in all PUT routes and missing formData sanitization.

## Changes Made

### New File: `/src/lib/sanitize.ts`
- `sanitizeString()`: Encodes HTML special characters (`<`, `>`, `"`, `'`) to prevent XSS
- `sanitizeFormData()`: Ensures formData is a flat `Record<string, string>`, limits field length to 10000 chars, converts non-string values to strings

### Mass Assignment Fix — All PUT Routes

Each PUT handler now uses an explicit field whitelist pattern instead of `const { id, ...data } = body`:

| Route | Whitelist Constant | Allowed Fields |
|-------|-------------------|----------------|
| `/api/employees` | `EMPLOYEE_ALLOWED_FIELDS` | username, name, nombreCompleto, email, phone, dni, foto, role, tipo, vehiculoMarca, vehiculoModelo, vehiculoMatricula, activo + password (separate) |
| `/api/preventivos` | `PREVENTIVO_ALLOWED_FIELDS` | procedimiento, fecha, tipoSuministro, contadorVistaGeneral, contadorCaja, contadorFusibles, parcelaEdificio, observaciones, latitud, longitud, estado, tecnicoId, centroId, formData |
| `/api/tareas` | `TAREA_ALLOWED_FIELDS` | titulo, descripcion, tipo, prioridad, estado, fechaLimite, fechaInicio, fechaFin, centroId, asignadoA, formData |
| `/api/centros` | `CENTRO_ALLOWED_FIELDS` | codigo, nombre, direccion, ciudad, provincia, codigoPostal, latitud, longitud, tipoSuministro, parcelaEdificio, observaciones, activo, empresaId, subEmpresaId |
| `/api/vehiculos` | `VEHICULO_ALLOWED_FIELDS` | marca, modelo, matricula, anio, color, kilometraje, observaciones, activo, empresaId |

### formData Sanitization

- **POST/PUT `/api/preventivos`**: `fields` → `sanitizeFormData()` → `JSON.stringify()` before storage
- **POST/PUT `/api/tareas`**: Same pattern applied
- **`offline-storage.ts` `saveDraft()`**: Sanitizes `form.fields` via `sanitizeFormData()` before saving to IndexedDB
- **`offline-storage.ts` `queuePendingSubmission()`**: Sanitizes `form.fields` before queuing

## Verification
- `bun run lint` passes with no errors
- Dev server compiles and runs normally
