import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/estadisticas - Panel de estadísticas cruzadas
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'general';
    const empresaId = searchParams.get('empresaId');
    const subEmpresaId = searchParams.get('subEmpresaId');
    const tecnicoId = searchParams.get('tecnicoId');

    // ============================================================
    // ESTADÍSTICAS GENERALES (Dashboard)
    // ============================================================
    if (tipo === 'general') {
      const [
        totalCentros,
        totalEmpleados,
        totalVehiculos,
        preventivosPendientes,
        preventivosEnProgreso,
        preventivosCompletados,
        preventivosEnviados,
        tareasPendientes,
        tareasEnProgreso,
        tareasCompletadas,
        tareasUrgentes,
        totalEmpresas,
        totalSubEmpresas,
      ] = await Promise.all([
        db.centro.count({ where: { activo: true } }),
        db.employee.count({ where: { activo: true } }),
        db.vehiculo.count({ where: { activo: true } }),
        db.preventivo.count({ where: { estado: 'pendiente' } }),
        db.preventivo.count({ where: { estado: 'en_progreso' } }),
        db.preventivo.count({ where: { estado: 'completado' } }),
        db.preventivo.count({ where: { estado: 'enviado' } }),
        db.tarea.count({ where: { estado: 'pendiente' } }),
        db.tarea.count({ where: { estado: 'en_progreso' } }),
        db.tarea.count({ where: { estado: 'completada' } }),
        db.tarea.count({ where: { prioridad: 'urgente', estado: { notIn: ['completada', 'cancelada'] } } }),
        db.empresa.count({ where: { activa: true } }),
        db.subEmpresa.count({ where: { activa: true } }),
      ]);

      return NextResponse.json({
        general: {
          empresas: totalEmpresas,
          subEmpresas: totalSubEmpresas,
          centros: totalCentros,
          empleados: totalEmpleados,
          vehiculos: totalVehiculos,
        },
        preventivos: {
          pendientes: preventivosPendientes,
          enProgreso: preventivosEnProgreso,
          completados: preventivosCompletados,
          enviados: preventivosEnviados,
          total: preventivosPendientes + preventivosEnProgreso + preventivosCompletados + preventivosEnviados,
        },
        tareas: {
          pendientes: tareasPendientes,
          enProgreso: tareasEnProgreso,
          completadas: tareasCompletadas,
          urgentes: tareasUrgentes,
          total: tareasPendientes + tareasEnProgreso + tareasCompletadas,
        },
      });
    }

    // ============================================================
    // ESTADÍSTICAS POR EMPRESA
    // ============================================================
    if (tipo === 'empresa' && empresaId) {
      const empresa = await db.empresa.findUnique({
        where: { id: empresaId },
        include: {
          subEmpresas: {
            where: { activa: true },
            include: {
              _count: { select: { centros: true } },
            },
          },
          _count: { select: { centros: true, vehiculos: true } },
        },
      });

      const centrosEmpresa = await db.centro.findMany({
        where: { activo: true, empresaId },
        select: { id: true },
      });
      const centroIds = centrosEmpresa.map(c => c.id);

      const [preventivosTotal, preventivosPendientes, tareasTotal, tareasPendientes] = await Promise.all([
        db.preventivo.count({ where: { centroId: { in: centroIds } } }),
        db.preventivo.count({ where: { centroId: { in: centroIds }, estado: 'pendiente' } }),
        db.tarea.count({ where: { centroId: { in: centroIds } } }),
        db.tarea.count({ where: { centroId: { in: centroIds }, estado: 'pendiente' } }),
      ]);

      return NextResponse.json({
        empresa,
        estadisticas: {
          centros: centroIds.length,
          preventivos: { total: preventivosTotal, pendientes: preventivosPendientes },
          tareas: { total: tareasTotal, pendientes: tareasPendientes },
        },
      });
    }

    // ============================================================
    // ESTADÍSTICAS POR SUB-EMPRESA
    // ============================================================
    if (tipo === 'subempresa' && subEmpresaId) {
      const subEmpresa = await db.subEmpresa.findUnique({
        where: { id: subEmpresaId },
        include: {
          empresa: { select: { id: true, nombre: true } },
          centros: {
            where: { activo: true },
            include: {
              _count: { select: { preventivos: true, tareas: true } },
            },
          },
        },
      });

      return NextResponse.json({ subEmpresa });
    }

    // ============================================================
    // ESTADÍSTICAS POR TÉCNICO
    // ============================================================
    if (tipo === 'tecnico' && tecnicoId) {
      const empleado = await db.employee.findUnique({
        where: { id: tecnicoId },
        include: {
          _count: { select: { preventivos: true, tareasAsignadas: true } },
          vehiculosAsignados: {
            where: { activa: true },
            include: {
              vehiculo: { select: { id: true, marca: true, modelo: true, matricula: true } },
            },
            take: 1,
          },
        },
      });

      const [preventivosPorEstado, tareasPorEstado] = await Promise.all([
        db.preventivo.groupBy({
          by: ['estado'],
          where: { tecnicoId },
          _count: { estado: true },
        }),
        db.tarea.groupBy({
          by: ['estado'],
          where: { asignadoA: tecnicoId },
          _count: { estado: true },
        }),
      ]);

      return NextResponse.json({
        empleado,
        preventivosPorEstado,
        tareasPorEstado,
      });
    }

    // ============================================================
    // ESTADÍSTICAS POR CENTRO
    // ============================================================
    if (tipo === 'centro') {
      const centros = await db.centro.findMany({
        where: { activo: true, ...(empresaId ? { empresaId } : {}), ...(subEmpresaId ? { subEmpresaId } : {}) },
        include: {
          empresa: { select: { nombre: true } },
          subEmpresa: { select: { nombre: true } },
          _count: { select: { preventivos: true, tareas: true } },
        },
        orderBy: { nombre: 'asc' },
      });

      return NextResponse.json({ centros });
    }

    // ============================================================
    // RESUMEN DE PREVENTIVOS POR MES
    // ============================================================
    if (tipo === 'preventivos-mensual') {
      const preventivos = await db.preventivo.findMany({
        where: empresaId ? { centro: { empresaId } } : {},
        select: {
          fecha: true,
          estado: true,
          centro: { select: { empresa: { select: { nombre: true } } } },
        },
        orderBy: { fecha: 'desc' },
      });

      // Agrupar por mes
      const porMes: Record<string, { total: number; pendientes: number; completados: number }> = {};
      for (const p of preventivos) {
        const key = p.fecha.toISOString().slice(0, 7); // YYYY-MM
        if (!porMes[key]) porMes[key] = { total: 0, pendientes: 0, completados: 0 };
        porMes[key].total++;
        if (p.estado === 'pendiente' || p.estado === 'en_progreso') porMes[key].pendientes++;
        if (p.estado === 'completado' || p.estado === 'enviado') porMes[key].completados++;
      }

      return NextResponse.json({ preventivosMensual: porMes });
    }

    return NextResponse.json({ error: 'Tipo de estadística no reconocido' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching estadisticas:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
