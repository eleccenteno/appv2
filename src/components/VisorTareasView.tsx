'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { TAREA_SECTIONS, FormSection, FormField } from '@/lib/tarea-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

import {
  ArrowLeft, Search, Filter, Eye, Calendar, MapPin, User, Building2,
  ChevronDown, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2,
  FileText, Camera, ClipboardList,
  Link2, X,
  Hash, Phone, MapPinned,
  Layers, Activity, BarChart3, ArrowUpRight,
  CircleDot, Send, FilePen, Users, Pencil, Trash2,
  Ban,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  prioridad: string;
  estado: string;
  fechaLimite: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  centroId: string;
  asignadoA: string;
  formData: Record<string, string> | null;
  centro: {
    id: string; codigo: string; nombre: string; ciudad: string | null; provincia: string | null;
    empresa: { id: string; nombre: string } | null;
    subEmpresa: { id: string; nombre: string } | null;
  };
  empleado: { id: string; name: string; username: string; role: string };
  fotos: { id: string; fotoBase64: string; descripcion: string | null; categoria: string | null }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Icon mapping
// ============================================================

const SECTION_ICONS: Record<string, React.ElementType> = {
  FileText, Building2, ClipboardList, Camera,
  Link: Link2,
  TowerControl: Building2, Bird: Building2, Users: Building2, CircuitBoard: ClipboardList,
};

function getSectionIcon(iconName: string): React.ElementType {
  return SECTION_ICONS[iconName] || FileText;
}

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
  Text: FileText, Number: Hash, Decimal: Hash, Enum: ChevronDown,
  EnumList: ClipboardList, LongText: FileText, Phone: Phone,
  Date: Calendar, LatLong: MapPinned, Image: Camera, Photo: Camera,
  Show: Eye, Ref: Link2, Color: Activity,
};

// ============================================================
// Color mapping for prioridadTarea
// ============================================================

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  Yellow: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  Red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
  // Legacy mappings for old data
  Baja: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  Urgente: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
};

// ============================================================
// Status helpers
// ============================================================

interface EstadoConfig {
  label: string;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: React.ElementType;
}

function getEstadoConfig(estado: string): EstadoConfig {
  switch (estado) {
    case 'Pendiente':
    case 'pendiente':
      return {
        label: 'Pendiente',
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-400',
        icon: Clock,
      };
    case 'Realizado':
    case 'realizado':
    case 'completada':
      return {
        label: 'Realizado',
        gradient: 'from-teal-500 to-emerald-500',
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-400',
        icon: CheckCircle2,
      };
    case 'en_progreso':
      return {
        label: 'En Progreso',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-400',
        icon: Activity,
      };
    case 'cancelada':
      return {
        label: 'Cancelada',
        gradient: 'from-gray-400 to-gray-500',
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
        icon: Ban,
      };
    case 'blacklist':
      return {
        label: 'Black List',
        gradient: 'from-red-600 to-red-700',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
        icon: Ban,
      };
    default:
      return {
        label: estado,
        gradient: 'from-gray-400 to-gray-500',
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-400',
        icon: AlertCircle,
      };
  }
}

// ============================================================
// Mini donut chart for stats
// ============================================================

