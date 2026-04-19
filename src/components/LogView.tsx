'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import {
  ScrollText, ArrowLeft, Search, Filter, RefreshCw, Trash2,
  ChevronLeft, ChevronRight, Download, Clock, User, Activity,
  AlertTriangle, CheckCircle2, XCircle, Info, Loader2, Zap,
  Shield, BarChart3, TrendingUp, Users, AlertOctagon, Bug,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ACTION_LABELS, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS,
} from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

interface LogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  userRole: string | null;
  action: string;
  category: string;
  entity: string | null;
  entityId: string | null;
  entityName: string | null;
  timestamp: string;
  status: string;
  statusCode: number | null;
  description: string | null;
  details: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
}

interface LogStats {
  totals: { total: number; today: number; thisWeek: number; thisMonth: number };
  errors: { today: number; thisWeek: number; thisMonth: number };
  byAction: { action: string; count: number }[];
  byCategory: { category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topUsers: { userId: string | null; username: string | null; count: number }[];
  recentErrors: { id: string; action: string; category: string; errorMessage: string | null; timestamp: string; username: string | null }[];
  avgDuration: number | null;
  totalWithDuration: number;
}

type TabType = 'dashboard' | 'logs' | 'errors' | 'users';

// ============================================================
// COMPONENT
// ============================================================

export default function LogView() {
  const { token } = useAppStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Expanded log
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Cleanup dialog
  const [cleanupDialog, setCleanupDialog] = useState<{ open: boolean; days: number }>({ open: false, days: 0 });
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (filterAction) params.set('action', filterAction);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);

