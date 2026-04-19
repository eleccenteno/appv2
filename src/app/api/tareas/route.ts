import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tareas - Listar tareas con filtros avanzados y datos cruzados
export async function GET(request: NextRequest) {
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
    if (estado) where.estado = estado;
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

    const tareas = await db.tarea.findMany({
      where,
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
    });

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

    return NextResponse.json({ tareas: result });
  } catch (error) {
    console.error('Error fetching tareas:', error);
    return NextResponse.json({ error: 'Error al obtener tareas' }, { status: 500 });
  }
}

// POST /api/tareas - Crear nueva tarea
export async function POST(request: NextRequest) {
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

    // Serialize fields to JSON string if provided
    const formDataJson = fields ? JSON.stringify(fields) : null;

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

    return NextResponse.json({ tarea: result, message: 'Tarea creada exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error creating tarea:', error);
    return NextResponse.json({ error: 'Error al crear la tarea' }, { status: 500 });
  }
}

// PUT /api/tareas - Actualizar tarea
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fields, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de la tarea es requerido' }, { status: 400 });
    }

    // Convertir fechas si vienen en el body
    if (data.fechaLimite) data.fechaLimite = new Date(data.fechaLimite);
    if (data.fechaInicio) data.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaFin) data.fechaFin = new Date(data.fechaFin);

    // Serializar fields si viene en el body
    if (fields) {
      data.formData = JSON.stringify(fields);
      delete data.fields;
    }

    const tarea = await db.tarea.update({
      where: { id },
      data,
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

    return NextResponse.json({ tarea: result, message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating tarea:', error);
    return NextResponse.json({ error: 'Error al actualizar la tarea' }, { status: 500 });
  }
}

// DELETE /api/tareas - Eliminar tarea (solo admin)
export async function DELETE(request: NextRequest) {
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

    return NextResponse.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting tarea:', error);
    return NextResponse.json({ error: 'Error al eliminar la tarea' }, { status: 500 });
  }
}
