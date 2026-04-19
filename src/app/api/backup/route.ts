import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { writeFile, readFile, unlink, readdir, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const BACKUPS_DIR = join(process.cwd(), 'backups');

// Backup section definitions with their dependencies (import order)
const BACKUP_SECTIONS = [
  { key: 'empresas', label: 'Empresas y SubEmpresas', models: ['empresas', 'subEmpresas'], dependsOn: [] },
  { key: 'centros', label: 'Centros', models: ['centros'], dependsOn: ['empresas'] },
  { key: 'empleados', label: 'Empleados', models: ['empleados'], dependsOn: [] },
  { key: 'vehiculos', label: 'Vehículos', models: ['vehiculos', 'vehiculoAsignaciones', 'mantenimientoVehiculos', 'fotoMantenimientos'], dependsOn: ['empresas', 'empleados'] },
  { key: 'preventivos', label: 'Preventivos', models: ['preventivos', 'fotoPreventivos'], dependsOn: ['centros', 'empleados'] },
  { key: 'tareas', label: 'Tareas', models: ['tareas', 'fotoTareas'], dependsOn: ['centros', 'empleados'] },
] as const;

type SectionKey = 'empresas' | 'centros' | 'empleados' | 'vehiculos' | 'preventivos' | 'tareas';

interface BackupMetadata {
  version: string;
  timestamp: string;
  filename: string;
  sections: Record<SectionKey, boolean>;
  counts: Record<string, number>;
  fileSize: number;
}

interface BackupData {
  version: string;
  timestamp: string;
  sections: Record<SectionKey, boolean>;
  counts: Record<string, number>;
  data: Record<string, unknown[]>;
  description?: string;
}

async function ensureBackupsDir() {
  if (!existsSync(BACKUPS_DIR)) {
    await mkdir(BACKUPS_DIR, { recursive: true });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============================================================
// EXPORT DATA - Gather all data from selected sections
// ============================================================

async function exportSectionData(section: SectionKey): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};

  switch (section) {
    case 'empresas':
      result.empresas = await db.empresa.findMany({ orderBy: { nombre: 'asc' } });
      result.subEmpresas = await db.subEmpresa.findMany({ orderBy: { nombre: 'asc' } });
      break;
    case 'centros':
      result.centros = await db.centro.findMany({ orderBy: { codigo: 'asc' } });
      break;
    case 'empleados':
      result.empleados = await db.employee.findMany({ orderBy: { name: 'asc' } });
      break;
    case 'vehiculos':
      result.vehiculos = await db.vehiculo.findMany({ orderBy: { matricula: 'asc' } });
      result.vehiculoAsignaciones = await db.vehiculoAsignacion.findMany();
      result.mantenimientoVehiculos = await db.mantenimientoVehiculo.findMany();
      result.fotoMantenimientos = await db.fotoMantenimiento.findMany();
      break;
    case 'preventivos':
      result.preventivos = await db.preventivo.findMany({ orderBy: { fecha: 'desc' } });
      result.fotoPreventivos = await db.fotoPreventivo.findMany();
      break;
    case 'tareas':
      result.tareas = await db.tarea.findMany({ orderBy: { createdAt: 'desc' } });
      result.fotoTareas = await db.fotoTarea.findMany();
      break;
  }

  return result;
}

// ============================================================
// IMPORT DATA - Restore data from backup for selected sections
// ============================================================

async function importSectionData(section: SectionKey, data: Record<string, unknown[]>): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  switch (section) {
    case 'empresas': {
      // Delete in reverse dependency order
      await db.subEmpresa.deleteMany();
      await db.empresa.deleteMany();
      // Import empresas first
      if (data.empresas?.length) {
        for (const item of data.empresas as any[]) {
          await db.empresa.create({ data: { nombre: item.nombre, slug: item.slug, logo: item.logo, descripcion: item.descripcion, activa: item.activa ?? true } });
        }
        counts.empresas = data.empresas.length;
      }
      // Then subEmpresas
      if (data.subEmpresas?.length) {
        for (const item of data.subEmpresas as any[]) {
          await db.subEmpresa.create({ data: { nombre: item.nombre, slug: item.slug, logo: item.logo, descripcion: item.descripcion, activa: item.activa ?? true, empresaId: item.empresaId } });
        }
        counts.subEmpresas = data.subEmpresas.length;
      }
      break;
    }
    case 'centros': {
      await db.centro.deleteMany();
      if (data.centros?.length) {
        for (const item of data.centros as any[]) {
          await db.centro.create({
            data: {
              codigo: item.codigo, nombre: item.nombre, direccion: item.direccion,
              ciudad: item.ciudad, provincia: item.provincia, codigoPostal: item.codigoPostal,
              latitud: item.latitud, longitud: item.longitud, tipoSuministro: item.tipoSuministro,
              parcelaEdificio: item.parcelaEdificio, observaciones: item.observaciones,
              datosJson: item.datosJson, activo: item.activo ?? true,
              empresaId: item.empresaId, subEmpresaId: item.subEmpresaId,
            },
          });
        }
        counts.centros = data.centros.length;
      }
      break;
    }
    case 'empleados': {
      await db.employee.deleteMany();
      if (data.empleados?.length) {
        for (const item of data.empleados as any[]) {
          await db.employee.create({
            data: {
              username: item.username, password: item.password, name: item.name,
              nombreCompleto: item.nombreCompleto, email: item.email, phone: item.phone,
              dni: item.dni, foto: item.foto, role: item.role ?? 'empleado',
              tipo: item.tipo, vehiculoMarca: item.vehiculoMarca, vehiculoModelo: item.vehiculoModelo,
              vehiculoMatricula: item.vehiculoMatricula, activo: item.activo ?? true,
            },
          });
        }
        counts.empleados = data.empleados.length;
      }
      break;
    }
    case 'vehiculos': {
      // Delete in reverse dependency order
      await db.fotoMantenimiento.deleteMany();
      await db.mantenimientoVehiculo.deleteMany();
      await db.vehiculoAsignacion.deleteMany();
      await db.vehiculo.deleteMany();
      if (data.vehiculos?.length) {
        for (const item of data.vehiculos as any[]) {
          await db.vehiculo.create({
            data: {
              marca: item.marca, modelo: item.modelo, matricula: item.matricula,
              anio: item.anio, color: item.color, kilometraje: item.kilometraje,
              observaciones: item.observaciones, activo: item.activo ?? true, empresaId: item.empresaId,
            },
          });
        }
        counts.vehiculos = data.vehiculos.length;
      }
      if (data.vehiculoAsignaciones?.length) {
        for (const item of data.vehiculoAsignaciones as any[]) {
          await db.vehiculoAsignacion.create({
            data: {
              vehiculoId: item.vehiculoId, empleadoId: item.empleadoId,
              fechaInicio: item.fechaInicio, fechaFin: item.fechaFin, activa: item.activa ?? true,
            },
          });
        }
        counts.vehiculoAsignaciones = data.vehiculoAsignaciones.length;
      }
      if (data.mantenimientoVehiculos?.length) {
        for (const item of data.mantenimientoVehiculos as any[]) {
          await db.mantenimientoVehiculo.create({
            data: {
              vehiculoId: item.vehiculoId, tipo: item.tipo, descripcion: item.descripcion,
              fecha: item.fecha, kilometraje: item.kilometraje, costo: item.costo,
              taller: item.taller, observaciones: item.observaciones, estado: item.estado ?? 'pendiente',
            },
          });
        }
        counts.mantenimientoVehiculos = data.mantenimientoVehiculos.length;
      }
      if (data.fotoMantenimientos?.length) {
        for (const item of data.fotoMantenimientos as any[]) {
          await db.fotoMantenimiento.create({
            data: { mantenimientoId: item.mantenimientoId, fotoBase64: item.fotoBase64, descripcion: item.descripcion },
          });
        }
        counts.fotoMantenimientos = data.fotoMantenimientos.length;
      }
      break;
    }
    case 'preventivos': {
      await db.fotoPreventivo.deleteMany();
      await db.preventivo.deleteMany();
      if (data.preventivos?.length) {
        for (const item of data.preventivos as any[]) {
          await db.preventivo.create({
            data: {
              procedimiento: item.procedimiento, fecha: item.fecha,
              tipoSuministro: item.tipoSuministro, contadorVistaGeneral: item.contadorVistaGeneral,
              contadorCaja: item.contadorCaja, contadorFusibles: item.contadorFusibles,
              parcelaEdificio: item.parcelaEdificio, observaciones: item.observaciones,
              latitud: item.latitud, longitud: item.longitud, estado: item.estado ?? 'pendiente',
              tecnicoId: item.tecnicoId, centroId: item.centroId, formData: item.formData,
            },
          });
        }
        counts.preventivos = data.preventivos.length;
      }
      if (data.fotoPreventivos?.length) {
        for (const item of data.fotoPreventivos as any[]) {
          await db.fotoPreventivo.create({
            data: { preventivoId: item.preventivoId, fotoBase64: item.fotoBase64, descripcion: item.descripcion, categoria: item.categoria },
          });
        }
        counts.fotoPreventivos = data.fotoPreventivos.length;
      }
      break;
    }
    case 'tareas': {
      await db.fotoTarea.deleteMany();
      await db.tarea.deleteMany();
      if (data.tareas?.length) {
        for (const item of data.tareas as any[]) {
          await db.tarea.create({
            data: {
              titulo: item.titulo, descripcion: item.descripcion, tipo: item.tipo ?? 'correctivo',
              prioridad: item.prioridad ?? 'media', estado: item.estado ?? 'pendiente',
              fechaLimite: item.fechaLimite, fechaInicio: item.fechaInicio, fechaFin: item.fechaFin,
              centroId: item.centroId, asignadoA: item.asignadoA, formData: item.formData,
            },
          });
        }
        counts.tareas = data.tareas.length;
      }
      if (data.fotoTareas?.length) {
        for (const item of data.fotoTareas as any[]) {
          await db.fotoTarea.create({
            data: { tareaId: item.tareaId, fotoBase64: item.fotoBase64, descripcion: item.descripcion, categoria: item.categoria },
          });
        }
        counts.fotoTareas = data.fotoTareas.length;
      }
      break;
    }
  }

  return counts;
}