      const res = await fetch(`/api/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, filterAction, filterCategory, filterStatus, filterSeverity, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterAction, filterCategory, filterStatus, filterSeverity, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setSearch('');
    setFilterAction('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterSeverity('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = search || filterAction || filterCategory || filterStatus || filterSeverity || filterDateFrom || filterDateTo;

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch(`/api/logs?olderThan=${cleanupDialog.days}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        fetchLogs();
      }
    } catch (err) {
      console.error('Error cleaning up logs:', err);
    } finally {
      setCleanupLoading(false);
      setCleanupDialog({ open: false, days: 0 });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '10000' });
      if (filterAction) params.set('action', filterAction);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterSeverity) params.set('severity', filterSeverity);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);

      const res = await fetch(`/api/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getActionBadge = (action: string) => {
    const info = ACTION_LABELS[action] || { label: action, color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/30' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${info.color}`}>{info.label}</span>;
  };

  const getCategoryIcon = (category: string) => {
    const info = CATEGORY_LABELS[category] || { icon: '📁', label: category };
    return <span title={info.label}>{info.icon}</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().setCurrentView('panel-control')} className="text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Panel
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <ScrollText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Registro de Actividad</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Auditoría completa del sistema</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCleanupDialog({ open: true, days: 90 })} className="gap-1.5 text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Limpiar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-muted/50 rounded-xl">
          {[
            { key: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
            { key: 'logs' as const, label: 'Registros', icon: ScrollText },
            { key: 'errors' as const, label: 'Errores', icon: AlertOctagon },
            { key: 'users' as const, label: 'Usuarios', icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.key === 'errors' && stats && stats.errors.today > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 min-w-4 px-1">{stats.errors.today}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-[11px] text-muted-foreground font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totals.total.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{stats.totals.today} hoy</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] text-muted-foreground font-medium">Esta semana</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totals.thisWeek.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{stats.totals.thisMonth} este mes</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-[11px] text-muted-foreground font-medium">Errores hoy</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.errors.today}</p>
                  <p className="text-[10px] text-muted-foreground">{stats.errors.thisWeek} esta semana</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-[11px] text-muted-foreground font-medium">Tiempo medio</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgDuration ? formatDuration(stats.avgDuration) : '-'}</p>
                  <p className="text-[10px] text-muted-foreground">{stats.totalWithDuration} ops medidas</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* By Action */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Por Acción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.byAction.slice(0, 6).map(item => {
                      const info = ACTION_LABELS[item.action];
                      const pct = stats.totals.total > 0 ? (item.count / stats.totals.total) * 100 : 0;
                      return (
                        <div key={item.action} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{info?.label || item.action}</span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* By Category */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-teal-500" />
                    Por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.byCategory.slice(0, 6).map(item => {
                      const info = CATEGORY_LABELS[item.category];
                      const pct = stats.totals.total > 0 ? (item.count / stats.totals.total) * 100 : 0;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{info?.icon} {info?.label || item.category}</span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* By Severity */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    Por Severidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.bySeverity.map(item => {
                      const info = SEVERITY_LABELS[item.severity] || { label: item.severity, color: '' };
                      const pct = stats.totals.total > 0 ? (item.count / stats.totals.total) * 100 : 0;
                      const barColor = item.severity === 'error' || item.severity === 'critical'
                        ? 'from-red-500 to-rose-600'
                        : item.severity === 'warn'
                          ? 'from-amber-500 to-orange-500'
                          : 'from-blue-400 to-blue-600';
                      return (
                        <div key={item.severity} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-medium ${info.color}`}>{info.label}</span>
                            <span className="font-medium">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Errors */}
            {stats.recentErrors.length > 0 && (
              <Card className="border-red-200 dark:border-red-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertOctagon className="h-4 w-4" />
                    Últimos Errores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recentErrors.map(err => (
                      <div key={err.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-red-800 dark:text-red-300 truncate">{err.errorMessage || 'Error sin mensaje'}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-red-600/70 dark:text-red-400/70">
                            <span>{CATEGORY_LABELS[err.category]?.icon} {err.category}</span>
                            <span>·</span>
                            <span>{err.username || 'Sistema'}</span>
                            <span>·</span>
                            <span>{formatDate(err.timestamp)}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500" onClick={() => { setActiveTab('logs'); setFilterStatus('error'); }}>
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-orange-500" />
                    Registros del Sistema
                  </CardTitle>
                  <CardDescription>{total.toLocaleString()} registros encontrados</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs w-full sm:w-48"
                    />
                  </div>
                  <Button
                    variant={showFilters ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-8 gap-1.5"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filtros</span>
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchLogs} className="h-8">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Filters panel */}
              {showFilters && (
                <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Acción</label>
                      <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2">
                        <option value="">Todas</option>
                        {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Categoría</label>
                      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2">
                        <option value="">Todas</option>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Estado</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2">
                        <option value="">Todos</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Severidad</label>
                      <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2">
                        <option value="">Todas</option>
                        {Object.entries(SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Desde</label>
                      <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Hasta</label>
                      <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1 text-muted-foreground">
                      <X className="h-3 w-3" /> Limpiar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <ScrollText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay registros</p>
                  <p className="text-xs text-muted-foreground mt-1">La actividad del sistema aparecerá aquí</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-1.5">
                      {logs.map(log => {
                        const isExpanded = expandedLog === log.id;
                        return (
                          <div
                            key={log.id}
                            className={`border rounded-xl transition-all ${
                              log.status === 'error'
                                ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10'
                                : log.status === 'warning'
                                  ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10'
                                  : 'border-border/40 hover:border-border'
                            }`}
                          >
                            {/* Main row */}
                            <button
                              onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                              className="w-full flex items-center gap-3 p-3 text-left"
                            >
                              {getStatusIcon(log.status)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getCategoryIcon(log.category)}
                                  {getActionBadge(log.action)}
                                  {log.entityName && (
                                    <span className="text-xs text-foreground font-medium truncate max-w-[200px]">{log.entityName}</span>
                                  )}
                                  {log.description && !log.entityName && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[250px]">{log.description}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {log.durationMs !== null && (
                                  <Badge variant="outline" className="text-[9px] h-5 font-mono">
                                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                                    {formatDuration(log.durationMs)}
                                  </Badge>
                                )}
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] text-muted-foreground">{log.username || 'Sistema'}</p>
                                  <p className="text-[10px] text-muted-foreground/70">{formatDate(log.timestamp)}</p>
                                </div>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-0 border-t border-border/30">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                  {log.userId && (
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-[9px] text-muted-foreground font-medium">Usuario</p>
                                      <p className="text-xs font-medium">{log.username} <span className="text-muted-foreground">({log.userRole})</span></p>
                                    </div>
                                  )}
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <p className="text-[9px] text-muted-foreground font-medium">Fecha/Hora</p>
                                    <p className="text-xs font-medium">{formatDate(log.timestamp)}</p>
                                  </div>
                                  {log.statusCode && (
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-[9px] text-muted-foreground font-medium">HTTP Status</p>
                                      <p className="text-xs font-medium">{log.statusCode}</p>
                                    </div>
                                  )}
                                  {log.durationMs !== null && (
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-[9px] text-muted-foreground font-medium">Duración</p>
                                      <p className="text-xs font-medium">{formatDuration(log.durationMs)}</p>
                                    </div>
                                  )}
                                  {log.ipAddress && (
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-[9px] text-muted-foreground font-medium">IP</p>
                                      <p className="text-xs font-mono">{log.ipAddress}</p>
                                    </div>
                                  )}
                                  {log.entity && (
                                    <div className="p-2 rounded-lg bg-muted/30">
                                      <p className="text-[9px] text-muted-foreground font-medium">Entidad</p>
                                      <p className="text-xs">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}...` : ''}</p>
                                    </div>
                                  )}
                                  <div className="p-2 rounded-lg bg-muted/30">
                                    <p className="text-[9px] text-muted-foreground font-medium">Severidad</p>
                                    <p className={`text-xs font-medium ${SEVERITY_LABELS[log.severity]?.color || ''}`}>
                                      {SEVERITY_LABELS[log.severity]?.label || log.severity}
                                    </p>
                                  </div>
                                </div>

                                {log.description && (
                                  <div className="mt-2 p-2 rounded-lg bg-muted/30">
                                    <p className="text-[9px] text-muted-foreground font-medium">Descripción</p>
                                    <p className="text-xs">{log.description}</p>
                                  </div>
                                )}

                                {log.errorMessage && (
                                  <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                    <p className="text-[9px] text-red-600 dark:text-red-400 font-medium">Error</p>
                                    <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">{log.errorMessage}</p>
                                  </div>
                                )}

                                {log.details && (
                                  <div className="mt-2 p-2 rounded-lg bg-muted/30">
                                    <p className="text-[9px] text-muted-foreground font-medium">Detalles</p>
                                    <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                      {(() => { try { return JSON.stringify(JSON.parse(log.details), null, 2); } catch { return log.details; } })()}
                                    </pre>
                                  </div>
                                )}

                                {log.userAgent && (
                                  <div className="mt-2 p-2 rounded-lg bg-muted/30">
                                    <p className="text-[9px] text-muted-foreground font-medium">User Agent</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{log.userAgent}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Página {page} de {totalPages} · {total.toLocaleString()} registros
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ERRORS TAB */}
        {activeTab === 'errors' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-red-500" />
                Errores y Fallos
              </CardTitle>
              <CardDescription>Registro de errores y problemas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.errors.thisMonth > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.errors.today}</p>
                    <p className="text-[10px] text-red-500/70">Hoy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.errors.thisWeek}</p>
                    <p className="text-[10px] text-amber-500/70">Esta semana</p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.errors.thisMonth}</p>
                    <p className="text-[10px] text-orange-500/70">Este mes</p>
                  </div>
                </div>
              )}
              {/* Show error logs by filtering the main list */}
              <ErrorLogsList token={token} />
            </CardContent>
          </Card>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && stats && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Actividad por Usuario
              </CardTitle>
              <CardDescription>Ranking de usuarios más activos</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin datos de usuarios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topUsers.map((user, idx) => {
                    const maxCount = stats.topUsers[0]?.count || 1;
                    const pct = (user.count / maxCount) * 100;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={user.userId || idx} className="p-3 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{medals[idx] || `#${idx + 1}`}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold truncate">{user.username || 'Sistema'}</p>
                              <Badge variant="secondary" className="text-[10px]">{user.count} acciones</Badge>
                            </div>
                            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* By status summary */}
              <Separator className="my-4" />
              <p className="text-xs font-medium text-muted-foreground mb-3">Resumen por estado</p>
              <div className="grid grid-cols-3 gap-3">
                {stats.byStatus.map(item => {
                  const info = STATUS_LABELS[item.status] || { label: item.status, color: '' };
                  const Icon = item.status === 'success' ? CheckCircle2 : item.status === 'error' ? XCircle : AlertTriangle;
                  return (
                    <div key={item.status} className="p-3 rounded-xl bg-muted/30 text-center">
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${info.color}`} />
                      <p className="text-lg font-bold">{item.count.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{info.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cleanup dialog */}
      <AlertDialog open={cleanupDialog.open} onOpenChange={(open) => setCleanupDialog({ ...cleanupDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpiar registros antiguos</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los registros anteriores a {cleanupDialog.days} días. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup} disabled={cleanupLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {cleanupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Error Logs List Sub-component
// ============================================================

function ErrorLogsList({ token }: { token: string | null }) {
  const [errors, setErrors] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?status=error&page=${page}&limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setErrors(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching error logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (errors.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hay errores registrados</p>
        <p className="text-xs text-muted-foreground mt-1">El sistema funciona correctamente</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[50vh]">
        <div className="space-y-2">
          {errors.map(err => (
            <div key={err.id} className="p-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">{err.errorMessage || 'Error desconocido'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {err.action && <Badge variant="outline" className="text-[9px] h-4">{err.action}</Badge>}
                    {err.category && <Badge variant="outline" className="text-[9px] h-4">{err.category}</Badge>}
                    {err.entityName && <span className="text-[10px] text-red-600/60 dark:text-red-400/60">{err.entityName}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-red-500/60 dark:text-red-400/60">
                    <span>{err.username || 'Sistema'}</span>
                    <span>·</span>
                    <span>{new Date(err.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {err.durationMs !== null && <><span>·</span><span>{err.durationMs}ms</span></>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-7 w-7 p-0">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </>
  );
}
