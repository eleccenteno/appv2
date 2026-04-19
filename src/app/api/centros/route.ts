import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/centros - Listar centros con filtros avanzados y consultas cruzadas
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const subEmpresaId = searchParams.get('subEmpresaId');
    const ciudad = searchParams.get('ciudad');
    const provincia = searchParams.get('provincia');
    const tipoSuministro = searchParams.get('tipoSuministro');
    const codigo = searchParams.get('codigo');
    const buscar = searchParams.get('q');
    const includeStats = searchParams.get('stats') === 'true';

    const where: Record<string, unknown> = { activo: true };
    if (empresaId) where.empresaId = empresaId;
    if (subEmpresaId) where.subEmpresaId = subEmpresaId;
    if (ciudad) where.ciudad = ciudad;
    if (provincia) where.provincia = provincia;
    if (tipoSuministro) where.tipoSuministro = tipoSuministro;
    if (codigo) where.codigo = codigo;
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar } },
        { codigo: { contains: buscar } },
        { ciudad: { contains: buscar } },
        { direccion: { contains: buscar } },
      ];
    }

    // Pagination params
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(200, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
    const skip = (page - 1) * limit;

    const [centros, total] = await Promise.all([
      db.centro.findMany({
        where,
        skip,
        take: limit,
        include: {
          empresa: { select: { id: true, nombre: true, slug: true } },
          subEmpresa: { select: { id: true, nombre: true, slug: true } },
          _count: {
            select: { preventivos: true, tareas: true },
          },
          ...(includeStats
            ? {
                preventivos: {
                  where: { estado: 'pendiente' },
                  select: { id: true },
                  take: 1,
                },
                tareas: {
                  where: { estado: 'pendiente' },
                  select: { id: true },
                  take: 1,
                },
              }
            : {}),
        },
        orderBy: { nombre: 'asc' },
      }),
      db.centro.count({ where }),
    ]);

    // Obtener ciudades y provincias únicas para filtros
    const ciudades = await db.centro.findMany({
      where: { activo: true },
      select: { ciudad: true },
      distinct: ['ciudad'],
      orderBy: { ciudad: 'asc' },
    });

    const provincias = await db.centro.findMany({
      where: { activo: true },
      select: { provincia: true },
      distinct: ['provincia'],
      orderBy: { provincia: 'asc' },
    });

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      centros,
      filtros: {
        ciudades: ciudades.map(c => c.ciudad).filter(Boolean),
        provincias: provincias.map(p => p.provincia).filter(Boolean),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching centros:', error);
    return NextResponse.json({ error: 'Error al obtener centros' }, { status: 500 });
  }
}

// POST /api/centros - Crear nuevo centro
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      codigo, nombre, direccion, ciudad, provincia, codigoPostal,
      latitud, longitud, tipoSuministro, parcelaEdificio, observaciones,
      empresaId, subEmpresaId,
    } = body;

    if (!codigo || !nombre || !empresaId) {
      return NextResponse.json({ error: 'Código, nombre y empresaId son requeridos' }, { status: 400 });
    }

    const centro = await db.centro.create({
      data: {
        codigo,
        nombre,
        direccion: direccion || null,
        ciudad: ciudad || null,
        provincia: provincia || null,
        codigoPostal: codigoPostal || null,
        latitud: latitud || null,
        longitud: longitud || null,
        tipoSuministro: tipoSuministro || null,
        parcelaEdificio: parcelaEdificio || null,
        observaciones: observaciones || null,
        empresaId,
        subEmpresaId: subEmpresaId || null,
      },
      include: {
        empresa: { select: { id: true, nombre: true } },
        subEmpresa: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ centro, message: 'Centro creado exitosamente' }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un centro con ese código' }, { status: 409 });
    }
    console.error('Error creating centro:', error);
    return NextResponse.json({ error: 'Error al crear el centro' }, { status: 500 });
  }
}

// PUT /api/centros - Actualizar centro
const CENTRO_ALLOWED_FIELDS = [
  'codigo', 'nombre', 'direccion', 'ciudad', 'provincia', 'codigoPostal', 'latitud', 'longitud',
  'tipoSuministro', 'parcelaEdificio', 'observaciones', 'activo', 'empresaId', 'subEmpresaId',
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
      return NextResponse.json({ error: 'ID del centro es requerido' }, { status: 400 });
    }

    // Build update data from whitelisted fields only (Mass Assignment fix)
    const updateData: Record<string, unknown> = {};
    for (const field of CENTRO_ALLOWED_FIELDS) {
      if (rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    const centro = await db.centro.update({
      where: { id },
      data: updateData,
      include: {
        empresa: { select: { id: true, nombre: true } },
        subEmpresa: { select: { id: true, nombre: true } },
      },
    });

    return NextResponse.json({ centro, message: 'Centro actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating centro:', error);
    return NextResponse.json({ error: 'Error al actualizar el centro' }, { status: 500 });
  }
}
