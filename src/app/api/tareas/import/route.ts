import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/tareas/import - Importar tareas masivamente desde Excel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tareas } = body;

    if (!Array.isArray(tareas) || tareas.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de tareas' }, { status: 400 });
    }

    // Get Cellnex and OnTower IDs
    const cellnex = await db.empresa.findFirst({ where: { slug: 'cellnex' } });
    const ontower = await db.subEmpresa.findFirst({ where: { slug: 'ontower' } });

    if (!cellnex) {
      return NextResponse.json({ error: 'Empresa Cellnex no encontrada' }, { status: 500 });
    }

    // Get all existing employees for mapping
    const employees = await db.employee.findMany({ where: { activo: true } });
    const employeeMap = new Map<string, string>();
    for (const emp of employees) {
      employeeMap.set(emp.name.toLowerCase(), emp.id);
      if (emp.nombreCompleto) {
        employeeMap.set(emp.nombreCompleto.toLowerCase(), emp.id);
      }
    }

    // Get all existing centros for mapping
    const existingCentros = await db.centro.findMany({
      where: { empresaId: cellnex.id },
    });
    const centroMap = new Map<string, string>();
    for (const c of existingCentros) {
      centroMap.set(c.nombre.toLowerCase().trim(), c.id);
      centroMap.set(c.codigo, c.id);
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      centrosCreated: 0,
      empleadosCreated: 0,
    };

    // Technician name mapping (Excel name -> DB name)
    const tecnicoMapping: Record<string, string> = {
      'adrian': 'Adrian',
      'angel': 'Angel',
      'curro': 'Curro',
      'enrique': 'Enrique',
      'erika': 'Erika',
      'fran': 'Fran',
      'jose angel': 'Jose Angel',
      'lewish': 'Lewish',
      'lolo': 'Lolo',
      'miguel': 'Miguel',
      'moises': 'Moises',
      'pedro': 'Pedro',
      'ramses': 'Ramses',
      'toni': 'Toni',
    };

    // Process each tarea
    for (let i = 0; i < tareas.length; i++) {
      const t = tareas[i];

      try {
        // ---- Resolve or create Centro ----
        const centroNombre = (t.nombreCentro || '').trim();
        const centroCodigo = (t.codigoInfo || '').trim();

        let centroId = centroMap.get(centroNombre.toLowerCase());

        if (!centroId && centroNombre) {
          // Create new centro
          const provincia = t.provincia === 'BADAJOZ' ? 'Badajoz'
            : t.provincia === 'CACERES' ? 'Cáceres'
            : t.provincia || null;

          // Parse location
          let latitud: number | null = null;
          let longitud: number | null = null;
          if (t.localizacion && typeof t.localizacion === 'string') {
            const parts = t.localizacion.split(',').map((s: string) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              latitud = parts[0];
              longitud = parts[1];
            }
          }

          // Generate unique codigo
          const generatedCodigo = centroCodigo || `OT-${centroNombre.substring(0, 20).replace(/[^A-Za-z0-9]/g, '-').toUpperCase()}-${i}`;

          try {
            const newCentro = await db.centro.create({
              data: {
                codigo: generatedCodigo,
                nombre: centroNombre,
                provincia,
                latitud,
                longitud,
                tipoSuministro: t.tipoCentro || null,
                empresaId: cellnex.id,
                subEmpresaId: ontower?.id || null,
              },
            });
            centroId = newCentro.id;
            centroMap.set(centroNombre.toLowerCase(), newCentro.id);
            results.centrosCreated++;
          } catch (centroErr: unknown) {
            if (centroErr && typeof centroErr === 'object' && 'code' in centroErr && (centroErr as { code: string }).code === 'P2002') {
              // Duplicate codigo - find existing by nombre
              const existingCentro = await db.centro.findFirst({
                where: { nombre: centroNombre, empresaId: cellnex.id },
              });
              if (existingCentro) {
                centroId = existingCentro.id;
                centroMap.set(centroNombre.toLowerCase(), existingCentro.id);
              } else {
                // Try with a truly unique codigo
                const uniqueCodigo = `${generatedCodigo}-${Date.now()}`;
                const newCentro = await db.centro.create({
                  data: {
                    codigo: uniqueCodigo,
                    nombre: centroNombre,
                    provincia,
                    latitud,
                    longitud,
                    tipoSuministro: t.tipoCentro || null,
                    empresaId: cellnex.id,
                    subEmpresaId: ontower?.id || null,
                  },
                });
                centroId = newCentro.id;
                centroMap.set(centroNombre.toLowerCase(), newCentro.id);
                results.centrosCreated++;
              }
            } else {
              throw centroErr;
            }
          }
        }

        if (!centroId) {
          results.skipped++;
          results.errors.push(`Fila ${i + 2}: No se pudo resolver centro "${centroNombre}"`);
          continue;
        }

        // ---- Resolve Technician (asignadoA) ----
        const tecnicoNombre = (t.tecnico || '').trim().toLowerCase();
        let asignadoA = employeeMap.get(tecnicoNombre);

        // Try mapping
        if (!asignadoA) {
          const mapped = tecnicoMapping[tecnicoNombre];
          if (mapped) {
            asignadoA = employeeMap.get(mapped.toLowerCase());
          }
        }

        // Try partial match
        if (!asignadoA && tecnicoNombre) {
          for (const [key, id] of employeeMap.entries()) {
            if (key.includes(tecnicoNombre) || tecnicoNombre.includes(key)) {
              asignadoA = id;
              break;
            }
          }
        }

        // Create employee if not found
        if (!asignadoA && tecnicoNombre) {
          const displayName = tecnicoMapping[tecnicoNombre] || tecnicoNombre.charAt(0).toUpperCase() + tecnicoNombre.slice(1);
          try {
            const newEmp = await db.employee.create({
              data: {
                username: tecnicoNombre.replace(/\s+/g, '_').toLowerCase(),
                password: 'Ecenteno00',
                name: displayName,
                role: 'empleado',
                tipo: 'Empleado',
                activo: true,
              },
            });
            asignadoA = newEmp.id;
            employeeMap.set(tecnicoNombre, newEmp.id);
            employeeMap.set(displayName.toLowerCase(), newEmp.id);
            results.empleadosCreated++;
          } catch {
            results.skipped++;
            results.errors.push(`Fila ${i + 2}: No se pudo crear técnico "${t.tecnico}"`);
            continue;
          }
        }

        if (!asignadoA) {
          results.skipped++;
          results.errors.push(`Fila ${i + 2}: No se encontró técnico "${t.tecnico}"`);
          continue;
        }

        // ---- Build formData ----
        const formData: Record<string, string> = {};

        if (t.rowNumber) formData.rowNumber = String(t.rowNumber);
        if (t.nombreCentro) formData.nombreCentro = String(t.nombreCentro);
        if (t.codigoInfo) formData.codigoInfo = String(t.codigoInfo);

        // Normalize provincia
        const provincia = t.provincia === 'BADAJOZ' ? 'Badajoz'
          : t.provincia === 'CACERES' ? 'Cáceres'
          : t.provincia || '';
        if (provincia) formData.provincia = provincia;

        if (t.tipoCentro) formData.tipoCentro = String(t.tipoCentro);
        if (t.prioridad) formData.prioridad = String(t.prioridad);
        if (t.proyecto) formData.proyecto = String(t.proyecto);
        if (t.localizacion) formData.localizacion = String(t.localizacion);

        // Normalize estado
        const estado = t.estado === 'Realizado' ? 'Realizado'
          : t.estado === 'Pendiente' ? 'Pendiente'
          : t.estado || 'Pendiente';
        formData.estado = estado;

        // Normalize blackList: 'Si' -> 'Sí'
        const blackList = t.blackList === 'Si' || t.blackList === 'Sí' ? 'Sí' : 'No';
        formData.blackList = blackList;

        if (t.tipoTarea) formData.tipoTarea = String(t.tipoTarea);
        if (t.prioridadTarea) formData.prioridadTarea = String(t.prioridadTarea);

        // Format dates as YYYY-MM-DD
        if (t.fecha) {
          try {
            const d = new Date(t.fecha);
            formData.fecha = d.toISOString().substring(0, 10);
          } catch { /* skip */ }
        }
        if (t.fechaRealizacion) {
          try {
            const d = new Date(t.fechaRealizacion);
            formData.fechaRealizacion = d.toISOString().substring(0, 10);
          } catch { /* skip */ }
        }

        if (t.tecnico) formData.tecnico = String(t.tecnico);
        if (t.trabajoRealizar) formData.trabajoRealizar = String(t.trabajoRealizar);
        if (t.tecnicoRealiza) formData.tecnicoRealiza = String(t.tecnicoRealiza);
        if (t.trabajoRealizado) formData.trabajoRealizado = String(t.trabajoRealizado);

        // Store photo paths as references
        for (let f = 1; f <= 10; f++) {
          const key = `fotografia${f}`;
          if (t[key]) {
            formData[key] = String(t[key]);
          }
        }

        // ---- Map to DB schema values ----
        const dbEstado = estado === 'Realizado' ? 'Realizado' : 'Pendiente';
        const dbTipo = t.tipoTarea || 'correctivo';
        const dbPrioridad = t.prioridadTarea === 'Red' ? 'alta'
          : t.prioridadTarea === 'Yellow' ? 'media'
          : t.prioridadTarea === 'Green' ? 'baja'
          : 'media';

        // Parse dates for DB
        let fechaLimite: Date | null = null;
        if (t.fecha) {
          try { fechaLimite = new Date(t.fecha); } catch { /* skip */ }
        }

        let fechaInicio: Date | null = null;
        if (t.fechaRealizacion) {
          try { fechaInicio = new Date(t.fechaRealizacion); } catch { /* skip */ }
        }

        // ---- Create the tarea ----
        await db.tarea.create({
          data: {
            titulo: t.trabajoRealizar ? String(t.trabajoRealizar).substring(0, 200) : (t.tipoTarea || 'Tarea'),
            descripcion: t.trabajoRealizar ? String(t.trabajoRealizar) : null,
            tipo: dbTipo,
            prioridad: dbPrioridad,
            estado: dbEstado,
            fechaLimite,
            fechaInicio,
            centroId,
            asignadoA,
            formData: JSON.stringify(formData),
          },
        });

        results.created++;
      } catch (err) {
        results.skipped++;
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`Fila ${i + 2}: ${msg}`);
      }
    }

    return NextResponse.json({
      message: `Importación completada: ${results.created} tareas creadas, ${results.skipped} omitidas`,
      results,
    });
  } catch (error) {
    console.error('Error importing tareas:', error);
    return NextResponse.json({ error: 'Error al importar tareas' }, { status: 500 });
  }
}
