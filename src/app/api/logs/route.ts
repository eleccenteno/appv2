import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/logs — List logs with filters, pagination, stats
// ============================================================

export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Only admins can view logs
  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden ver los registros del sistema' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Filters
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search')?.trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const entity = searchParams.get('entity');

    // Build where clause
    const where: Prisma.LogEntryWhereInput = {};

    if (action) where.action = action;
    if (category) where.category = category;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) (where.timestamp as Prisma.DateTimeFilter).gte = new Date(dateFrom);
      if (dateTo) (where.timestamp as Prisma.DateTimeFilter).lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { username: { contains: search } },
        { entityName: { contains: search } },
        { errorMessage: { contains: search } },
        { details: { contains: search } },
      ];
    }

    // Parallel queries for data + counts
    const [logs, total, stats] = await Promise.all([
      db.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      db.logEntry.count({ where }),
      getLogStats(),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Error al obtener registros del sistema' }, { status: 500 });
  }
}

// ============================================================
// DELETE /api/logs — Delete old logs (cleanup)
// ============================================================

export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden gestionar los registros' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // days
    const severity = searchParams.get('severity'); // only delete specific severity

    const where: Prisma.LogEntryWhereInput = {};

    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
      where.timestamp = { lt: cutoffDate };
    }

    if (severity) {
      where.severity = severity;
    }

    // Safety: require at least one filter
    if (!olderThan && !severity) {
      return NextResponse.json(
        { error: 'Debes especificar al menos un filtro (olderThan en días o severity)' },
        { status: 400 }
      );
    }

    const result = await db.logEntry.deleteMany({ where });

    return NextResponse.json({
      message: `Eliminados ${result.count} registros del sistema`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error deleting logs:', error);
    return NextResponse.json({ error: 'Error al eliminar registros' }, { status: 500 });
  }
}

// ============================================================
// STATS HELPER
// ============================================================

async function getLogStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    total,
    today,
    thisWeek,
    thisMonth,
    errorsToday,
    errorsWeek,
    errorsMonth,
    byAction,
    byCategory,
    bySeverity,
    byStatus,
    topUsers,
    recentErrors,
    avgDuration,
  ] = await Promise.all([
    // Totals
    db.logEntry.count(),
    db.logEntry.count({ where: { timestamp: { gte: todayStart } } }),
    db.logEntry.count({ where: { timestamp: { gte: weekStart } } }),
    db.logEntry.count({ where: { timestamp: { gte: monthStart } } }),

    // Error counts
    db.logEntry.count({ where: { status: 'error', timestamp: { gte: todayStart } } }),
    db.logEntry.count({ where: { status: 'error', timestamp: { gte: weekStart } } }),
    db.logEntry.count({ where: { status: 'error', timestamp: { gte: monthStart } } }),

    // By action (top 10)
    db.logEntry.groupBy({ by: ['action'], _count: true, orderBy: { _count: { action: 'desc' } }, take: 10 }),

    // By category (top 10)
    db.logEntry.groupBy({ by: ['category'], _count: true, orderBy: { _count: { category: 'desc' } }, take: 10 }),

    // By severity
    db.logEntry.groupBy({ by: ['severity'], _count: true, orderBy: { _count: { severity: 'desc' } } }),

    // By status
    db.logEntry.groupBy({ by: ['status'], _count: true, orderBy: { _count: { status: 'desc' } } }),

    // Top users (most active)
    db.logEntry.groupBy({
      by: ['userId', 'username'],
      _count: true,
      where: { userId: { not: null } },
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    }),

    // Recent errors
    db.logEntry.findMany({
      where: { status: 'error' },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: { id: true, action: true, category: true, errorMessage: true, timestamp: true, username: true },
    }),

    // Average duration
    db.logEntry.aggregate({
      _avg: { durationMs: true },
      _count: { durationMs: true },
      where: { durationMs: { not: null } },
    }),
  ]);

  return {
    totals: { total, today, thisWeek, thisMonth },
    errors: { today: errorsToday, thisWeek: errorsWeek, thisMonth: errorsMonth },
    byAction: byAction.map(r => ({ action: r.action, count: r._count })),
    byCategory: byCategory.map(r => ({ category: r.category, count: r._count })),
    bySeverity: bySeverity.map(r => ({ severity: r.severity, count: r._count })),
    byStatus: byStatus.map(r => ({ status: r.status, count: r._count })),
    topUsers: topUsers.map(r => ({ userId: r.userId, username: r.username, count: r._count })),
    recentErrors,
    avgDuration: avgDuration._avg.durationMs
      ? Math.round(avgDuration._avg.durationMs)
      : null,
    totalWithDuration: avgDuration._count.durationMs,
  };
}
