import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export type LogAction =
  | 'create' | 'update' | 'delete'
  | 'login' | 'logout' | 'login_failed'
  | 'import' | 'export' | 'backup' | 'restore'
  | 'error' | 'view' | 'download'
  | 'password_change' | 'role_change'
  | 'system';

export type LogCategory =
  | 'auth' | 'preventivo' | 'tarea' | 'centro'
  | 'empleado' | 'vehiculo' | 'empresa' | 'subempresa'
  | 'backup' | 'system' | 'usuario' | 'fotos';

export type LogStatus = 'success' | 'error' | 'warning';

export type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogInput {
  action: LogAction;
  category: LogCategory;
  entity?: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  details?: Record<string, unknown>;
  status?: LogStatus;
  statusCode?: number;
  errorMessage?: string;
  durationMs?: number;
  severity?: LogSeverity;
  userId?: string;
  username?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================
// CONVENIENCE: Extract user info from auth + request
// ============================================================

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export function extractRequestMeta(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

// ============================================================
// MAIN LOG FUNCTION
// ============================================================

export async function logAction(input: LogInput): Promise<void> {
  try {
    await db.logEntry.create({
      data: {
        userId: input.userId || null,
        username: input.username || null,
        userRole: input.userRole || null,
        action: input.action,
        category: input.category,
        entity: input.entity || null,
        entityId: input.entityId || null,
        entityName: input.entityName || null,
        status: input.status || 'success',
        statusCode: input.statusCode || null,
        description: input.description || null,
        details: input.details ? JSON.stringify(input.details) : null,
        errorMessage: input.errorMessage || null,
        durationMs: input.durationMs || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        severity: input.severity || (input.status === 'error' ? 'error' : 'info'),
      },
    });
  } catch (err) {
    // Never let logging failures break the app
    console.error('[Logger] Failed to write log:', err);
  }
}

// ============================================================
// CONVENIENCE HELPERS
// ============================================================

/** Log with automatic user + request extraction */
export async function logActivity(
  action: LogAction,
  category: LogCategory,
  authUser: AuthUser | null,
  request: NextRequest,
  opts?: Partial<Omit<LogInput, 'action' | 'category' | 'userId' | 'username' | 'userRole' | 'ipAddress' | 'userAgent'>>
): Promise<void> {
  const meta = extractRequestMeta(request);
  await logAction({
    action,
    category,
    userId: authUser?.id,
    username: authUser?.username,
    userRole: authUser?.role,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    ...opts,
  });
}

/** Measure execution time of an async function and log it */
export async function logWithDuration<T>(
  fn: () => Promise<T>,
  logFn: (durationMs: number, result: T) => Promise<void>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    await logFn(durationMs, result);
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    await logFn(durationMs, undefined as T);
    throw error;
  }
}

// ============================================================
// ACTION & CATEGORY LABELS (for UI)
// ============================================================

export const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create:         { label: 'Creación', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30' },
  update:         { label: 'Actualización', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30' },
  delete:         { label: 'Eliminación', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30' },
  login:          { label: 'Inicio sesión', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30' },
  logout:         { label: 'Cierre sesión', color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/30' },
  login_failed:   { label: 'Login fallido', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/40' },
  import:         { label: 'Importación', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30' },
  export:         { label: 'Exportación', color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30' },
  backup:         { label: 'Backup', color: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950/30' },
  restore:        { label: 'Restauración', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30' },
  error:          { label: 'Error', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/40' },
  view:           { label: 'Visualización', color: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/30' },
  download:       { label: 'Descarga', color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/30' },
  password_change:{ label: 'Cambio contraseña', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30' },
  role_change:    { label: 'Cambio rol', color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30' },
  system:         { label: 'Sistema', color: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/30' },
};

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  auth:       { label: 'Autenticación', icon: '🔐' },
  preventivo: { label: 'Preventivos', icon: '🛡️' },
  tarea:      { label: 'Tareas', icon: '📋' },
  centro:     { label: 'Centros', icon: '🏢' },
  empleado:   { label: 'Empleados', icon: '👤' },
  vehiculo:   { label: 'Vehículos', icon: '🚗' },
  empresa:    { label: 'Empresas', icon: '🏛️' },
  subempresa: { label: 'Sub-Empresas', icon: '🏗️' },
  backup:     { label: 'Backups', icon: '💾' },
  system:     { label: 'Sistema', icon: '⚙️' },
  usuario:    { label: 'Usuarios', icon: '👥' },
  fotos:      { label: 'Fotos', icon: '📷' },
};

export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  debug:    { label: 'Debug', color: 'text-gray-500' },
  info:     { label: 'Info', color: 'text-blue-500' },
  warn:     { label: 'Aviso', color: 'text-amber-500' },
  error:    { label: 'Error', color: 'text-red-500' },
  critical: { label: 'Crítico', color: 'text-red-700 font-bold' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: 'Éxito', color: 'text-emerald-600 dark:text-emerald-400' },
  error:   { label: 'Error', color: 'text-red-600 dark:text-red-400' },
  warning: { label: 'Aviso', color: 'text-amber-600 dark:text-amber-400' },
};
