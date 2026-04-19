/**
 * Script para importar datos desde los archivos Excel de Tareas y Preventivos.
 * NO borra datos existentes. Solo añade nuevos.
 * 
 * Uso: bun run prisma/import-excel.ts
 */
import XLSX from 'xlsx';
import { db } from '../src/lib/db';

// ============================================================
// MAPEO DE TÉCNICOS: Nombre Excel -> username en la DB
// ============================================================
const TECNICO_MAP: Record<string, string> = {
  'Toni': 'toni',
  'Curro': 'curro',
  'Erika': 'erika',
  'Moises': 'moises',
  'Miguel': 'miguel_merideno',
  'Paco': 'paco',
  'Fran': 'fran_hernandez',
  'Fede': 'fede',
  'Ian': 'ian_vazquez',
  'Lolo': 'manuel_rivera',
  'Jose Angel': 'joseangel',
  'Enrique': 'pedro_lavado',
  'Pedro': 'pedro_lavado',
  'Ramses': 'ramses',
  'Gonzalo': 'gonzalo',
  'Carrillo': 'centenoblanca2',
  'Juan Carlos': 'juancarlos',
  'Antonio Borrallo': 'antonio_borrallo',
  'Valentin': 'centenoblanca1',
  'Fernando': 'fernandoecenteno',
  'Jose Manuel': 'tramitacion',
  'Mecanico': 'mecanico',
  'Sara': 'sara',
  'Luzma': 'luz',
  'Israel': 'israel',
  'Angel': 'angel_gutierrez',
  'David': 'david_Delgado',
  // Nombres adicionales que pueden aparecer en el Excel
  'Adrian': 'toni',        // Fallback si no existe
  'Lewish': 'curro',       // Fallback si no existe
  'David Delgado': 'david_Delgado',
};

// ============================================================
// MAPEO DE PRIORIDADES
// ============================================================
const PRIORIDAD_MAP: Record<string, string> = {
  'Green': 'baja',
  'Yellow': 'media',
  'Red': 'alta',
};

// ============================================================
// MAPEO DE ESTADOS DE TAREAS
// ============================================================
const ESTADO_TAREA_MAP: Record<string, string> = {
  'Pendiente': 'pendiente',
  'Realizado': 'completada',
  'En progreso': 'en_progreso',
  'Cancelada': 'cancelada',
};

// ============================================================
// Convertir fecha Excel (número de serie) a Date
// ============================================================
function excelDateToDate(serial: number | string): Date | null {
  if (!serial || typeof serial === 'string') return null;
  // Excel epoch is January 1, 1900 (with the 1900 leap year bug)
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  return date;
}

