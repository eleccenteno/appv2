import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Base directory for storing preventivo photos
const PHOTOS_BASE_DIR = path.join(process.cwd(), 'fotografias preventivos atw');

/**
 * GET /api/fotos-preventivo/file?path=...
 * 
 * Serve a photo file from the filesystem.
 * The path parameter should be the relative path within the photos directory.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json({ error: 'Path es requerido' }, { status: 400 });
    }

    // Security: prevent path traversal attacks
    const sanitizedPath = relativePath.replace(/\.\./g, '').replace(/\\/g, '');
    const filePath = path.join(PHOTOS_BASE_DIR, sanitizedPath);

    // Ensure the resolved path is within our base directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(PHOTOS_BASE_DIR);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 });
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' 
      : ext === '.webp' ? 'image/webp' 
      : 'image/jpeg'; // default to jpeg

    // Return the image with caching headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving photo:', error);
    return NextResponse.json({ error: 'Error al obtener la fotografía' }, { status: 500 });
  }
}
