import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { sanitizeFormData } from '@/lib/sanitize';
import { logActivity } from '@/lib/logger';

// Base directory for storing preventivo photos
const PHOTOS_BASE_DIR = path.join(process.cwd(), 'fotografias preventivos atw');

/**
 * Check if a value looks like a file path (vs raw base64 data)
 */
function isFilePath(value: string): boolean {
  // Base64 data URIs start with "data:"
  if (value.startsWith('data:')) return false;
  // Raw base64 strings are typically very long and contain only base64 chars
  // File paths are shorter and contain directory separators or year/provincia structure
  if (value.length < 500 && (/\//.test(value) || /\\/.test(value) || /^\d{4}/.test(value))) return true;
  // If it's short and doesn't look like base64, treat as path
  if (value.length < 500 && !/^[A-Za-z0-9+/=]+$/.test(value)) return true;
  return false;
}

/**
 * Sanitize folder and file names: remove/replace problematic characters
 */
function sanitizeName(str: string): string {
  return str
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .trim()
    .substring(0, 100);            // Limit length
}

// GET /api/preventivos - Listar preventivos con filtros avanzados y datos cruzados
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tecnicoId = searchParams.get('tecnicoId');
    const centroId = searchParams.get('centroId');
    const empresaId = searchParams.get('empresaId');
    const subEmpresaId = searchParams.get('subEmpresaId');
    const procedimiento = searchParams.get('procedimiento');
    const provincia = searchParams.get('provincia');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tecnicoId) where.tecnicoId = tecnicoId;
    if (centroId) where.centroId = centroId;
    if (procedimiento) where.procedimiento = procedimiento;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde);
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta);
    }
    // Filtrar por empresa y/o provincia a través del centro
    if (empresaId || subEmpresaId || provincia) {
      where.centro = {};
      if (empresaId) (where.centro as Record<string, unknown>).empresaId = empresaId;
      if (subEmpresaId) (where.centro as Record<string, unknown>).subEmpresaId = subEmpresaId;
      if (provincia) (where.centro as Record<string, unknown>).provincia = provincia;
    }

    // Pagination params
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(200, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
    const skip = (page - 1) * limit;

    const [preventivos, total] = await Promise.all([
      db.preventivo.findMany({
        where,
        skip,
        take: limit,
        include: {
          tecnico: { select: { id: true, name: true, username: true, role: true } },
          centro: {
            select: {
              id: true, codigo: true, nombre: true, ciudad: true, provincia: true,
              empresa: { select: { id: true, nombre: true } },
              subEmpresa: { select: { id: true, nombre: true } },
            },
          },
          fotos: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.preventivo.count({ where }),
    ]);

    // Deserializar formData de JSON a objeto para cada preventivo
    const result = preventivos.map((p) => {
      // Convert to plain object and parse formData
      const obj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(p)) {
        if (key === 'formData' && typeof value === 'string') {
          try {
            obj[key] = JSON.parse(value);
          } catch {
            obj[key] = value;
          }
        } else if (key === 'fotos' && Array.isArray(value)) {
          // Transform foto paths to API URLs, keep base64 as-is
          obj[key] = value.map((foto: Record<string, unknown>) => {
            const fotoBase64 = foto.fotoBase64 as string;
            if (fotoBase64 && isFilePath(fotoBase64)) {
              return {
                ...foto,
                fotoBase64: `/api/fotos-preventivo/file?path=${encodeURIComponent(fotoBase64)}`,
                fotoFilePath: fotoBase64, // Also expose the raw path for reference
              };
            }
            return foto;
          });
        } else {
          obj[key] = value;
        }
      }
      return obj;
    });

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      preventivos: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching preventivos:', error);
    return NextResponse.json({ error: 'Error al obtener preventivos' }, { status: 500 });
  }
}

// POST /api/preventivos - Crear nuevo preventivo
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      procedimiento, fecha, tipoSuministro,
      contadorVistaGeneral, contadorCaja, contadorFusibles,
      parcelaEdificio, observaciones, latitud, longitud,
      estado, tecnicoId, centroId, fotosAdicionales,
      fields, // Record<string, string> con todos los campos del formulario
    } = body;

    if (!procedimiento || !tecnicoId || !centroId || !fecha) {
      return NextResponse.json({ error: 'Faltan campos requeridos (procedimiento, tecnicoId, centroId, fecha)' }, { status: 400 });
    }

    // Check for duplicate: same centro + same year
    const fechaDate = new Date(fecha);
    const year = fechaDate.getFullYear();
    const fechaInicio = new Date(year, 0, 1);
    const fechaFin = new Date(year, 11, 31, 23, 59, 59, 999);

    // Resolve centroId: the frontend sends the centro codigo, but the DB uses cuid
    let resolvedCentroId = centroId;
    const centroByCodigo = await db.centro.findUnique({ where: { codigo: centroId } });
    if (centroByCodigo) {
      resolvedCentroId = centroByCodigo.id;
    }

    // Fetch full centro data for file path generation
    const centroData = await db.centro.findUnique({ where: { id: resolvedCentroId } });
    if (!centroData) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });
    }

    const existingPreventivo = await db.preventivo.findFirst({
      where: {
        centroId: resolvedCentroId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    });

    if (existingPreventivo) {
      return NextResponse.json(
        { error: `Ya existe un preventivo para este centro en el año ${year}. Contacte con el administrador.` },
        { status: 409 }
      );
    }

    // Sanitize and serialize fields to JSON string for safe storage
    const sanitizedFields = fields ? sanitizeFormData(fields) : null;
    const formDataJson = sanitizedFields ? JSON.stringify(sanitizedFields) : null;

    // Process fotosAdicionales: save base64 images to filesystem, store only relative paths
    let processedFotos: { fotoBase64: string; descripcion: string | null; categoria: string | null }[] | undefined;
    if (fotosAdicionales && fotosAdicionales.length > 0) {
      const yearStr = String(fechaDate.getFullYear());
      const safeProvincia = sanitizeName(centroData.provincia || 'SinProvincia');
      const safeCentroNombre = sanitizeName(centroData.nombre);
      const safeCentroCodigo = sanitizeName(centroData.codigo);
      const centroFolder = `${safeCentroNombre} - ${safeCentroCodigo}`;

      processedFotos = [];
      for (let i = 0; i < fotosAdicionales.length; i++) {
        const f = fotosAdicionales[i] as { fotoBase64: string; descripcion?: string; categoria?: string };
        let storedValue = f.fotoBase64;

        // Only save to filesystem if it looks like base64 data
        if (f.fotoBase64 && !isFilePath(f.fotoBase64)) {
          try {
            // Parse base64 data (strip data URI prefix if present)
            let base64Data = f.fotoBase64;
            const base64Match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
            if (base64Match) {
              base64Data = base64Match[1];
            }

            // Build filename using categoria or 'adicional'
            const fieldLabel = sanitizeName(f.categoria || 'adicional');
            const fileName = `${fieldLabel}_${i + 1}.jpg`;

            // Build folder path: fotografias preventivos atw / {year} / {provincia} / {centroNombre} - {centroCodigo}
            const folderPath = path.join(PHOTOS_BASE_DIR, yearStr, safeProvincia, centroFolder);

            // Create directories if they don't exist
            if (!existsSync(folderPath)) {
              await mkdir(folderPath, { recursive: true });
            }

            // Write the file
            const filePath = path.join(folderPath, fileName);
            const buffer = Buffer.from(base64Data, 'base64');
            await writeFile(filePath, buffer);

            // Store the relative path
            storedValue = path.join(yearStr, safeProvincia, centroFolder, fileName);
          } catch (fileError) {
            console.error('Error saving photo to filesystem, falling back to base64 storage:', fileError);
            // Fall back to storing base64 if file save fails
            storedValue = f.fotoBase64;
          }
        }

        processedFotos.push({
          fotoBase64: storedValue,
          descripcion: f.descripcion || null,
          categoria: f.categoria || null,
        });
      }
    }

    const preventivo = await db.preventivo.create({
      data: {
        procedimiento,
        fecha: new Date(fecha),
        tipoSuministro: tipoSuministro || null,
        contadorVistaGeneral: contadorVistaGeneral || null,
        contadorCaja: contadorCaja || null,
        contadorFusibles: contadorFusibles || null,
        parcelaEdificio: parcelaEdificio || null,
        observaciones: observaciones || null,
        latitud: latitud || null,
        longitud: longitud || null,
        estado: estado || 'pendiente',
        tecnicoId,
        centroId: resolvedCentroId,
        formData: formDataJson,
        fotos: processedFotos
          ? {
              create: processedFotos,
            }
          : undefined,
      },
      include: {
        tecnico: { select: { id: true, name: true, username: true } },
        centro: {
          select: {
            id: true, codigo: true, nombre: true,
            empresa: { select: { id: true, nombre: true } },
            subEmpresa: { select: { id: true, nombre: true } },
          },
        },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta and transform foto paths to API URLs
    const result: Record<string, unknown> = { ...preventivo };
    if (result.formData && typeof result.formData === 'string') {
      try {
        result.formData = JSON.parse(result.formData as string);
      } catch {
        // Si falla, dejar como string
      }
    }
    // Transform foto file paths to API URLs in the response
    if (Array.isArray(result.fotos)) {
      result.fotos = (result.fotos as Record<string, unknown>[]).map((foto) => {
        const fotoBase64 = foto.fotoBase64 as string;
        if (fotoBase64 && isFilePath(fotoBase64)) {
          return {
            ...foto,
            fotoBase64: `/api/fotos-preventivo/file?path=${encodeURIComponent(fotoBase64)}`,
            fotoFilePath: fotoBase64,
          };
        }
        return foto;
      });
    }

    await logActivity('create', 'preventivo', authUser, request, {
      entity: 'preventivo',
      entityId: preventivo.id,
      entityName: preventivo.procedimiento,
      description: `Preventivo creado: ${preventivo.procedimiento}`,
    });

    return NextResponse.json({
      preventivo: result,
      message: 'Preventivo guardado exitosamente',
    });
  } catch (error) {
    console.error('Error saving preventivo:', error);
    await logActivity('create', 'preventivo', authUser, request, {
      entity: 'preventivo',
      description: 'Error al guardar el preventivo',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al guardar el preventivo' }, { status: 500 });
  }
}

// PUT /api/preventivos - Actualizar preventivo
const PREVENTIVO_ALLOWED_FIELDS = [
  'procedimiento', 'fecha', 'tipoSuministro', 'contadorVistaGeneral', 'contadorCaja',
  'contadorFusibles', 'parcelaEdificio', 'observaciones', 'latitud', 'longitud', 'estado',
  'tecnicoId', 'centroId', 'formData',
];

export async function PUT(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, fields, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del preventivo es requerido' }, { status: 400 });
    }

    // Build update data from whitelisted fields only (Mass Assignment fix)
    const updateData: Record<string, unknown> = {};
    for (const field of PREVENTIVO_ALLOWED_FIELDS) {
      if (rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    if (updateData.fecha) updateData.fecha = new Date(updateData.fecha as string);

    // Sanitize and serialize fields if provided in the body
    if (fields) {
      const sanitizedFields = sanitizeFormData(fields);
      updateData.formData = JSON.stringify(sanitizedFields);
    }

    const preventivo = await db.preventivo.update({
      where: { id },
      data: updateData,
      include: {
        tecnico: { select: { id: true, name: true, username: true } },
        centro: { select: { id: true, codigo: true, nombre: true } },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta and transform foto paths to API URLs
    const result: Record<string, unknown> = { ...preventivo };
    if (result.formData && typeof result.formData === 'string') {
      try {
        result.formData = JSON.parse(result.formData as string);
      } catch {
        // Si falla, dejar como string
      }
    }
    // Transform foto file paths to API URLs in the response
    if (Array.isArray(result.fotos)) {
      result.fotos = (result.fotos as Record<string, unknown>[]).map((foto) => {
        const fotoBase64 = foto.fotoBase64 as string;
        if (fotoBase64 && isFilePath(fotoBase64)) {
          return {
            ...foto,
            fotoBase64: `/api/fotos-preventivo/file?path=${encodeURIComponent(fotoBase64)}`,
            fotoFilePath: fotoBase64,
          };
        }
        return foto;
      });
    }

    await logActivity('update', 'preventivo', authUser, request, {
      entity: 'preventivo',
      entityId: preventivo.id,
      entityName: preventivo.procedimiento,
      description: `Preventivo actualizado: ${preventivo.procedimiento}`,
    });

    return NextResponse.json({ preventivo: result, message: 'Preventivo actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating preventivo:', error);
    await logActivity('update', 'preventivo', authUser, request, {
      entity: 'preventivo',
      entityId: id,
      description: 'Error al actualizar el preventivo',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al actualizar el preventivo' }, { status: 500 });
  }
}

// DELETE /api/preventivos - Eliminar preventivo (solo admin)
export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del preventivo es requerido' }, { status: 400 });
    }

    // Delete associated photos first
    await db.fotoPreventivo.deleteMany({ where: { preventivoId: id } });

    // Delete the preventivo
    await db.preventivo.delete({ where: { id } });

    await logActivity('delete', 'preventivo', authUser, request, {
      entity: 'preventivo',
      entityId: id,
      description: 'Preventivo eliminado',
    });

    return NextResponse.json({ message: 'Preventivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting preventivo:', error);
    await logActivity('delete', 'preventivo', authUser, request, {
      entity: 'preventivo',
      entityId: id,
      description: 'Error al eliminar el preventivo',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al eliminar el preventivo' }, { status: 500 });
  }
}
