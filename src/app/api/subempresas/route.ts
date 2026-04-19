import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/subempresas - Listar sub-empresas, filtrar por empresaId
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const incluirCentros = searchParams.get('include') === 'centros';

    const where: Record<string, unknown> = { activa: true };
    if (empresaId) where.empresaId = empresaId;

    const subEmpresas = await db.subEmpresa.findMany({
      where,
      include: {
        empresa: { select: { id: true, nombre: true, slug: true } },
        centros: incluirCentros
          ? { where: { activo: true }, select: { id: true, codigo: true, nombre: true } }
          : false,
        _count: { select: { centros: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ subEmpresas });
  } catch (error) {
    console.error('Error fetching subempresas:', error);
    return NextResponse.json({ error: 'Error al obtener sub-empresas' }, { status: 500 });
  }
}

// POST /api/subempresas - Crear nueva sub-empresa
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nombre, slug, descripcion, empresaId } = body;

    if (!nombre || !slug || !empresaId) {
      return NextResponse.json({ error: 'Nombre, slug y empresaId son requeridos' }, { status: 400 });
    }

    const subEmpresa = await db.subEmpresa.create({
      data: { nombre, slug, descripcion, empresaId },
      include: { empresa: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json({ subEmpresa, message: 'Sub-empresa creada exitosamente' }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una sub-empresa con ese slug' }, { status: 409 });
    }
    console.error('Error creating subempresa:', error);
    return NextResponse.json({ error: 'Error al crear la sub-empresa' }, { status: 500 });
  }
}
