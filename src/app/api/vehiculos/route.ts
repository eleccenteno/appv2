import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/vehiculos - Listar vehículos con filtros y datos cruzados
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const matricula = searchParams.get('matricula');
    const activo = searchParams.get('activo');

    const where: Record<string, unknown> = {};
    if (empresaId) where.empresaId = empresaId;
    if (matricula) where.matricula = { contains: matricula };
    if (activo !== null && activo !== undefined) where.activo = activo === 'true';

    const vehiculos = await db.vehiculo.findMany({
      where,
      include: {
        empresa: { select: { id: true, nombre: true } },
        asignaciones: {
          where: { activa: true },
          include: { empleado: { select: { id: true, name: true } } },
          take: 1,
        },
        _count: { select: { mantenimientos: true } },
      },
      orderBy: { marca: 'asc' },
    });

    return NextResponse.json({ vehiculos });
  } catch (error) {
    console.error('Error fetching vehiculos:', error);
    return NextResponse.json({ error: 'Error al obtener vehículos' }, { status: 500 });
  }
}

// POST /api/vehiculos - Crear nuevo vehículo
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { marca, modelo, matricula, anio, color, kilometraje, observaciones, empresaId } = body;

    if (!marca || !modelo || !matricula || !empresaId) {
      return NextResponse.json({ error: 'Marca, modelo, matrícula y empresaId son requeridos' }, { status: 400 });
    }

    const vehiculo = await db.vehiculo.create({
      data: {
        marca, modelo, matricula,
        anio: anio || null,
        color: color || null,
        kilometraje: kilometraje || null,
        observaciones: observaciones || null,
        empresaId,
      },
      include: { empresa: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ vehiculo, message: 'Vehículo creado exitosamente' }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un vehículo con esa matrícula' }, { status: 409 });
    }
    console.error('Error creating vehiculo:', error);
    return NextResponse.json({ error: 'Error al crear el vehículo' }, { status: 500 });
  }
}

// PUT /api/vehiculos - Actualizar vehículo
const VEHICULO_ALLOWED_FIELDS = [
  'marca', 'modelo', 'matricula', 'anio', 'color', 'kilometraje', 'observaciones', 'activo', 'empresaId',
];

export async function PUT(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del vehículo es requerido' }, { status: 400 });
    }

    // Build update data from whitelisted fields only (Mass Assignment fix)
    const updateData: Record<string, unknown> = {};
    for (const field of VEHICULO_ALLOWED_FIELDS) {
      if (rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    const vehiculo = await db.vehiculo.update({
      where: { id },
      data: updateData,
      include: { empresa: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ vehiculo, message: 'Vehículo actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating vehiculo:', error);
    return NextResponse.json({ error: 'Error al actualizar el vehículo' }, { status: 500 });
  }
}
