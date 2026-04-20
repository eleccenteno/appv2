import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/preventivos/check-duplicate?centroCodigo=88609&year=2026
// Checks if a preventivo already exists for the given centro in the given year
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const centroCodigo = searchParams.get('centroCodigo');
    const year = searchParams.get('year');

    if (!centroCodigo || !year) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (centroCodigo, year)' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: 'El parámetro year debe ser un número válido' },
        { status: 400 }
      );
    }

    // Find the Centro by codigo
    const centro = await db.centro.findUnique({
      where: { codigo: centroCodigo },
      select: { id: true, nombre: true, codigo: true },
    });

    if (!centro) {
      // Centro not in DB — no duplicate possible
      return NextResponse.json({ exists: false });
    }

    // Check for existing preventivos for this centro in the given year
    const fechaInicio = new Date(yearNum, 0, 1);   // Jan 1
    const fechaFin = new Date(yearNum, 11, 31, 23, 59, 59, 999); // Dec 31

    const existingPreventivos = await db.preventivo.findMany({
      where: {
        centroId: centro.id,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        tecnico: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPreventivos.length > 0) {
      const prev = existingPreventivos[0];
      return NextResponse.json({
        exists: true,
        preventivo: {
          id: prev.id,
          fecha: prev.fecha.toISOString().split('T')[0],
          estado: prev.estado,
          tecnico: prev.tecnico?.name || 'Desconocido',
          centro: { nombre: centro.nombre, codigo: centro.codigo },
        },
        totalDuplicates: existingPreventivos.length,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking duplicate preventivo:', error);
    return NextResponse.json(
      { error: 'Error al comprobar duplicados' },
      { status: 500 }
    );
  }
}