function MiniDonut({ segments, size = 56 }: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((a, b) => a + b.value, 0);

  // Pre-compute offsets to avoid reassigning variable during render
  const offsets: number[] = [];
  let cumulative = 0;
  for (const seg of segments) {
    offsets.push(cumulative);
    cumulative += total > 0 ? (seg.value / total) * circumference : 0;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/50" />
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * circumference : 0;
        const dashArray = `${pct} ${circumference - pct}`;
        const dashOffset = -offsets[i];
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={seg.color} strokeWidth="4"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            strokeLinecap="round" className="transition-all duration-700" />
        );
      })}
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function VisorTareasView() {
  const { goBack, currentUser } = useAppStore();
  const schema = TAREA_SECTIONS;

  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterProvincia, setFilterProvincia] = useState<string>('todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('todos');
  const [selectedTarea, setSelectedTarea] = useState<TareaItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBlacklist, setFilterBlacklist] = useState<string>('todos');
  const tareasRef = useRef<HTMLDivElement>(null);

  const scrollToTareas = useCallback(() => {
    setTimeout(() => {
      tareasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  // Fetch tareas
  const fetchTareas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado && filterEstado !== 'todos') params.set('estado', filterEstado);
      const res = await fetch(`/api/tareas?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar tareas');
      const data = await res.json();
      setTareas(data.tareas || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { fetchTareas(); }, [fetchTareas]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    tareas.forEach(t => {
      const dateStr = t.formData?.fecha || t.fechaLimite || t.createdAt;
      if (dateStr) years.add(new Date(dateStr).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [tareas]);

  // Available provinces
  const availableProvincias = useMemo(() => {
    const provs = new Set<string>();
    tareas.forEach(t => {
      if (t.centro?.provincia) provs.add(t.centro.provincia);
      else if (t.formData?.provincia) provs.add(t.formData.provincia);
    });
    return Array.from(provs).sort();
  }, [tareas]);

  // Available technicians
  const availableTecnicos = useMemo(() => {
    const techs = new Map<string, string>();
    tareas.forEach(t => {
      if (t.empleado?.id && t.empleado?.name) {
        techs.set(t.empleado.id, t.empleado.name);
      }
    });
    return Array.from(techs.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tareas]);

  // Filter
  const filtered = useMemo(() => {
    let result = tareas;
    if (filterProvincia && filterProvincia !== 'todos') {
      result = result.filter(t => t.centro?.provincia === filterProvincia || t.formData?.provincia === filterProvincia);
    }
    if (filterTecnico && filterTecnico !== 'todos') {
      result = result.filter(t => t.empleado?.id === filterTecnico);
    }
    if (filterYear && filterYear !== 'todos') {
      const year = parseInt(filterYear);
      result = result.filter(t => {
        const dateStr = t.formData?.fecha || t.fechaLimite || t.createdAt;
        return dateStr ? new Date(dateStr).getFullYear() === year : false;
      });
    }
    if (filterBlacklist && filterBlacklist !== 'todos') {
      const isBL = filterBlacklist === 'si';
      result = result.filter(t => {
        const fd = t.formData;
        const bl = fd && typeof fd === 'object' ? (fd as Record<string, string>).blackList : '';
        return isBL ? bl === 'Sí' : bl !== 'Sí';
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.centro?.codigo?.toLowerCase().includes(q) ||
        t.centro?.nombre?.toLowerCase().includes(q) ||
        t.centro?.provincia?.toLowerCase().includes(q) ||
        t.empleado?.name?.toLowerCase().includes(q) ||
        t.titulo?.toLowerCase().includes(q) ||
        t.tipo?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tareas, searchQuery, filterYear, filterProvincia, filterTecnico, filterBlacklist]);

  // Stats
  const stats = useMemo(() => {
    const countByEstado: Record<string, number> = {};
    let blacklistCount = 0;
    tareas.forEach(t => {
      countByEstado[t.estado] = (countByEstado[t.estado] || 0) + 1;
      // Count blacklist from formData
      const fd = t.formData;
      if (fd && typeof fd === 'object' && (fd as Record<string, string>).blackList === 'Sí') {
        blacklistCount++;
      }
    });
    // Normalize: count both 'Pendiente' and 'pendiente', 'Realizado' and 'completada'
    const pendiente = (countByEstado['Pendiente'] || 0) + (countByEstado['pendiente'] || 0);
    const realizado = (countByEstado['Realizado'] || 0) + (countByEstado['realizado'] || 0) + (countByEstado['completada'] || 0);
    const enProgreso = countByEstado['en_progreso'] || 0;
    const cancelada = countByEstado['cancelada'] || 0;
    return {
      total: tareas.length,
      pendiente,
      realizado,
      en_progreso: enProgreso,
      cancelada,
      blacklist: blacklistCount,
    };
  }, [tareas]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const donutSegments = [
    { value: stats.realizado, color: '#14b8a6' },
    { value: stats.pendiente, color: '#f59e0b' },
    { value: stats.en_progreso, color: '#3b82f6' },
    { value: stats.cancelada, color: '#9ca3af' },
    { value: stats.blacklist, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/3 rounded-full blur-2xl" />

        <div className="relative p-5 sm:p-6 max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={goBack}
              className="h-10 w-10 shrink-0 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-background">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Eye className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                Visor de Tareas
              </h1>
              <p className="text-sm text-muted-foreground mt-1 ml-12">
                {filtered.length} de {stats.total} tareas
              </p>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
            <Card className="col-span-2 sm:col-span-1 border-0 shadow-md bg-background/80 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <MiniDonut segments={donutSegments} size={52} />
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{stats.total}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Total</p>
                </div>
              </CardContent>
            </Card>

            <StatCard
              icon={CheckCircle2}
              value={stats.realizado}
              label="Realizadas"
              gradient="from-teal-500 to-emerald-500"
              bgGlow="bg-teal-500/10"
              active={filterEstado === 'Realizado'}
              onClick={() => {
                setFilterEstado(prev => prev === 'Realizado' ? 'todos' : 'Realizado');
                scrollToTareas();
              }}
            />
            <StatCard
              icon={Clock}
              value={stats.pendiente}
              label="Pendientes"
              gradient="from-amber-500 to-orange-500"
              bgGlow="bg-amber-500/10"
              active={filterEstado === 'Pendiente'}
              onClick={() => {
                setFilterEstado(prev => prev === 'Pendiente' ? 'todos' : 'Pendiente');
                scrollToTareas();
              }}
            />
            <StatCard
              icon={Ban}
              value={stats.blacklist}
              label="Black List"
              gradient="from-red-600 to-red-700"
              bgGlow="bg-red-600/10"
              active={filterBlacklist === 'si'}
              onClick={() => {
                setFilterBlacklist(prev => prev === 'si' ? 'todos' : 'si');
                scrollToTareas();
              }}
            />
            {stats.en_progreso > 0 && (
              <StatCard
                icon={Activity}
                value={stats.en_progreso}
                label="En Progreso"
                gradient="from-blue-500 to-cyan-500"
                bgGlow="bg-blue-500/10"
              />
            )}
            {stats.cancelada > 0 && (
              <StatCard
                icon={Ban}
                value={stats.cancelada}
                label="Canceladas"
                gradient="from-gray-400 to-gray-500"
                bgGlow="bg-gray-500/10"
              />
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar centro, técnico, tipo tarea..."
                className="pl-10 h-11 rounded-xl bg-muted/40 border-border/50 focus:bg-background transition-colors text-sm"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg"
                  onClick={() => setSearchQuery('')}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl bg-muted/40 border-border/50 text-sm">
                  <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterProvincia} onValueChange={setFilterProvincia}>
                <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl bg-muted/40 border-border/50 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las provincias</SelectItem>
                  {availableProvincias.map(prov => (
                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTecnico} onValueChange={setFilterTecnico}>
                <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl bg-muted/40 border-border/50 text-sm">
                  <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los técnicos</SelectItem>
                  {availableTecnicos.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableYears.length > 0 && (
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-full sm:w-36 h-11 rounded-xl bg-muted/40 border-border/50 text-sm">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los años</SelectItem>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterBlacklist} onValueChange={setFilterBlacklist}>
                <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl bg-muted/40 border-border/50 text-sm">
                  <Ban className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Black List</SelectItem>
                  <SelectItem value="si">En Black List</SelectItem>
                  <SelectItem value="no">Sin Black List</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="hidden sm:flex items-center bg-muted/40 rounded-xl border border-border/50 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all text-xs font-medium ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Layers className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all text-xs font-medium ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={tareasRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium">Cargando tareas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl"
              onClick={() => fetchTareas()}>
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {searchQuery || filterEstado !== 'todos' || filterYear !== 'todos' || filterProvincia !== 'todos' || filterTecnico !== 'todos' || filterBlacklist !== 'todos'
                ? 'No se encontraron tareas con los filtros aplicados'
                : 'No hay tareas registradas todavía'}
            </p>
            {(searchQuery || filterEstado !== 'todos' || filterYear !== 'todos' || filterProvincia !== 'todos' || filterTecnico !== 'todos' || filterBlacklist !== 'todos') && (
              <Button variant="ghost" size="sm" className="mt-3 rounded-xl"
                onClick={() => { setSearchQuery(''); setFilterEstado('todos'); setFilterYear('todos'); setFilterProvincia('todos'); setFilterTecnico('todos'); setFilterBlacklist('todos'); }}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tarea => (
              <TareaCardModern
                key={tarea.id}
                tarea={tarea}
                schema={schema}
                onClick={() => setSelectedTarea(tarea)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(tarea => (
              <TareaRowModern
                key={tarea.id}
                tarea={tarea}
                schema={schema}
                onClick={() => setSelectedTarea(tarea)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Mostrando {filtered.length} de {stats.total} tareas
            </p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedTarea && (
        <TareaDetailDialog
          tarea={selectedTarea}
          schema={schema}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onClose={() => setSelectedTarea(null)}
          currentUser={currentUser}
          onRefresh={fetchTareas}
        />
      )}
    </div>
  );
}

// ============================================================
// Stat Card
// ============================================================

function StatCard({ icon: Icon, value, label, gradient, bgGlow, onClick, active }: {
  icon: React.ElementType;
  value: number;
  label: string;
  gradient: string;
  bgGlow: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Card
      className={`border-0 shadow-md backdrop-blur-sm group hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${active ? 'bg-gradient-to-br ' + gradient + '/10 ring-2 ring-primary/40 shadow-lg scale-[1.03]' : 'bg-background/80'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm ${active ? 'shadow-lg scale-110' : ''} transition-transform`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {active ? (
            <X className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          )}
        </div>
        <p className={`text-2xl font-bold tracking-tight text-foreground`}>{value}</p>
        <p className={`text-[11px] font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tarea Card — Grid view
// ============================================================

function TareaCardModern({ tarea, schema, onClick }: {
  tarea: TareaItem;
  schema: FormSection[];
  onClick: () => void;
}) {
  const estadoConfig = getEstadoConfig(tarea.estado);
  const EstadoIcon = estadoConfig.icon;
  const prioridadColor = COLOR_MAP[tarea.prioridad] || COLOR_MAP[tarea.formData?.prioridadTarea || ''];

  // Get fecha from formData or fall back
  const fechaStr = tarea.formData?.fecha || tarea.fechaLimite || tarea.createdAt;
  const fecha = fechaStr
    ? new Date(fechaStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin fecha';

  const { filledCount, totalFields, completionPct } = useMemo(() => {
    let filled = 0;
    if (tarea.formData && typeof tarea.formData === 'object') {
      filled = Object.entries(tarea.formData).filter(([, v]) => v && String(v).trim() !== '').length;
    }
    let total = 0;
    schema.forEach(s => {
      total += s.fields.filter(f => f.type !== 'Show').length;
      s.subsections.forEach(sub => { total += sub.fields.filter(f => f.type !== 'Show').length; });
    });
    return { filledCount: filled, totalFields: total, completionPct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [tarea.formData, schema]);

  const progressColor = completionPct >= 80 ? 'text-teal-500' : completionPct >= 50 ? 'text-blue-500' : completionPct >= 20 ? 'text-amber-500' : 'text-gray-400';

  return (
    <Card
      className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background overflow-hidden"
      onClick={onClick}
    >
      <div className={`h-1.5 bg-gradient-to-r ${estadoConfig.gradient}`} />

      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${estadoConfig.bg} flex items-center justify-center shrink-0 border ${estadoConfig.border}`}>
            <EstadoIcon className={`h-5 w-5 ${estadoConfig.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate leading-tight">
              {tarea.centro?.nombre || tarea.centro?.codigo || 'Sin centro'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-muted-foreground font-mono">{tarea.centro?.codigo}</span>
              <CircleDot className="h-2.5 w-2.5 text-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground">{fecha}</span>
            </div>
          </div>
          <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border} text-[10px] font-semibold rounded-lg px-2 h-5`}>
            {estadoConfig.label}
          </Badge>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tarea.centro?.provincia && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <MapPin className="h-3 w-3" />
              {tarea.centro.provincia}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
            <User className="h-3 w-3" />
            {tarea.empleado?.name?.split(' ')[0]}
          </div>
          {tarea.tipo && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <ClipboardList className="h-3 w-3" />
              {tarea.tipo}
            </div>
          )}
          {/* Prioridad badge */}
          {(tarea.prioridad || tarea.formData?.prioridadTarea) && (() => {
            const prioridad = tarea.formData?.prioridadTarea || tarea.prioridad;
            const colorCfg = COLOR_MAP[prioridad];
            if (colorCfg) {
              return (
                <Badge className={`${colorCfg.bg} ${colorCfg.text} border ${colorCfg.border} text-[10px] font-semibold rounded-lg px-2 h-5`}>
                  <span className={`w-2 h-2 rounded-full ${colorCfg.dot} mr-1`} />
                  {prioridad}
                </Badge>
              );
            }
            return (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
                {prioridad}
              </div>
            );
          })()}
          {tarea.formData?.blackList === 'Sí' && (
            <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-semibold rounded-lg px-2 h-5">
              <Ban className="h-2.5 w-2.5 mr-0.5" />
              BL
            </Badge>
          )}
          {tarea.fotos && tarea.fotos.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <Camera className="h-3 w-3" />
              {tarea.fotos.length} fotos
            </div>
          )}
        </div>

        {/* Completion ring */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Completado</span>
              <span className={`text-[11px] font-bold ${progressColor}`}>{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  completionPct >= 80 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                  completionPct >= 50 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                  completionPct >= 20 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                  'bg-gray-300'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tarea Row — List view
// ============================================================

function TareaRowModern({ tarea, schema, onClick }: {
  tarea: TareaItem;
  schema: FormSection[];
  onClick: () => void;
}) {
  const estadoConfig = getEstadoConfig(tarea.estado);
  const EstadoIcon = estadoConfig.icon;

  const fechaStr = tarea.formData?.fecha || tarea.fechaLimite || tarea.createdAt;
  const fecha = fechaStr
    ? new Date(fechaStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin fecha';

  const { completionPct } = useMemo(() => {
    let filled = 0;
    if (tarea.formData && typeof tarea.formData === 'object') {
      filled = Object.entries(tarea.formData).filter(([, v]) => v && String(v).trim() !== '').length;
    }
    let total = 0;
    schema.forEach(s => {
      total += s.fields.filter(f => f.type !== 'Show').length;
      s.subsections.forEach(sub => { total += sub.fields.filter(f => f.type !== 'Show').length; });
    });
    return { completionPct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [tarea.formData, schema]);

  return (
    <Card
      className="group cursor-pointer border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 bg-background overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${estadoConfig.dot} animate-pulse`} />
              <div className={`w-2.5 h-2.5 rounded-full ${estadoConfig.dot} absolute inset-0 animate-ping opacity-30`} />
            </div>
            <div className={`w-10 h-10 rounded-xl ${estadoConfig.bg} flex items-center justify-center border ${estadoConfig.border}`}>
              <EstadoIcon className={`h-4.5 w-4.5 ${estadoConfig.text}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {tarea.centro?.nombre || tarea.centro?.codigo || 'Sin centro'}
              </h3>
              <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border} text-[10px] font-semibold rounded-md px-1.5 h-4`}>
                {estadoConfig.label}
              </Badge>
              {/* Prioridad badge */}
              {(() => {
                const prioridad = tarea.formData?.prioridadTarea || tarea.prioridad;
                const colorCfg = COLOR_MAP[prioridad];
                if (colorCfg) {
                  return (
                    <Badge className={`${colorCfg.bg} ${colorCfg.text} border ${colorCfg.border} text-[10px] font-semibold rounded-md px-1.5 h-4`}>
                      {prioridad}
                    </Badge>
                  );
                }
                return null;
              })()}
              {tarea.formData?.blackList === 'Sí' && (
                <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-semibold rounded-md px-1.5 h-4">
                  <Ban className="h-2.5 w-2.5 mr-0.5" />
                  BL
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="font-mono">{tarea.centro?.codigo}</span>
              <CircleDot className="h-2 w-2 text-muted-foreground/30" />
              <span>{fecha}</span>
              <CircleDot className="h-2 w-2 text-muted-foreground/30" />
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{tarea.empleado?.name?.split(' ')[0]}</span>
              {tarea.centro?.provincia && (
                <>
                  <CircleDot className="h-2 w-2 text-muted-foreground/30" />
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tarea.centro.provincia}</span>
                </>
              )}
              {tarea.tipo && (
                <>
                  <CircleDot className="h-2 w-2 text-muted-foreground/30" />
                  <span>{tarea.tipo}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className={`text-xs font-bold ${completionPct >= 80 ? 'text-teal-600' : completionPct >= 50 ? 'text-blue-600' : 'text-gray-400'}`}>
                {completionPct}%
              </span>
              <div className="w-20 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    completionPct >= 80 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tarea Detail Dialog
// ============================================================

function TareaDetailDialog({
  tarea,
  schema,
  expandedSections,
  onToggleSection,
  onClose,
  currentUser,
  onRefresh,
}: {
  tarea: TareaItem;
  schema: FormSection[];
  expandedSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  onClose: () => void;
  currentUser: { id: string; name: string; username: string; role: string } | null;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const estadoConfig = getEstadoConfig(tarea.estado);
  const EstadoIcon = estadoConfig.icon;
  const fechaStr = tarea.formData?.fecha || tarea.fechaLimite || tarea.createdAt;
  const fecha = fechaStr
    ? new Date(fechaStr).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : 'Sin fecha';
  const createdAt = tarea.createdAt ? new Date(tarea.createdAt).toLocaleString('es-ES') : '—';

  const formData: Record<string, string> = useMemo(() => {
    if (!tarea.formData) return {};
    if (typeof tarea.formData === 'string') {
      try { return JSON.parse(tarea.formData); } catch { return {}; }
    }
    return tarea.formData as Record<string, string>;
  }, [tarea.formData]);

  const getFieldValue = (key: string): string => {
    if (isEditing) return editFields[key] || '';
    return formData[key] || '';
  };

  const setEditFieldValue = (key: string, value: string) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  const enterEditMode = () => {
    setEditFields({ ...formData });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditFields({});
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tarea.id, fields: editFields }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      toast({ title: 'Tarea actualizada', description: 'Los cambios se han guardado correctamente.' });
      setIsEditing(false);
      setEditFields({});
      onRefresh();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al guardar los cambios', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tareas?id=${tarea.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      toast({ title: 'Tarea eliminada', description: 'La tarea ha sido eliminada permanentemente.' });
      setShowDeleteConfirm(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al eliminar la tarea', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getSectionFilledCount = (section: FormSection): { filled: number; total: number } => {
    let filled = 0;
    let total = 0;
    const countField = (f: FormField) => {
      if (f.type === 'Show') return;
      total++;
      const val = getFieldValue(f.key);
      if (val && val.trim() !== '') filled++;
    };
    section.fields.forEach(countField);
    section.subsections.forEach(sub => sub.fields.forEach(countField));
    return { filled, total };
  };

  const { totalFilled, totalFields } = useMemo(() => {
    let filled = 0;
    let total = 0;
    schema.forEach(section => {
      const s = getSectionFilledCount(section);
      filled += s.filled;
      total += s.total;
    });
    return { totalFilled: filled, totalFields: total };
  }, [schema, isEditing ? editFields : formData]);

  const totalPct = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;

  return (
    <Dialog open onOpenChange={() => { if (!isEditing) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* Hero header */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${estadoConfig.gradient}`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

          <div className="relative p-5 pb-4">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2.5 text-lg">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isEditing ? <Pencil className="h-4.5 w-4.5 text-white" /> : <Eye className="h-4.5 w-4.5 text-white" />}
                </div>
                {isEditing ? 'Editando Tarea' : 'Detalle de la Tarea'}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <EstadoIcon className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-white leading-tight">
                  {tarea.centro?.nombre || tarea.centro?.codigo}
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-[10px] rounded-lg">
                    {estadoConfig.label}
                  </Badge>
                  {tarea.tipo && (
                    <Badge className="bg-white/15 text-white/90 border-white/20 backdrop-blur-sm text-[10px] rounded-lg">
                      {tarea.tipo}
                    </Badge>
                  )}
                  {(() => {
                    const prioridad = formData.prioridadTarea || tarea.prioridad;
                    const colorCfg = COLOR_MAP[prioridad];
                    if (colorCfg) {
                      return (
                        <Badge className="bg-white/15 text-white/90 border-white/20 backdrop-blur-sm text-[10px] rounded-lg">
                          <span className={`w-2 h-2 rounded-full mr-1 ${colorCfg.dot}`} />
                          {prioridad}
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Admin action buttons */}
              {isAdmin && !isEditing && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={enterEditMode}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm h-8 gap-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500/80 hover:bg-red-600 text-white h-8 gap-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              )}
            </div>

            {/* Mini stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-white text-lg font-bold">{totalPct}%</p>
                <p className="text-white/70 text-[9px]">Completado</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-white text-lg font-bold">{totalFilled}</p>
                <p className="text-white/70 text-[9px]">Campos llenos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-white text-lg font-bold">{tarea.fotos?.length || 0}</p>
                <p className="text-white/70 text-[9px]">Fotos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-white text-lg font-bold">{totalFields - totalFilled}</p>
                <p className="text-white/70 text-[9px]">Vacíos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit mode action bar */}
        {isEditing && (
          <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Modo edición — Modifique los campos y guarde los cambios
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit} className="h-8 text-xs gap-1.5" disabled={isSaving}>
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit} className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        )}

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 mx-4 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">¿Eliminar tarea?</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Se eliminará permanentemente la tarea de <strong className="text-foreground">{tarea.centro?.nombre || tarea.centro?.codigo}</strong>, incluyendo todas sus fotografías asociadas.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="h-9">
                  Cancelar
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="h-9 gap-1.5">
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-7" style={{ maxHeight: `calc(92vh - ${isEditing ? '340px' : '280px'})` }}>
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={Building2} label="Código centro" value={tarea.centro?.codigo} />
            <MetaItem icon={User} label="Técnico" value={tarea.empleado?.name} />
            <MetaItem icon={Calendar} label="Fecha" value={fecha} />
            <MetaItem icon={MapPin} label="Provincia" value={tarea.centro?.provincia} />
            <MetaItem icon={ClipboardList} label="Tipo" value={tarea.tipo} />
            <MetaItem icon={Clock} label="Creado" value={createdAt} />
          </div>

          {/* Form data sections */}
          {Object.keys(formData).length > 0 && (
            <div>
              <SectionLabel icon={Layers} label="Secciones del Formulario" />
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {totalFilled} de {totalFields} campos rellenados ({totalPct}%)
              </p>

              {/* Global progress */}
              <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700"
                  style={{ width: `${totalPct}%` }}
                />
              </div>

              <div className="space-y-3">
                {schema.map((section) => {
                  const isExpanded = expandedSections[section.key] === true;
                  const { filled, total } = getSectionFilledCount(section);
                  const SectionIcon = getSectionIcon(section.icon);
                  const hasData = filled > 0;
                  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

                  return (
                    <div key={section.key} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${hasData ? 'border-border/60 shadow-sm bg-card' : 'border-border/20 opacity-40'}`}>
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => onToggleSection(section.key)}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasData ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          <SectionIcon className={`h-4.5 w-4.5 ${hasData ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground">{section.label}</span>
                          {hasData && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 max-w-[120px] h-1.5 bg-muted/60 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 80 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                                    pct >= 50 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                                    'bg-gradient-to-r from-amber-400 to-orange-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground">{pct}%</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className={`text-[11px] rounded-lg px-2.5 h-6 ${hasData ? 'bg-teal-50 text-teal-700 font-semibold' : 'bg-muted text-muted-foreground'}`}>
                          {filled}/{total}
                        </Badge>
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-border/20">
                          <div className="space-y-2.5">
                            {section.fields.map(field => (
                              <FieldValueModern
                                key={field.key}
                                field={field}
                                value={getFieldValue(field.key)}
                                isEditing={isEditing}
                                onEdit={(val) => setEditFieldValue(field.key, val)}
                              />
                            ))}
                          </div>

                          {section.subsections.map(sub => (
                            <div key={sub.key} className="mt-5 ml-1">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-primary/30 rounded-full" />
                                <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">{sub.label}</p>
                              </div>
                              <div className="space-y-2.5">
                                {sub.fields.map(field => (
                                  <FieldValueModern
                                    key={field.key}
                                    field={field}
                                    value={getFieldValue(field.key)}
                                    isEditing={isEditing}
                                    onEdit={(val) => setEditFieldValue(field.key, val)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          {tarea.fotos && tarea.fotos.length > 0 && (
            <div>
              <SectionLabel icon={Camera} label={`Fotografías (${tarea.fotos.length})`} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {tarea.fotos.map((foto, idx) => (
                  <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-border/30 shadow-sm">
                    <img
                      src={foto.fotoBase64.startsWith('data:') ? foto.fotoBase64 : `data:image/jpeg;base64,${foto.fotoBase64}`}
                      alt={foto.descripcion || `Foto ${idx + 1}`}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {(foto.descripcion || foto.categoria) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                        <p className="text-white text-[10px] font-medium truncate">
                          {foto.descripcion || foto.categoria}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Section label
// ============================================================

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{label}</h3>
    </div>
  );
}

// ============================================================
// Meta Item
// ============================================================

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="bg-muted/30 rounded-xl p-3.5 border border-border/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-primary/70" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-sm text-foreground font-semibold truncate">{value}</p>
    </div>
  );
}

// ============================================================
// Field Value Modern
// ============================================================

function FieldValueModern({ field, value, isEditing, onEdit }: { field: FormField; value: string; isEditing?: boolean; onEdit?: (val: string) => void }) {
  const isFilled = !!value && value.trim() !== '';
  const isImage = field.type === 'Image' || field.type === 'Photo';
  const isShow = field.type === 'Show';
  const isColor = field.type === 'Color';

  if (isShow) {
    return (
      <div className="py-2 px-3 rounded-xl text-sm bg-muted/20 border border-border/10">
        <span className="text-muted-foreground italic">{field.label}</span>
      </div>
    );
  }

  // Color field — show as colored badge
  if (isColor && isFilled) {
    const colorCfg = COLOR_MAP[value];
    if (colorCfg) {
      return (
        <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm ${colorCfg.bg} border ${colorCfg.border}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorCfg.bg}`}>
            <span className={`w-3 h-3 rounded-full ${colorCfg.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">{field.label}</p>
            <p className={`text-sm font-semibold ${colorCfg.text}`}>{value}</p>
          </div>
        </div>
      );
    }
  }

  // Image fields
  if (isImage && isFilled) {
    const imgSrc = value.startsWith('data:') ? value
      : value.startsWith('/api/') ? value
      : value.startsWith('http') ? value
      : value.length > 20 ? `data:image/jpeg;base64,${value}`
      : '';

    return (
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm bg-primary/5 border border-primary/10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Camera className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-foreground font-medium">{field.label}</span>
        </div>
        {imgSrc && (
          <Badge className="bg-green-100 text-green-700 text-[10px] rounded-lg px-2 h-5 border-0 font-semibold">Foto</Badge>
        )}
      </div>
    );
  }

  // Editable mode
  if (isEditing && onEdit) {
    if (isShow || isImage) return null;

    // Color type — show selectable buttons
    if (isColor) {
      const colorOptions = ['Baja', 'Media', 'Alta', 'Urgente'];
      return (
        <div className="py-1.5 px-3 rounded-xl text-sm border border-primary/20 bg-primary/5">
          <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1.5">{field.label}</p>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((opt) => {
              const colorCfg = COLOR_MAP[opt];
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onEdit(opt)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected && colorCfg
                      ? `${colorCfg.bg} ${colorCfg.text} ${colorCfg.border}`
                      : 'bg-card text-muted-foreground border-border'
                  }`}
                >
                  {colorCfg && <span className={`w-2 h-2 rounded-full inline-block mr-1 ${colorCfg.dot}`} />}
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Enum type
    if (field.type === 'Enum' && field.options) {
      const hasMatch = !value || field.options.includes(value);
      return (
        <div className="py-1.5 px-3 rounded-xl text-sm border border-primary/20 bg-primary/5">
          <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1.5">{field.label}</p>
          {hasMatch ? (
            <Select value={value || undefined} onValueChange={(v) => onEdit(v)}>
              <SelectTrigger className="h-9 text-sm border-primary/20">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-1.5">
              <Input value={value} onChange={(e) => onEdit(e.target.value)} className="h-9 text-sm flex-1" />
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 text-xs" onClick={() => onEdit('')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // LongText
    if (field.type === 'LongText') {
      return (
        <div className="py-1.5 px-3 rounded-xl text-sm border border-primary/20 bg-primary/5">
          <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1.5">{field.label}</p>
          <Textarea value={value} onChange={(e) => onEdit(e.target.value)} rows={2} className="text-sm resize-none" />
        </div>
      );
    }

    // Default editable fields
    return (
      <div className="py-1.5 px-3 rounded-xl text-sm border border-primary/20 bg-primary/5">
        <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1.5">{field.label}</p>
        <Input
          type={field.type === 'Number' || field.type === 'Decimal' ? 'number' : field.type === 'Date' ? 'date' : field.type === 'Phone' ? 'tel' : 'text'}
          step={field.type === 'Decimal' ? '0.01' : undefined}
          value={value}
          onChange={(e) => onEdit(e.target.value)}
          placeholder="Sin datos"
          className="h-9 text-sm"
        />
      </div>
    );
  }

  // Normal fields — read mode
  const FieldIcon = FIELD_TYPE_ICONS[field.type] || FileText;

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm transition-colors ${isFilled ? 'bg-primary/5 border border-primary/10' : 'border border-transparent hover:bg-muted/20'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isFilled ? 'bg-primary/10' : 'bg-muted/40'}`}>
        <FieldIcon className={`h-3.5 w-3.5 ${isFilled ? 'text-primary/70' : 'text-muted-foreground/50'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] uppercase tracking-wide font-medium ${isFilled ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>{field.label}</p>
        {isFilled ? (
          <p className="text-sm text-foreground font-medium truncate mt-0.5" title={value}>
            {value.length > 60 ? value.substring(0, 60) + '...' : value}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/30 mt-0.5">Sin datos</p>
        )}
      </div>
    </div>
  );
}
