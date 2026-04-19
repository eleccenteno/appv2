import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/empresas - Listar todas las empresas con sus sub-empresas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const incluirSubEmpresas = searchParams.get('include') === 'subempresas';
    const incluirCentros = searchParams.get('include') === 'centros';

    const empresas = await db.empresa.findMany({
      where: { activa: true },
      include: {
        subEmpresas: incluirSubEmpresas ? { where: { activa: true } } : false,
        centros: incluirCentros
          ? { where: { activo: true }, select: { id: true, codigo: true, nombre: true, ciudad: true } }
          : false,
        _count: {
          select: { subEmpresas: true, centros: true, vehiculos: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ empresas });
  } catch (error) {
    console.error('Error fetching empresas:', error);
    return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  }
}

// POST /api/empresas - Crear nueva empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, slug, descripcion, logo } = body;

    if (!nombre || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
    }

    const empresa = await db.empresa.create({
      data: { nombre, slug, descripcion, logo },
    });

    return NextResponse.json({ empresa, message: 'Empresa creada exitosamente' }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una empresa con ese nombre o slug' }, { status: 409 });
    }
    console.error('Error creating empresa:', error);
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }
}