// ============================================================
// GET /api/backup - List all available backups
// ============================================================

export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Only admins can manage backups
  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden gestionar copias de seguridad' }, { status: 403 });
  }

  try {
    await ensureBackupsDir();
    const files = await readdir(BACKUPS_DIR);
    const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.json'));

    const backups: BackupMetadata[] = [];

    for (const filename of backupFiles) {
      try {
        const filePath = join(BACKUPS_DIR, filename);
        const content = await readFile(filePath, 'utf-8');
        const backup = JSON.parse(content) as BackupData;
        const fileStat = await stat(filePath);

        backups.push({
          version: backup.version,
          timestamp: backup.timestamp,
          filename,
          sections: backup.sections,
          counts: backup.counts,
          fileSize: fileStat.size,
        });
      } catch {
        // Skip corrupted backup files
        console.warn(`Skipping corrupted backup: ${filename}`);
      }
    }

    // Sort by date descending
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Get current DB record counts for comparison
    const currentCounts = {
      empresas: await db.empresa.count(),
      subEmpresas: await db.subEmpresa.count(),
      centros: await db.centro.count(),
      empleados: await db.employee.count(),
      vehiculos: await db.vehiculo.count(),
      preventivos: await db.preventivo.count(),
      tareas: await db.tarea.count(),
      fotoPreventivos: await db.fotoPreventivo.count(),
      fotoTareas: await db.fotoTarea.count(),
    };

    return NextResponse.json({ backups, currentCounts, sections: BACKUP_SECTIONS });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Error al listar copias de seguridad' }, { status: 500 });
  }
}

