import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeFormData } from '@/lib/sanitize';
import { authenticateRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

// GET /api/tareas - Listar tareas con filtros avanzados y datos cruzados
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const prioridad = searchParams.get('prioridad');
    const centroId = searchParams.get('centroId');
    const asignadoA = searchParams.get('asignadoA');
    const empresaId = searchParams.get('empresaId');
    const subEmpresaId = searchParams.get('subEmpresaId');
    const provincia = searchParams.get('provincia');

    const where: Record<string, unknown> = {};
    if (estado) {
      // Normalize estado: accept both display names and DB values
      const estadoMap: Record<string, string> = {
        'Pendiente': 'pendiente',
        'pendiente': 'pendiente',
        'Realizado': 'completada',
        'realizado': 'completada',
        'completada': 'completada',
        'en_progreso': 'en_progreso',
        'En progreso': 'en_progreso',
        'cancelada': 'cancelada',
        'Cancelada': 'cancelada',
        'blacklist': 'blacklist',
        'Black List': 'blacklist',
      };
      where.estado = estadoMap[estado] || estado.toLowerCase();
    }
    if (tipo) where.tipo = tipo;
    if (prioridad) where.prioridad = prioridad;
    if (centroId) where.centroId = centroId;
    if (asignadoA) where.asignadoA = asignadoA;
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

    const [tareas, total] = await Promise.all([
      db.tarea.findMany({
        where,
        skip,
        take: limit,
        include: {
          centro: {
            select: {
              id: true, codigo: true, nombre: true, ciudad: true, provincia: true,
              empresa: { select: { id: true, nombre: true } },
              subEmpresa: { select: { id: true, nombre: true } },
            },
          },
          empleado: { select: { id: true, name: true, username: true, role: true } },
          fotos: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
      }),
      db.tarea.count({ where }),
    ]);

    // Deserializar formData de JSON a objeto para cada tarea
    const result = tareas.map((t) => {
      // Materialize all Prisma properties
      const plain = JSON.parse(JSON.stringify(t));
      // Parse formData JSON string into object
      if (plain.formData && typeof plain.formData === 'string') {
        try {
          plain.formData = JSON.parse(plain.formData);
        } catch {
          // leave as string
        }
      }
      return plain;
    });

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      tareas: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching tareas:', error);
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
  }
}

// POST /api/tareas - Crear nueva tarea
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      titulo, descripcion, tipo, prioridad, estado,
      fechaLimite, centroId, asignadoA, fields,
    } = body;

    if (!titulo || !centroId || !asignadoA) {
      return NextResponse.json({ error: 'Título, centroId y asignadoA son requeridos' }, { status: 400 });
    }

    // Resolve centroId: the frontend sends the centro codigo, but the DB uses cuid
    let resolvedCentroId = centroId;
    const centroByCodigo = await db.centro.findUnique({ where: { codigo: centroId } });
    if (centroByCodigo) {
      resolvedCentroId = centroByCodigo.id;
    }

    // Sanitize and serialize fields to JSON string if provided
    const sanitizedFields = fields ? sanitizeFormData(fields) : null;
    const formDataJson = sanitizedFields ? JSON.stringify(sanitizedFields) : null;

    const tarea = await db.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        tipo: tipo || 'correctivo',
        prioridad: prioridad || 'media',
        estado: estado || 'pendiente',
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        centroId: resolvedCentroId,
        asignadoA,
        formData: formDataJson,
      },
      include: {
        centro: { select: { id: true, codigo: true, nombre: true } },
        empleado: { select: { id: true, name: true, username: true } },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta
    const result = { ...tarea };
    if (result.formData && typeof result.formData === 'string') {
      try {
        (result as Record<string, unknown>).formData = JSON.parse(result.formData);
      } catch {
        // Si falla, dejar como string
      }
    }

    await logActivity('create', 'tarea', authUser, request, {
      entity: 'tarea',
      entityId: tarea.id,
      entityName: tarea.titulo,
      description: `Tarea creada: ${tarea.titulo}`,
    });

    return NextResponse.json({ tarea: result, message: 'Tarea creada exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error creating tarea:', error);
    await logActivity('create', 'tarea', authUser, request, {
      entity: 'tarea',
      description: 'Error al crear la tarea',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al crear la tarea' }, { status: 500 });
  }
}

// PUT /api/tareas - Actualizar tarea
const TAREA_ALLOWED_FIELDS = [
  'titulo', 'descripcion', 'tipo', 'prioridad', 'estado', 'fechaLimite', 'fechaInicio',
  'fechaFin', 'centroId', 'asignadoA', 'formData',
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
      return NextResponse.json({ error: 'ID de la tarea es requerido' }, { status: 400 });
    }

    // Build update data from whitelisted fields only (Mass Assignment fix)
    const updateData: Record<string, unknown> = {};
    for (const field of TAREA_ALLOWED_FIELDS) {
      if (rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    // Convertir fechas si vienen en el body
    if (updateData.fechaLimite) updateData.fechaLimite = new Date(updateData.fechaLimite as string);
    if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio as string);
    if (updateData.fechaFin) updateData.fechaFin = new Date(updateData.fechaFin as string);

    // Sanitize and serialize fields if provided in the body
    if (fields) {
      const sanitizedFields = sanitizeFormData(fields);
      updateData.formData = JSON.stringify(sanitizedFields);
    }

    const tarea = await db.tarea.update({
      where: { id },
      data: updateData,
      include: {
        centro: { select: { id: true, codigo: true, nombre: true } },
        empleado: { select: { id: true, name: true, username: true } },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta
    const result = { ...tarea };
    if (result.formData && typeof result.formData === 'string') {
      try {
        (result as Record<string, unknown>).formData = JSON.parse(result.formData);
      } catch {
        // Si falla, dejar como string
      }
    }

    await logActivity('update', 'tarea', authUser, request, {
      entity: 'tarea',
      entityId: tarea.id,
      entityName: tarea.titulo,
      description: `Tarea actualizada: ${tarea.titulo}`,
    });

    return NextResponse.json({ tarea: result, message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating tarea:', error);
    await logActivity('update', 'tarea', authUser, request, {
      entity: 'tarea',
      entityId: id,
      description: 'Error al actualizar la tarea',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al actualizar la tarea' }, { status: 500 });
  }
}

// DELETE /api/tareas - Eliminar tarea (solo admin)
export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de la tarea es requerido' }, { status: 400 });
    }

    // Delete associated photos first
    await db.fotoTarea.deleteMany({ where: { tareaId: id } });

    // Delete the tarea
    await db.tarea.delete({ where: { id } });

    await logActivity('delete', 'tarea', authUser, request, {
      entity: 'tarea',
      entityId: id,
      description: 'Tarea eliminada',
    });

    return NextResponse.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting tarea:', error);
    await logActivity('delete', 'tarea', authUser, request, {
      entity: 'tarea',
      entityId: id,
      description: 'Error al eliminar la tarea',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al eliminar la tarea' }, { status: 500 });
  }
}
