import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { authenticateRequest } from '@/lib/auth';

// Base directory for storing preventivo photos
const PHOTOS_BASE_DIR = path.join(process.cwd(), 'fotografias preventivos atw');

/**
 * POST /api/fotos-preventivo/upload
 * 
 * Upload a photo for a preventivo form field.
 * Saves to: fotografias preventivos atw / {year} / {province} / {centroName} - {centroCode} / {fieldLabel}.jpg
 * 
 * Form data fields:
 * - file: The image file (compressed JPEG)
 * - year: Year (e.g., "2026")
 * - provincia: Province name (e.g., "Madrid")
 * - centroNombre: Center name
 * - centroCodigo: Center code
 * - fieldLabel: Field label for naming the file
 * - fieldKey: Field key (used as fallback if fieldLabel has issues)
 * - index: Optional index for multiple photos in same field (0-based)
 */
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const year = formData.get('year') as string | null;
    const provincia = formData.get('provincia') as string | null;
    const centroNombre = formData.get('centroNombre') as string | null;
    const centroCodigo = formData.get('centroCodigo') as string | null;
    const fieldLabel = formData.get('fieldLabel') as string | null;
    const fieldKey = formData.get('fieldKey') as string | null;
    const indexStr = formData.get('index') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (!year || !provincia || !centroNombre || !centroCodigo) {
      return NextResponse.json({ error: 'Faltan datos del centro (year, provincia, centroNombre, centroCodigo)' }, { status: 400 });
    }

    // Sanitize folder and file names: remove/replace problematic characters
    const sanitize = (str: string): string => {
      return str
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
        .replace(/\s+/g, ' ')          // Collapse multiple spaces
        .trim()
        .substring(0, 100);            // Limit length
    };

    const safeProvincia = sanitize(provincia);
    const safeCentroNombre = sanitize(centroNombre);
    const safeCentroCodigo = sanitize(centroCodigo);
    const safeFieldLabel = sanitize(fieldLabel || fieldKey || 'foto');

    // Build folder path: fotografias preventivos atw / {year} / {provincia} / {centroNombre} - {centroCodigo}
    const centroFolder = `${safeCentroNombre} - ${safeCentroCodigo}`;
    const folderPath = path.join(PHOTOS_BASE_DIR, year, safeProvincia, centroFolder);

    // Build filename: {fieldLabel}.jpg or {fieldLabel}_{index}.jpg
    const index = indexStr ? parseInt(indexStr, 10) : -1;
    const fileName = index >= 0 
      ? `${safeFieldLabel}_${index + 1}.jpg`
      : `${safeFieldLabel}.jpg`;
    const filePath = path.join(folderPath, fileName);

    // Create directories if they don't exist
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    // Write the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Build the relative path for storage in DB
    const relativePath = path.join(year, safeProvincia, centroFolder, fileName);

    // Also return a URL-accessible path for the API
    const apiPath = `/api/fotos-preventivo/file?path=${encodeURIComponent(relativePath)}`;

    return NextResponse.json({
      success: true,
      path: relativePath,
      apiPath,
      fileName,
      folderPath,
      sizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Error al subir la fotografía' }, { status: 500 });
  }
}

/**
 * DELETE /api/fotos-preventivo/upload
 * Delete a photo by its relative path
 */
export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json({ error: 'Path es requerido' }, { status: 400 });
    }

    // Security: prevent path traversal - use path.resolve for robust validation
    const sanitizedPath = relativePath.replace(/\.\./g, '').replace(/\\/g, '');
    const filePath = path.resolve(PHOTOS_BASE_DIR, sanitizedPath);

    // Ensure the resolved path is within our base directory
    if (!filePath.startsWith(path.resolve(PHOTOS_BASE_DIR))) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 });
    }

    if (existsSync(filePath)) {
      await unlink(filePath);
      return NextResponse.json({ success: true, message: 'Fotografía eliminada' });
    }

    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Error al eliminar la fotografía' }, { status: 500 });
  }
}
