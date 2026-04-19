import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/preventivos/import - Importar preventivos masivamente desde Excel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preventivos } = body;

    if (!Array.isArray(preventivos) || preventivos.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de preventivos' }, { status: 400 });
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
    const centroByNameMap = new Map<string, string>();
    const centroByCodigoMap = new Map<string, string>();
    for (const c of existingCentros) {
      centroByNameMap.set(c.nombre.toLowerCase().trim(), c.id);
      centroByCodigoMap.set(c.codigo, c.id);
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
      centrosCreated: 0,
      duplicatesSkipped: 0,
    };

    // Technician name mapping (Excel name -> DB name)
    const tecnicoMapping: Record<string, string> = {
      'adrian': 'Adrian',
      'angel': 'Angel',
      'carrillo': 'Carrillo',
      'curro': 'Curro',
      'enrique': 'Enrique',
      'erika': 'Erika',
      'fede': 'Fede',
      'fernando': 'Fernando',
      'fran': 'Fran',
      'gonzalo': 'Gonzalo',
      'ian': 'Ian',
      'jose angel': 'Jose Angel',
      'juan carlos': 'Juan Carlos',
      'lewis': 'Lewish',
      'lewish': 'Lewish',
      'lolo': 'Lolo',
      'miguel': 'Miguel',
      'moises': 'Moises',
      'pedro': 'Pedro',
      'ramses': 'Ramses',
      'toni': 'Toni',
      'valentin': 'Valentin',
    };

    // Process each preventivo
    for (let i = 0; i < preventivos.length; i++) {
      const p = preventivos[i];

      try {
        // ---- Resolve Centro ----
        const centroNombre = (p.nombreCentro || '').trim();
        const centroCodigo = (p.codigoInfo || '').trim();

        let centroId = centroByCodigoMap.get(centroCodigo);

        if (!centroId && centroNombre) {
          centroId = centroByNameMap.get(centroNombre.toLowerCase());
        }

        // Try partial matching
        if (!centroId && centroNombre) {
          for (const [key, id] of centroByNameMap.entries()) {
            if (key.includes(centroNombre.toLowerCase()) || centroNombre.toLowerCase().includes(key)) {
              centroId = id;
              break;
            }
          }
        }

        // Create new centro if not found
        if (!centroId && centroNombre) {
          const provincia = p.provincia === 'BADAJOZ' ? 'Badajoz'
            : p.provincia === 'CACERES' ? 'Cáceres'
            : p.provincia || null;

          // Parse location
          let latitud: number | null = null;
          let longitud: number | null = null;
          if (p.localizacionCentro && typeof p.localizacionCentro === 'string') {
            const parts = p.localizacionCentro.split(',').map((s: string) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              latitud = parts[0];
              longitud = parts[1];
            }
          }

          const generatedCodigo = centroCodigo || `OT-${centroNombre.substring(0, 20).replace(/[^A-Za-z0-9]/g, '-').toUpperCase()}-${i}`;

          try {
            const newCentro = await db.centro.create({
              data: {
                codigo: generatedCodigo,
                nombre: centroNombre,
                provincia,
                latitud,
                longitud,
                tipoSuministro: p.tipoCentro || null,
                empresaId: cellnex.id,
                subEmpresaId: ontower?.id || null,
              },
            });
            centroId = newCentro.id;
            centroByNameMap.set(centroNombre.toLowerCase(), newCentro.id);
            centroByCodigoMap.set(generatedCodigo, newCentro.id);
            results.centrosCreated++;
          } catch (centroErr: unknown) {
            if (centroErr && typeof centroErr === 'object' && 'code' in centroErr && (centroErr as { code: string }).code === 'P2002') {
              // Duplicate codigo - find existing
              const existingCentro = await db.centro.findFirst({
                where: { nombre: centroNombre, empresaId: cellnex.id },
              });
              if (existingCentro) {
                centroId = existingCentro.id;
                centroByNameMap.set(centroNombre.toLowerCase(), existingCentro.id);
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

        // ---- Resolve Technician ----
        const tecnicoNombre = (p.tecnico || '').trim().toLowerCase();
        let tecnicoId = employeeMap.get(tecnicoNombre);

        if (!tecnicoId) {
          const mapped = tecnicoMapping[tecnicoNombre];
          if (mapped) {
            tecnicoId = employeeMap.get(mapped.toLowerCase());
          }
        }

        // Try partial match
        if (!tecnicoId && tecnicoNombre) {
          for (const [key, id] of employeeMap.entries()) {
            if (key.includes(tecnicoNombre) || tecnicoNombre.includes(key)) {
              tecnicoId = id;
              break;
            }
          }
        }

        // Create employee if not found
        if (!tecnicoId && tecnicoNombre) {
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
            tecnicoId = newEmp.id;
            employeeMap.set(tecnicoNombre, newEmp.id);
            employeeMap.set(displayName.toLowerCase(), newEmp.id);
          } catch {
            results.skipped++;
            results.errors.push(`Fila ${i + 2}: No se pudo crear técnico "${p.tecnico}"`);
            continue;
          }
        }

        if (!tecnicoId) {
          results.skipped++;
          results.errors.push(`Fila ${i + 2}: No se encontró técnico "${p.tecnico}"`);
          continue;
        }

        // ---- Check duplicate: same centro + same year ----
        const fechaStr = p.fecha;
        let fechaDate: Date;
        try {
          fechaDate = fechaStr ? new Date(fechaStr) : new Date();
        } catch {
          fechaDate = new Date();
        }

        const year = fechaDate.getFullYear();
        const fechaInicio = new Date(year, 0, 1);
        const fechaFin = new Date(year, 11, 31, 23, 59, 59, 999);

        const existingPreventivo = await db.preventivo.findFirst({
          where: {
            centroId,
            fecha: { gte: fechaInicio, lte: fechaFin },
          },
        });

        if (existingPreventivo) {
          results.duplicatesSkipped++;
          continue; // Skip duplicate
        }

        // ---- Parse lat/long from localizacionCentro ----
        let latitud: number | null = null;
        let longitud: number | null = null;
        if (p.localizacionCentro && typeof p.localizacionCentro === 'string') {
          const parts = p.localizacionCentro.split(',').map((s: string) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            latitud = parts[0];
            longitud = parts[1];
          }
        }

        // ---- Build formData from ALL fields ----
        const formData: Record<string, string> = {};

        // Copy all non-null, non-empty fields from the preventivo data
        for (const [key, value] of Object.entries(p)) {
          if (value !== null && value !== undefined && String(value).trim() !== '') {
            formData[key] = String(value);
          }
        }

        // Normalize key provincia values
        if (formData.provincia) {
          formData.provincia = formData.provincia === 'BADAJOZ' ? 'Badajoz'
            : formData.provincia === 'CACERES' ? 'Cáceres'
            : formData.provincia;
        }

        // Normalize Si/No values for Enum fields
        const siNoFields = [
          'seHaLeidoProcedimientos', 'existeCandadoCancillaCamino', 'disponeCilindroLocken',
          'existeCandadoCancillaRecinto', 'disponeBarraAntivandalica', 'existeCerraduraAcceso',
          'funcionaSensorPuerta', 'disponeEquiposExteriores', 'disponeEquiposInteriores',
          'existenBaterias', 'seHanRetiradoBaterias', 'existenEnlaces',
          'disponeAA', 'correctamenteSellado', 'correctoFuncionamientoAA',
          'tienePararrayos', 'consta5Puntas', 'hayNidosCigueña', 'existeCestaNidos',
          'hayNidosInteriorCesta', 'necesitaDesbroce', 'seHaDesbrozado',
          'sustitucionDescargadores', 'diodoColocado', 'sensorPuertaCuadro',
          'seRealizaLimpieza', 'disponeExtraccion', 'disponeFiltroFC',
          'disponeEquiposSigfox', 'instalacionFotovoltaica',
        ];
        for (const field of siNoFields) {
          if (formData[field]) {
            const val = formData[field].toLowerCase().trim();
            if (val === 'si') formData[field] = 'Sí';
            else if (val === 'no') formData[field] = 'No';
          }
        }

        // Normalize tipoCentro
        if (formData.tipoCentro) {
          const val = formData.tipoCentro.toLowerCase().trim();
          if (val === 'indoor') formData.tipoCentro = 'Indoor';
          else if (val === 'outdoor') formData.tipoCentro = 'Outdoor';
          else if (val === 'shelter') formData.tipoCentro = 'Shelter';
          else if (val === 'rooftop') formData.tipoCentro = 'Rooftop';
        }

        // Normalize prioridad
        if (formData.prioridad) {
          const val = formData.prioridad.toUpperCase().trim();
          if (['P1', 'P2', 'P3', 'P4'].includes(val)) {
            formData.prioridad = val;
          }
        }

        // Normalize estadoBaterias
        if (formData.estadoBaterias) {
          const val = formData.estadoBaterias.toLowerCase().trim();
          if (val === 'correcto' || val === 'buen estado') formData.estadoBaterias = 'Buen estado';
          else if (val === 'deficiente') formData.estadoBaterias = 'Deficiente';
        }

        // Normalize estadoPuertaAcceso
        if (formData.estadoPuertaAcceso) {
          const val = formData.estadoPuertaAcceso.toLowerCase().trim();
          if (val === 'correcto') formData.estadoPuertaAcceso = 'Correcto';
          else if (val === 'deficiente') formData.estadoPuertaAcceso = 'Deficiente';
        }

        // Normalize estadoCerraduraAcceso
        if (formData.estadoCerraduraAcceso) {
          const val = formData.estadoCerraduraAcceso.toLowerCase().trim();
          if (val === 'correcto') formData.estadoCerraduraAcceso = 'Correcto';
          else if (val === 'deficiente') formData.estadoCerraduraAcceso = 'Deficiente';
        }

        // Normalize estadoAcometida
        if (formData.estadoAcometida) {
          const val = formData.estadoAcometida.toLowerCase().trim();
          if (val === 'correcto') formData.estadoAcometida = 'Correcto';
          else if (val === 'deficiente') formData.estadoAcometida = 'Deficiente';
        }

        // Normalize estadoGeneralVallado
        if (formData.estadoGeneralVallado) {
          const val = formData.estadoGeneralVallado.toLowerCase().trim();
          if (val === 'correcto') formData.estadoGeneralVallado = 'Correcto';
          else if (val.includes('deficiente')) formData.estadoGeneralVallado = 'Deficiente - Parcial';
        }

        // Normalize accesoRestringido
        if (formData.accesoRestringido) {
          const val = formData.accesoRestringido.toLowerCase().trim();
          if (val === 'si' || val === 'sí') formData.accesoRestringido = 'Sí';
          else if (val === 'no') formData.accesoRestringido = 'No';
        }

        // Normalize vehiculo4x4
        if (formData.vehiculo4x4) {
          const val = formData.vehiculo4x4.toLowerCase().trim();
          if (val === 'si' || val === 'sí') formData.vehiculo4x4 = 'Sí';
          else if (val === 'no') formData.vehiculo4x4 = 'No';
        }

        // Normalize reparaValladoPreventivo
        if (formData.reparaValladoPreventivo) {
          const val = formData.reparaValladoPreventivo.toLowerCase().trim();
          if (val === 'si' || val === 'sí') formData.reparaValladoPreventivo = 'Sí';
          else if (val === 'no') formData.reparaValladoPreventivo = 'No';
        }

        // Normalize repartoCargasCorrecto
        if (formData.repartoCargasCorrecto) {
          const val = formData.repartoCargasCorrecto.toLowerCase().trim();
          if (val === 'correcto') formData.repartoCargasCorrecto = 'Correcto';
          else if (val === 'deficiente') formData.repartoCargasCorrecto = 'Deficiente';
        }

        // Normalize estadoLineaVida
        if (formData.estadoLineaVida) {
          const val = formData.estadoLineaVida.toLowerCase().trim();
          if (val === 'correcto' || val === 'vigente') formData.estadoLineaVida = 'Vigente';
          else if (val === 'caducada') formData.estadoLineaVida = 'Caducada';
        }

        // Normalize estadoPinturaTorre
        if (formData.estadoPinturaTorre) {
          const val = formData.estadoPinturaTorre.toLowerCase().trim();
          if (val === 'correcto' || val === 'buen estado') formData.estadoPinturaTorre = 'Buen estado';
          else if (val === 'regular') formData.estadoPinturaTorre = 'Regular';
          else if (val.includes('necesita')) formData.estadoPinturaTorre = 'Necesita pintura';
        }

        // Normalize correctoFuncionamientoAA
        if (formData.correctoFuncionamientoAA) {
          const val = formData.correctoFuncionamientoAA.toLowerCase().trim();
          if (val === 'correcto') formData.correctoFuncionamientoAA = 'Correcto';
          else if (val === 'deficiente') formData.correctoFuncionamientoAA = 'Deficiente';
        }

        // Normalize aplicaHerbicida
        if (formData.aplicacionHerbicida) {
          const val = formData.aplicacionHerbicida.toLowerCase().trim();
          if (val === 'si' || val === 'sí') formData.aplicacionHerbicida = 'Sí';
          else if (val === 'no') formData.aplicacionHerbicida = 'No';
        }

        // Normalize chatarraCentro
        if (formData.chatarraCentro) {
          const val = formData.chatarraCentro.toLowerCase().trim();
          if (val === 'si' || val === 'sí') formData.chatarraCentro = 'Sí';
          else if (val === 'no') formData.chatarraCentro = 'No';
        }

        // ---- Determine estado based on formData content ----
        let estado = 'completado';
        if (formData.seHaLeidoProcedimientos === 'No') {
          estado = 'en_progreso';
        }

        // ---- Extract DB-level fields from formData ----
        const procedimiento = `Preventivo ${year} - ${formData.nombreCentro || 'Centro'}`;
        const tipoSuministro = formData.tipoSuministroElectrico || formData.tipoSuministro || null;
        const parcelaEdificio = formData.parcelaEdificio || null;
        const contadorVistaGeneral = formData.contadorVistaGeneral || null;
        const contadorCaja = formData.contadorCaja || null;
        const contadorFusibles = formData.contadorFusibles || null;

        // ---- Create the preventivo ----
        await db.preventivo.create({
          data: {
            procedimiento,
            fecha: fechaDate,
            tipoSuministro,
            contadorVistaGeneral,
            contadorCaja,
            contadorFusibles,
            parcelaEdificio,
            observaciones: formData.observaciones || null,
            latitud,
            longitud,
            estado,
            tecnicoId,
            centroId,
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
      message: `Importación completada: ${results.created} preventivos creados, ${results.duplicatesSkipped} duplicados omitidos, ${results.skipped} errores`,
      results,
    });
  } catch (error) {
    console.error('Error importing preventivos:', error);
    return NextResponse.json({ error: 'Error al importar preventivos' }, { status: 500 });
  }
}