// ============================================================
// Parse coordenadas "lat, lng"
// ============================================================
function parseCoordinates(coord: string): { lat: number; lng: number } | null {
  if (!coord) return null;
  const parts = coord.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('📥 Importando datos desde archivos Excel...\n');

  // Get existing employees map
  const employees = await db.employee.findMany({ select: { id: true, username: true, name: true } });
  const employeeMap = new Map<string, string>(); // username -> id
  for (const emp of employees) {
    employeeMap.set(emp.username, emp.id);
  }

  // Get existing centros
  const existingCentros = await db.centro.findMany({ select: { id: true, codigo: true, nombre: true } });
  const centroMap = new Map<string, string>(); // codigo -> id

  // Also create a map by codigo info (the numeric code from Excel)
  const centroByCodigoInfo = new Map<string, { id: string; nombre: string }>();

  for (const c of existingCentros) {
    centroMap.set(c.codigo, c.id);
  }

  // Get the OnTower subempresa (most centros are OnTower based on the data)
  const ontower = await db.subEmpresa.findFirst({ where: { slug: 'ontower' } });
  const cellnex = await db.empresa.findFirst({ where: { slug: 'cellnex' } });

  if (!ontower || !cellnex) {
    console.error('❌ No se encontraron empresas/subempresas necesarias');
    return;
  }

  // ============================================================
  // 1. IMPORTAR TAREAS
  // ============================================================
  console.log('📋 Procesando Tareas pendientes.xlsx...');
  const wbTareas = XLSX.readFile('upload/Tareas pendientes.xlsx');
  const tareasData = XLSX.utils.sheet_to_json(wbTareas.Sheets['Hoja 1'], { defval: '' });

  let tareasCreated = 0;
  let tareasSkipped = 0;
  let centrosCreated = 0;

  for (const row of tareasData) {
    const nombreCentro = String(row['Nombre del centro'] || '').trim();
    const codigoInfo = String(row['Codigo info'] || '').trim();
    const tecnicoName = String(row['Tecnico'] || '').trim();
    const tipoTarea = String(row['Tipo de tarea'] || '').trim();
    const trabajoRealizar = String(row['Trabajo a realizar '] || '').trim();
    const estado = String(row['Estado'] || '').trim();
    const provincia = String(row['Provincia'] || '').trim();
    const prioridadTarea = String(row['Prioridad tarea'] || '').trim();
    const localizacion = String(row['Localizacion'] || '').trim();
    const proyecto = String(row['Proyecto'] || '').trim();
    const fecha = row['Fecha'];
    const fechaRealizacion = row['Fecha de realizacion'];
    const blacklist = String(row['Black List'] || '').trim();
    const trabajoRealizado = String(row['Trabajo realizado'] || '').trim();
    const tecnicoRealiza = String(row['Tecnico que realiza el trabajo'] || '').trim();

    if (!nombreCentro || !codigoInfo) {
      tareasSkipped++;
      continue;
    }

    // Find or create centro
    let centroId = centroByCodigoInfo.get(codigoInfo)?.id;
    if (!centroId) {
      // Try to find by codigo matching the info code
      const existingCentro = await db.centro.findFirst({
        where: { codigo: codigoInfo },
      });
      if (existingCentro) {
        centroId = existingCentro.id;
        centroByCodigoInfo.set(codigoInfo, { id: existingCentro.id, nombre: existingCentro.nombre });
      } else {
        // Create new centro
        const coords = parseCoordinates(localizacion);
        const newCentro = await db.centro.create({
          data: {
            codigo: codigoInfo,
            nombre: nombreCentro,
            provincia: provincia || null,
            latitud: coords?.lat || null,
            longitud: coords?.lng || null,
            empresaId: cellnex.id,
            subEmpresaId: ontower.id,
            activo: true,
          },
        });
        centroId = newCentro.id;
        centroByCodigoInfo.set(codigoInfo, { id: newCentro.id, nombre: newCentro.nombre });
        centrosCreated++;
      }
    }

    // Find technician
    const techUsername = TECNICO_MAP[tecnicoName];
    const techId = techUsername ? employeeMap.get(techUsername) : null;

    if (!techId) {
      console.log(`  ⚠️  Técnico no encontrado: "${tecnicoName}" para centro "${nombreCentro}" - usando toni como fallback`);
    }

    const asignadoA = techId || employeeMap.get('toni')!;

    // Map estado
    const estadoMap = blacklist === 'Si' ? 'blacklist' : (ESTADO_TAREA_MAP[estado] || 'pendiente');

    // Map prioridad
    const prioridadMap = PRIORIDAD_MAP[prioridadTarea] || 'media';

    // Parse dates
    const fechaDate = excelDateToDate(fecha);
    const fechaRealDate = excelDateToDate(fechaRealizacion);

    // Build formData JSON
    const formData: Record<string, string> = {
      tipoTarea,
      trabajoRealizar,
      trabajoRealizado,
      proyecto,
      provincia,
      tipoCentro: String(row['Tipo centro '] || ''),
      prioridadCentro: String(row['Prioridad'] || ''),
      blacklist,
      tecnicoRealiza,
      codigoInfo,
    };

    // Add photo references
    for (let i = 1; i <= 10; i++) {
      const foto = String(row[`Fotografia ${i}`] || '').trim();
      if (foto) {
        formData[`foto_${i}`] = foto;
      }
    }

    // Determine task type
    let taskType = 'correctivo';
    if (tipoTarea.toLowerCase().includes('preventiv')) taskType = 'preventivo';
    else if (tipoTarea.toLowerCase().includes('instalac')) taskType = 'instalacion';
    else if (tipoTarea.toLowerCase().includes('reparac')) taskType = 'reparacion';
    else if (blacklist === 'Si') taskType = 'blacklist';

    // Create tarea
    await db.tarea.create({
      data: {
        titulo: tipoTarea || 'Tarea sin título',
        descripcion: trabajoRealizar || null,
        tipo: taskType,
        prioridad: prioridadMap,
        estado: estadoMap,
        fechaLimite: fechaDate,
        fechaInicio: fechaRealDate,
        fechaFin: estadoMap === 'completada' ? fechaRealDate : null,
        centroId,
        asignadoA,
        formData: JSON.stringify(formData),
      },
    });
    tareasCreated++;
  }

  console.log(`  ✅ Tareas creadas: ${tareasCreated}, omitidas: ${tareasSkipped}`);
  console.log(`  📍 Nuevos centros creados: ${centrosCreated}`);

  // ============================================================
  // 2. IMPORTAR PREVENTIVOS
  // ============================================================
  console.log('\n📋 Procesando preventivos 2026.xlsx...');
  const wbPrev = XLSX.readFile('upload/preventivos 2026.xlsx');
  const prevData = XLSX.utils.sheet_to_json(wbPrev.Sheets['Hoja 1'], { defval: '' });

  let prevCreated = 0;
  let prevSkipped = 0;
  let prevCentrosCreated = 0;

  // Columns that are metadata (not form fields)
  const METADATA_COLS = new Set([
    'Titulo General', 'Nombre del centro', 'Localizacion centro', 'Codigo info',
    'Provincia', 'Tipo centro', 'Prioridad', 'Proyecto', 'CUPS', 'Comercializadora',
    'Tecnico', 'Fecha', '__EMPTY', '__EMPTY_1', '__EMPTY_2', '__EMPTY_3', '__EMPTY_4', '__EMPTY_5',
  ]);

  for (const row of prevData) {
    const nombreCentro = String(row['Nombre del centro'] || '').trim();
    const codigoInfo = String(row['Codigo info'] || '').trim();
    const tecnicoName = String(row['Tecnico'] || '').trim();
    const fecha = row['Fecha'];
    const localizacion = String(row['Localizacion centro'] || '').trim();
    const provincia = String(row['Provincia'] || '').trim();
    const tipoSuministro = String(row['Tipo de linea del centro'] || '').trim();
    const proyecto = String(row['Proyecto'] || '').trim();

    if (!nombreCentro || !codigoInfo) {
      prevSkipped++;
      continue;
    }

    // Find or create centro
    let centroId = centroByCodigoInfo.get(codigoInfo)?.id;
    if (!centroId) {
      const existingCentro = await db.centro.findFirst({
        where: { codigo: codigoInfo },
      });
      if (existingCentro) {
        centroId = existingCentro.id;
        centroByCodigoInfo.set(codigoInfo, { id: existingCentro.id, nombre: existingCentro.nombre });
      } else {
        const coords = parseCoordinates(localizacion);
        const newCentro = await db.centro.create({
          data: {
            codigo: codigoInfo,
            nombre: nombreCentro,
            provincia: provincia || null,
            latitud: coords?.lat || null,
            longitud: coords?.lng || null,
            empresaId: cellnex.id,
            subEmpresaId: ontower.id,
            activo: true,
          },
        });
        centroId = newCentro.id;
        centroByCodigoInfo.set(codigoInfo, { id: newCentro.id, nombre: newCentro.nombre });
        prevCentrosCreated++;
      }
    }

    // Find technician
    const techUsername = TECNICO_MAP[tecnicoName];
    const techId = techUsername ? employeeMap.get(techUsername) : null;
    if (!techId) {
      console.log(`  ⚠️  Técnico no encontrado: "${tecnicoName}" para preventivo en "${nombreCentro}"`);
    }
    const tecnicoId = techId || employeeMap.get('toni')!;

    // Parse date
    const fechaDate = excelDateToDate(fecha);

    // Build formData from all non-metadata columns
    const formData: Record<string, string> = {};
    const cols = Object.keys(row);
    for (const col of cols) {
      if (METADATA_COLS.has(col)) continue;
      const val = String(row[col] ?? '').trim();
      if (val) {
        formData[col] = val;
      }
    }

    // Extract specific fields for the preventivo model
    const contadorVistaGeneral = String(row['Contador vista general'] || '').trim();
    const contadorCaja = String(row['Contador caja'] || '').trim();
    const contadorFusibles = String(row['Contador fusibles'] || '').trim();
    const parcelaEdificio = String(row['Parcela o edificio'] || '').trim();
    const observaciones = String(row['Observaciones'] || '').trim();
    const coords = parseCoordinates(localizacion);

    // Check if a preventivo already exists for this centro+fecha+tecnico
    const existing = await db.preventivo.findFirst({
      where: {
        centroId,
        tecnicoId,
        fecha: fechaDate || new Date(),
      },
    });

    if (existing) {
      prevSkipped++;
      continue;
    }

    // Create preventivo
    await db.preventivo.create({
      data: {
        procedimiento: `Preventivo ${proyecto} - ${nombreCentro}`,
        fecha: fechaDate || new Date(),
        tipoSuministro: tipoSuministro || null,
        contadorVistaGeneral: contadorVistaGeneral || null,
        contadorCaja: contadorCaja || null,
        contadorFusibles: contadorFusibles || null,
        parcelaEdificio: parcelaEdificio || null,
        observaciones: observaciones || null,
        latitud: coords?.lat || null,
        longitud: coords?.lng || null,
        estado: 'completado', // All preventivos in the Excel are already done
        tecnicoId,
        centroId,
        formData: JSON.stringify(formData),
      },
    });
    prevCreated++;
  }

  console.log(`  ✅ Preventivos creados: ${prevCreated}, omitidos: ${prevSkipped}`);
  console.log(`  📍 Nuevos centros creados para preventivos: ${prevCentrosCreated}`);

  // ============================================================
  // SUMMARY
  // ============================================================
  const totalCentros = await db.centro.count();
  const totalTareas = await db.tarea.count();
  const totalPreventivos = await db.preventivo.count();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL:');
  console.log(`   Centros en DB: ${totalCentros}`);
  console.log(`   Tareas en DB: ${totalTareas}`);
  console.log(`   Preventivos en DB: ${totalPreventivos}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Error en importación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
