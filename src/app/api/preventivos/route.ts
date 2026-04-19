import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/preventivos - Listar preventivos con filtros avanzados y datos cruzados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tecnicoId = searchParams.get('tecnicoId');
    const centroId = searchParams.get('centroId');
    const empresaId = searchParams.get('empresaId');
    const subEmpresaId = searchParams.get('subEmpresaId');
    const procedimiento = searchParams.get('procedimiento');
    const provincia = searchParams.get('provincia');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tecnicoId) where.tecnicoId = tecnicoId;
    if (centroId) where.centroId = centroId;
    if (procedimiento) where.procedimiento = procedimiento;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = new Date(fechaDesde);
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = new Date(fechaHasta);
    }
    // Filtrar por empresa y/o provincia a través del centro
    if (empresaId || subEmpresaId || provincia) {
      where.centro = {};
      if (empresaId) (where.centro as Record<string, unknown>).empresaId = empresaId;
      if (subEmpresaId) (where.centro as Record<string, unknown>).subEmpresaId = subEmpresaId;
      if (provincia) (where.centro as Record<string, unknown>).provincia = provincia;
    }

    const preventivos = await db.preventivo.findMany({
      where,
      include: {
        tecnico: { select: { id: true, name: true, username: true, role: true } },
        centro: {
          select: {
            id: true, codigo: true, nombre: true, ciudad: true, provincia: true,
            empresa: { select: { id: true, nombre: true } },
            subEmpresa: { select: { id: true, nombre: true } },
          },
        },
        fotos: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deserializar formData de JSON a objeto para cada preventivo
    const result = preventivos.map((p) => {
      // Convert to plain object and parse formData
      const obj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(p)) {
        if (key === 'formData' && typeof value === 'string') {
          try {
            obj[key] = JSON.parse(value);
          } catch {
            obj[key] = value;
          }
        } else {
          obj[key] = value;
        }
      }
      return obj;
    });

    return NextResponse.json({ preventivos: result });
  } catch (error) {
    console.error('Error fetching preventivos:', error);
    return NextResponse.json({ error: 'Error al obtener preventivos' }, { status: 500 });
  }
}

// POST /api/preventivos - Crear nuevo preventivo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      procedimiento, fecha, tipoSuministro,
      contadorVistaGeneral, contadorCaja, contadorFusibles,
      parcelaEdificio, observaciones, latitud, longitud,
      estado, tecnicoId, centroId, fotosAdicionales,
      fields, // Record<string, string> con todos los campos del formulario
    } = body;

    if (!procedimiento || !tecnicoId || !centroId || !fecha) {
      return NextResponse.json({ error: 'Faltan campos requeridos (procedimiento, tecnicoId, centroId, fecha)' }, { status: 400 });
    }

    // Check for duplicate: same centro + same year
    const fechaDate = new Date(fecha);
    const year = fechaDate.getFullYear();
    const fechaInicio = new Date(year, 0, 1);
    const fechaFin = new Date(year, 11, 31, 23, 59, 59, 999);

    // Resolve centroId: the frontend sends the centro codigo, but the DB uses cuid
    let resolvedCentroId = centroId;
    const centroByCodigo = await db.centro.findUnique({ where: { codigo: centroId } });
    if (centroByCodigo) {
      resolvedCentroId = centroByCodigo.id;
    }

    const existingPreventivo = await db.preventivo.findFirst({
      where: {
        centroId: resolvedCentroId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    });

    if (existingPreventivo) {
      return NextResponse.json(
        { error: `Ya existe un preventivo para este centro en el año ${year}. Contacte con el administrador.` },
        { status: 409 }
      );
    }

    // Serializar fields a JSON string para almacenamiento completo
    const formDataJson = fields ? JSON.stringify(fields) : null;

    const preventivo = await db.preventivo.create({
      data: {
        procedimiento,
        fecha: new Date(fecha),
        tipoSuministro: tipoSuministro || null,
        contadorVistaGeneral: contadorVistaGeneral || null,
        contadorCaja: contadorCaja || null,
        contadorFusibles: contadorFusibles || null,
        parcelaEdificio: parcelaEdificio || null,
        observaciones: observaciones || null,
        latitud: latitud || null,
        longitud: longitud || null,
        estado: estado || 'pendiente',
        tecnicoId,
        centroId: resolvedCentroId,
        formData: formDataJson,
        fotos: fotosAdicionales
          ? {
              create: fotosAdicionales.map((f: { fotoBase64: string; descripcion?: string; categoria?: string }) => ({
                fotoBase64: f.fotoBase64,
                descripcion: f.descripcion || null,
                categoria: f.categoria || null,
              })),
            }
          : undefined,
      },
      include: {
        tecnico: { select: { id: true, name: true, username: true } },
        centro: {
          select: {
            id: true, codigo: true, nombre: true,
            empresa: { select: { id: true, nombre: true } },
            subEmpresa: { select: { id: true, nombre: true } },
          },
        },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta
    const result = { ...preventivo };
    if (result.formData && typeof result.formData === 'string') {
      try {
        (result as Record<string, unknown>).formData = JSON.parse(result.formData);
      } catch {
        // Si falla, dejar como string
      }
    }

    return NextResponse.json({
      preventivo: result,
      message: 'Preventivo guardado exitosamente',
    });
  } catch (error) {
    console.error('Error saving preventivo:', error);
    return NextResponse.json({ error: 'Error al guardar el preventivo' }, { status: 500 });
  }
}

// PUT /api/preventivos - Actualizar preventivo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fields, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del preventivo es requerido' }, { status: 400 });
    }

    if (data.fecha) data.fecha = new Date(data.fecha);

    // Serializar fields si viene en el body
    if (fields) {
      data.formData = JSON.stringify(fields);
      delete data.fields;
    }

    const preventivo = await db.preventivo.update({
      where: { id },
      data,
      include: {
        tecnico: { select: { id: true, name: true, username: true } },
        centro: { select: { id: true, codigo: true, nombre: true } },
        fotos: true,
      },
    });

    // Deserializar formData para la respuesta
    const result = { ...preventivo };
    if (result.formData && typeof result.formData === 'string') {
      try {
        (result as Record<string, unknown>).formData = JSON.parse(result.formData);
      } catch {
        // Si falla, dejar como string
      }
    }

    return NextResponse.json({ preventivo: result, message: 'Preventivo actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating preventivo:', error);
    return NextResponse.json({ error: 'Error al actualizar el preventivo' }, { status: 500 });
  }
}

// DELETE /api/preventivos - Eliminar preventivo (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del preventivo es requerido' }, { status: 400 });
    }

    // Delete associated photos first
    await db.fotoPreventivo.deleteMany({ where: { preventivoId: id } });

    // Delete the preventivo
    await db.preventivo.delete({ where: { id } });

    return NextResponse.json({ message: 'Preventivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting preventivo:', error);
    return NextResponse.json({ error: 'Error al eliminar el preventivo' }, { status: 500 });
  }
}
