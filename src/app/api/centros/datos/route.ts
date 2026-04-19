import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

interface DatosJsonUpdate {
  codigo: string;
  edits: { sectionKey: string; fieldKey: string; value: string }[];
}

// PUT /api/centros/datos - Save edited fields into centro's datosJson
export async function PUT(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Only admins can update
  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar datos' }, { status: 403 });
  }

  try {
    const body: DatosJsonUpdate = await request.json();
    const { codigo, edits } = body;

    if (!codigo || !edits || !Array.isArray(edits) || edits.length === 0) {
      return NextResponse.json(
        { error: 'codigo y edits (array no vacío) son requeridos' },
        { status: 400 }
      );
    }

    // Find the centro by codigo
    const centro = await db.centro.findUnique({
      where: { codigo },
    });

    if (!centro) {
      return NextResponse.json({ error: 'Centro no encontrado' }, { status: 404 });
    }

    // Parse existing datosJson or start with empty object
    const existingDatos: Record<string, Record<string, string>> = centro.datosJson
      ? JSON.parse(centro.datosJson)
      : {};

    // Merge each edit into the datosJson
    for (const edit of edits) {
      const { sectionKey, fieldKey, value } = edit;
      if (!sectionKey || !fieldKey) continue;

      if (!existingDatos[sectionKey]) {
        existingDatos[sectionKey] = {};
      }
      existingDatos[sectionKey][fieldKey] = value;
    }

    // Save back to DB
    const updatedCentro = await db.centro.update({
      where: { codigo },
      data: { datosJson: JSON.stringify(existingDatos) },
    });

    return NextResponse.json({
      message: 'Datos guardados correctamente',
      datosJson: existingDatos,
    });
  } catch (error) {
    console.error('Error saving centros datos:', error);
    return NextResponse.json({ error: 'Error al guardar los datos' }, { status: 500 });
  }
}