// ============================================================
// POST /api/backup - Create backup or Import backup
// ============================================================

export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden gestionar copias de seguridad' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'export' or 'import'

    if (action === 'export') {
      return await handleExport(request);
    } else if (action === 'import') {
      return await handleImport(request);
    } else if (action === 'download') {
      return await handleDownload(request);
    } else {
      return NextResponse.json({ error: 'Acción no válida. Use ?action=export, ?action=import o ?action=download' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in backup operation:', error);
    return NextResponse.json({ error: 'Error en la operación de copia de seguridad: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/backup - Delete a backup file
// ============================================================

export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden gestionar copias de seguridad' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Nombre de archivo requerido' }, { status: 400 });
    }

    // Security: only allow deleting backup files from the backups directory
    if (!filename.startsWith('backup_') || !filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Nombre de archivo no válido' }, { status: 400 });
    }

    const filePath = join(BACKUPS_DIR, filename);

    // Check file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    await unlink(filePath);
    return NextResponse.json({ message: 'Copia de seguridad eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: 'Error al eliminar la copia de seguridad' }, { status: 500 });
  }
}

// ============================================================
// EXPORT HANDLER
// ============================================================

async function handleExport(request: NextRequest) {
  const body = await request.json();
  const selectedSections: SectionKey[] = body.sections || [];
  const description: string = body.description || '';
  const download: boolean = body.download || false;

  if (selectedSections.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos una sección para exportar' }, { status: 400 });
  }

  await ensureBackupsDir();

  // Gather data for selected sections
  const allData: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const sectionsEnabled: Record<SectionKey, boolean> = {
    empresas: false, centros: false, empleados: false,
    vehiculos: false, preventivos: false, tareas: false,
  };

  for (const section of selectedSections) {
    sectionsEnabled[section] = true;
    const sectionData = await exportSectionData(section);
    for (const [key, value] of Object.entries(sectionData)) {
      allData[key] = value;
      counts[key] = value.length;
    }
  }

  const timestamp = new Date().toISOString();
  const filenameTimestamp = timestamp.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const filename = `backup_${filenameTimestamp}.json`;

  const backup: BackupData = {
    version: '1.0',
    timestamp,
    sections: sectionsEnabled,
    counts,
    data: allData,
  };

  // If description is provided, add it
  if (description) {
    backup.description = description;
  }

  // Save to disk (compact JSON without pretty-printing for large datasets)
  const filePath = join(BACKUPS_DIR, filename);
  const jsonContent = JSON.stringify(backup);
  await writeFile(filePath, jsonContent, 'utf-8');

  const fileStat = await stat(filePath);

  // If download mode, return the backup JSON as a downloadable response
  if (download) {
    return new NextResponse(jsonContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({
    message: 'Copia de seguridad creada exitosamente',
    backup: {
      filename,
      timestamp,
      sections: sectionsEnabled,
      counts,
      fileSize: fileStat.size,
      fileSizeFormatted: formatFileSize(fileStat.size),
    },
  });
}

// ============================================================
// IMPORT HANDLER
// ============================================================

async function handleImport(request: NextRequest) {
  const body = await request.json();
  const backupData: BackupData = body.backupData;
  const selectedSections: SectionKey[] = body.sections || [];

  if (!backupData || !backupData.version || !backupData.data) {
    return NextResponse.json({ error: 'Datos de copia de seguridad no válidos' }, { status: 400 });
  }

  if (selectedSections.length === 0) {
    return NextResponse.json({ error: 'Selecciona al menos una sección para restaurar' }, { status: 400 });
  }

  // Determine import order based on dependencies
  const importOrder: SectionKey[] = [];
  const remaining = new Set(selectedSections);

  // Resolve dependencies
  const maxIterations = remaining.size + 1;
  let iteration = 0;
  while (remaining.size > 0 && iteration < maxIterations) {
    iteration++;
    for (const section of remaining) {
      const sectionDef = BACKUP_SECTIONS.find(s => s.key === section);
      if (!sectionDef) {
        remaining.delete(section);
        continue;
      }
      const depsMet = sectionDef.dependsOn.every(dep =>
        !selectedSections.includes(dep as SectionKey) || importOrder.includes(dep as SectionKey)
      );
      if (depsMet) {
        importOrder.push(section);
        remaining.delete(section);
      }
    }
  }

  if (remaining.size > 0) {
    return NextResponse.json({ error: 'No se pudieron resolver las dependencias para: ' + [...remaining].join(', ') }, { status: 400 });
  }

  // Also save the imported backup file
  await ensureBackupsDir();
  const timestamp = new Date().toISOString();
  const filenameTimestamp = timestamp.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const saveFilename = `backup_imported_${filenameTimestamp}.json`;

  const importCounts: Record<string, number> = {};

  // Import in dependency order
  for (const section of importOrder) {
    const sectionModels = BACKUP_SECTIONS.find(s => s.key === section)?.models || [];
    const sectionData: Record<string, unknown[]> = {};
    for (const model of sectionModels) {
      if (backupData.data[model]) {
        sectionData[model] = backupData.data[model];
      }
    }

    const sectionCounts = await importSectionData(section, sectionData);
    for (const [key, value] of Object.entries(sectionCounts)) {
      importCounts[key] = value;
    }
  }

  // Save the imported backup file for record-keeping
  try {
    const savedBackup = { ...backupData, importedAt: timestamp };
    await writeFile(join(BACKUPS_DIR, saveFilename), JSON.stringify(savedBackup), 'utf-8');
  } catch {
    // Non-critical: don't fail if we can't save the file
  }

  return NextResponse.json({
    message: 'Copia de seguridad restaurada exitosamente',
    importCounts,
    importOrder,
  });
}

// ============================================================
// DOWNLOAD HANDLER
// ============================================================

async function handleDownload(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Nombre de archivo requerido' }, { status: 400 });
  }

  // Security: only allow downloading backup files
  if (!filename.startsWith('backup_') || !filename.endsWith('.json')) {
    return NextResponse.json({ error: 'Nombre de archivo no válido' }, { status: 400 });
  }

  const filePath = join(BACKUPS_DIR, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  // Read the backup file and return it as a downloadable response
  const content = await readFile(filePath, 'utf-8');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
