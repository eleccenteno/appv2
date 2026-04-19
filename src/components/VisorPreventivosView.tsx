
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useSchemaStore } from '@/lib/schema-store';
import { apiFetch } from '@/lib/api-client';
import { FormSection, FormField, cloneSections } from '@/lib/preventivo-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import {
  ArrowLeft, Search, Filter, Eye, Calendar, MapPin, User, Building2,
  ChevronDown, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2,
  FileText, Zap, Wifi, Battery, Thermometer, Gamepad2, Sun, Radio,
  Link2, X, Image, Camera, ClipboardList,
  Shield, Wind, Sparkles, Hash, Phone, MapPinned,
  TrendingUp, Layers, Activity, BarChart3, ArrowUpRight,
  CircleDot, ZapOff, Send, FilePen, Users, Pencil, Trash2,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface PreventivoItem {
  id: string;
  procedimiento: string;
  fecha: string;
  tipoSuministro: string | null;
  contadorVistaGeneral: string | null;
  contadorCaja: string | null;
  contadorFusibles: string | null;
  parcelaEdificio: string | null;
  observaciones: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: string;
  tecnicoId: string;
  centroId: string;
  formData: Record<string, string> | null;
  tecnico: { id: string; name: string; username: string; role: string };
  centro: {
    id: string; codigo: string; nombre: string; ciudad: string | null; provincia: string | null;
    empresa: { id: string; nombre: string } | null;
    subEmpresa: { id: string; nombre: string } | null;
  };
  fotos: { id: string; fotoBase64: string; descripcion: string | null; categoria: string | null }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Icon mapping
// ============================================================

const SECTION_ICONS: Record<string, React.ElementType> = {
  FileText, Zap, Wifi, Battery, Thermometer, Building2,
  Gamepad2, Radio, Link: Link2, Sun, Shield, Wind, Sparkles, ClipboardList,
  TowerControl: Building2, Bird: Building2, Users: Building2, CircuitBoard: Zap,
};

function getSectionIcon(iconName: string): React.ElementType {
  return SECTION_ICONS[iconName] || FileText;
}

const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
  Text: FileText, Number: Hash, Decimal: Hash, Enum: ChevronDown,
  EnumList: ClipboardList, LongText: FileText, Phone: Phone,
  Date: Calendar, LatLong: MapPinned, Image: Camera, Photo: Camera,
  Show: Eye, Ref: Link2,
};

// ============================================================
// Status helpers — modern palette
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
    case 'pendiente':
      return {
        label: 'Pendiente',
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        dot: 'bg-amber-400',
        icon: Clock,
      };
    case 'en_progreso':
      return {
        label: 'En Progreso',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        dot: 'bg-blue-400',
        icon: Activity,
      };
    case 'completado':
      return {
        label: 'Completado',
        gradient: 'from-teal-500 to-emerald-500',
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/50',
        dot: 'bg-teal-400',
        icon: CheckCircle2,
      };
    case 'enviado':
      return {
        label: 'Enviado',
        gradient: 'from-green-500 to-lime-500',
        bg: 'bg-green-50 dark:bg-green-950/40',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800/50',
        dot: 'bg-green-400',
        icon: Send,
      };
    case 'borrador':
      return {
        label: 'Borrador',
        gradient: 'from-gray-400 to-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-800/40',
        text: 'text-gray-600 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700/50',
        dot: 'bg-gray-400',
        icon: FilePen,
      };
    default:
      return {
        label: estado,
        gradient: 'from-gray-400 to-gray-500',
        bg: 'bg-gray-50 dark:bg-gray-800/40',
        text: 'text-gray-600 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700/50',
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

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      {/* Background ring */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/50" />
      {/* Segments */}
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * circumference : 0;
        const cumulativeOffset = segments.slice(0, i).reduce((acc, s) => acc + (total > 0 ? (s.value / total) * circumference : 0), 0);
        const dashArray = `${pct} ${circumference - pct}`;
        const dashOffset = -cumulativeOffset;
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

export default function VisorPreventivosView() {
  const { goBack, currentUser } = useAppStore();
  const schemaStore = useSchemaStore();

  const [preventivos, setPreventivos] = useState<PreventivoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterProvincia, setFilterProvincia] = useState<string>('todos');
  const [filterTecnico, setFilterTecnico] = useState<string>('todos');
  const [selectedPreventivo, setSelectedPreventivo] = useState<PreventivoItem | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => { schemaStore.loadSchema(); }, []);
  const schema = schemaStore.getSchema();

  // Fetch preventivos
  const fetchPreventivos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado && filterEstado !== 'todos') params.set('estado', filterEstado);
      const res = await apiFetch(`/api/preventivos?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar preventivos');
      const data = await res.json();
      setPreventivos(data.preventivos || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los preventivos');
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { fetchPreventivos(); }, [fetchPreventivos]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    preventivos.forEach(p => { if (p.fecha) years.add(new Date(p.fecha).getFullYear()); });
    return Array.from(years).sort((a, b) => b - a);
  }, [preventivos]);

  // Available provinces
  const availableProvincias = useMemo(() => {
    const provs = new Set<string>();
    preventivos.forEach(p => { if (p.centro?.provincia) provs.add(p.centro.provincia); });
    return Array.from(provs).sort();
  }, [preventivos]);

  // Available technicians
  const availableTecnicos = useMemo(() => {
    const techs = new Map<string, string>();
    preventivos.forEach(p => {
      if (p.tecnico?.id && p.tecnico?.name) {
        techs.set(p.tecnico.id, p.tecnico.name);
      }
    });
    return Array.from(techs.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [preventivos]);

  // Filter
  const filtered = useMemo(() => {
    let result = preventivos;
    if (filterProvincia && filterProvincia !== 'todos') {
      result = result.filter(p => p.centro?.provincia === filterProvincia);
    }
    if (filterTecnico && filterTecnico !== 'todos') {
      result = result.filter(p => p.tecnico?.id === filterTecnico);
    }
    if (filterYear && filterYear !== 'todos') {
      const year = parseInt(filterYear);
      result = result.filter(p => p.fecha && new Date(p.fecha).getFullYear() === year);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.centro?.codigo?.toLowerCase().includes(q) ||
        p.centro?.nombre?.toLowerCase().includes(q) ||
        p.centro?.ciudad?.toLowerCase().includes(q) ||
        p.centro?.provincia?.toLowerCase().includes(q) ||
        p.tecnico?.name?.toLowerCase().includes(q) ||
        p.procedimiento?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [preventivos, searchQuery, filterYear, filterProvincia, filterTecnico]);

  // Stats
  const stats = useMemo(() => {
    const countByEstado: Record<string, number> = {};
    preventivos.forEach(p => { countByEstado[p.estado] = (countByEstado[p.estado] || 0) + 1; });
    return {
      total: preventivos.length,
      pendiente: countByEstado['pendiente'] || 0,
      completado: countByEstado['completado'] || 0,
      enviado: countByEstado['enviado'] || 0,
      borrador: countByEstado['borrador'] || 0,
      en_progreso: countByEstado['en_progreso'] || 0,
    };
  }, [preventivos]);



  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const donutSegments = [
    { value: stats.completado, color: '#14b8a6' },
    { value: stats.enviado, color: '#22c55e' },
    { value: stats.en_progreso, color: '#3b82f6' },
    { value: stats.pendiente, color: '#f59e0b' },
    { value: stats.borrador, color: '#9ca3af' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {/* Decorative circles */}
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
                Visor de Preventivos
              </h1>
              <p className="text-sm text-muted-foreground mt-1 ml-12">
                {filtered.length} de {stats.total} partes preventivos
              </p>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
            {/* Total with donut */}
            <Card className="col-span-2 sm:col-span-1 border-0 shadow-md bg-background/80 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <MiniDonut segments={donutSegments} size={52} />
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{stats.total}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Total</p>
                </div>
              </CardContent>
            </Card>

            {/* Completados */}
            <StatCard
              icon={CheckCircle2}
              value={stats.completado}
              label="Completados"
              gradient="from-teal-500 to-emerald-500"
              bgGlow="bg-teal-500/10"
            />
            {/* Enviados */}
            <StatCard
              icon={Send}
              value={stats.enviado}
              label="Enviados"
              gradient="from-green-500 to-lime-500"
              bgGlow="bg-green-500/10"
            />
            {/* En Progreso */}
            <StatCard
              icon={Activity}
              value={stats.en_progreso}
              label="En Progreso"
              gradient="from-blue-500 to-cyan-500"
              bgGlow="bg-blue-500/10"
            />
            {/* Pendientes */}
            <StatCard
              icon={Clock}
              value={stats.pendiente}
              label="Pendientes"
              gradient="from-amber-500 to-orange-500"
              bgGlow="bg-amber-500/10"
            />
            {/* Borradores */}
            <StatCard
              icon={FilePen}
              value={stats.borrador}
              label="Borradores"
              gradient="from-gray-400 to-gray-500"
              bgGlow="bg-gray-500/10"
            />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          {/* Row 1: Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar centro, técnico, procedimiento..."
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
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium">Cargando preventivos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-400 dark:text-red-500" />
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl"
              onClick={() => fetchPreventivos()}>
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {searchQuery || filterEstado !== 'todos' || filterYear !== 'todos' || filterProvincia !== 'todos' || filterTecnico !== 'todos'
                ? 'No se encontraron preventivos con los filtros aplicados'
                : 'No hay preventivos registrados todavía'}
            </p>
            {(searchQuery || filterEstado !== 'todos' || filterYear !== 'todos' || filterProvincia !== 'todos' || filterTecnico !== 'todos') && (
              <Button variant="ghost" size="sm" className="mt-3 rounded-xl"
                onClick={() => { setSearchQuery(''); setFilterEstado('todos'); setFilterYear('todos'); setFilterProvincia('todos'); setFilterTecnico('todos'); }}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(prev => (
              <PreventivoCardModern
                key={prev.id}
                preventivo={prev}
                schema={schema}
                onClick={() => setSelectedPreventivo(prev)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(prev => (
              <PreventivoRowModern
                key={prev.id}
                preventivo={prev}
                schema={schema}
                onClick={() => setSelectedPreventivo(prev)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Mostrando {filtered.length} de {stats.total} preventivos
            </p>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedPreventivo && (
        <PreventivoDetailDialog
          preventivo={selectedPreventivo}
          schema={schema}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          onClose={() => setSelectedPreventivo(null)}
          currentUser={currentUser}
          onRefresh={fetchPreventivos}
        />
      )}
    </div>
  );
}

// ============================================================
// Stat Card
// ============================================================

function StatCard({ icon: Icon, value, label, gradient, bgGlow }: {
  icon: React.ElementType;
  value: number;
  label: string;
  gradient: string;
  bgGlow: string;
}) {
  return (
    <Card className="border-0 shadow-md bg-background/80 backdrop-blur-sm group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Preventivo Card — Grid view (modern card design)
// ============================================================

function PreventivoCardModern({ preventivo, schema, onClick }: {
  preventivo: PreventivoItem;
  schema: FormSection[];
  onClick: () => void;
}) {
  const estadoConfig = getEstadoConfig(preventivo.estado);
  const EstadoIcon = estadoConfig.icon;
  const fecha = preventivo.fecha ? new Date(preventivo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';

  const { filledCount, totalFields, completionPct } = useMemo(() => {
    let filled = 0;
    if (preventivo.formData && typeof preventivo.formData === 'object') {
      filled = Object.entries(preventivo.formData).filter(([, v]) => v && String(v).trim() !== '').length;
    }
    let total = 0;
    schema.forEach(s => {
      total += s.fields.filter(f => f.type !== 'Show').length;
      s.subsections.forEach(sub => { total += sub.fields.filter(f => f.type !== 'Show').length; });
    });
    return { filledCount: filled, totalFields: total, completionPct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [preventivo.formData, schema]);

  // Progress color
  const progressColor = completionPct >= 80 ? 'text-teal-500' : completionPct >= 50 ? 'text-blue-500' : completionPct >= 20 ? 'text-amber-500' : 'text-gray-400';

  return (
    <Card
      className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background overflow-hidden"
      onClick={onClick}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${estadoConfig.gradient}`} />

      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-11 h-11 rounded-xl ${estadoConfig.bg} flex items-center justify-center shrink-0 border ${estadoConfig.border}`}>
            <EstadoIcon className={`h-5 w-5 ${estadoConfig.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate leading-tight">
              {preventivo.centro?.nombre || preventivo.centro?.codigo || 'Sin centro'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-muted-foreground font-mono">{preventivo.centro?.codigo}</span>
              <CircleDot className="h-2.5 w-2.5 text-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground">{fecha}</span>
            </div>
          </div>
          {/* Status badge */}
          <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border} text-[10px] font-semibold rounded-lg px-2 h-5`}>
            {estadoConfig.label}
          </Badge>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {preventivo.centro?.provincia && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <MapPin className="h-3 w-3" />
              {preventivo.centro.provincia}
            </div>
          )}
          {preventivo.centro?.ciudad && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <Building2 className="h-3 w-3" />
              {preventivo.centro.ciudad}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
            <User className="h-3 w-3" />
            {preventivo.tecnico?.name?.split(' ')[0]}
          </div>
          {preventivo.fotos && preventivo.fotos.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-0.5">
              <Camera className="h-3 w-3" />
              {preventivo.fotos.length} fotos
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
// Preventivo Row — List view (modern row design)
// ============================================================

function PreventivoRowModern({ preventivo, schema, onClick }: {
  preventivo: PreventivoItem;
  schema: FormSection[];
  onClick: () => void;
}) {
  const estadoConfig = getEstadoConfig(preventivo.estado);
  const EstadoIcon = estadoConfig.icon;
  const fecha = preventivo.fecha ? new Date(preventivo.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';

  const { filledCount, totalFields, completionPct } = useMemo(() => {
    let filled = 0;
    if (preventivo.formData && typeof preventivo.formData === 'object') {
      filled = Object.entries(preventivo.formData).filter(([, v]) => v && String(v).trim() !== '').length;
    }
    let total = 0;
    schema.forEach(s => {
      total += s.fields.filter(f => f.type !== 'Show').length;
      s.subsections.forEach(sub => { total += sub.fields.filter(f => f.type !== 'Show').length; });
    });
    return { filledCount: filled, totalFields: total, completionPct: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [preventivo.formData, schema]);

  return (
    <Card
      className="group cursor-pointer border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 bg-background overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Left: Status dot + icon */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${estadoConfig.dot} animate-pulse`} />
              <div className={`w-2.5 h-2.5 rounded-full ${estadoConfig.dot} absolute inset-0 animate-ping opacity-30`} />
            </div>
            <div className={`w-10 h-10 rounded-xl ${estadoConfig.bg} flex items-center justify-center border ${estadoConfig.border}`}>
              <EstadoIcon className={`h-4.5 w-4.5 ${estadoConfig.text}`} />
            </div>
          </div>

          {/* Center: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {preventivo.centro?.nombre || preventivo.centro?.codigo || 'Sin centro'}
              </h3>
              <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border} text-[10px] font-semibold rounded-md px-1.5 h-4`}>
                {estadoConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="font-mono">{preventivo.centro?.codigo}</span>
              <CircleDot className="h-2 w-2 text-muted-foreground/30" />
              <span>{fecha}</span>
              <CircleDot className="h-2 w-2 text-muted-foreground/30" />
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{preventivo.tecnico?.name?.split(' ')[0]}</span>
              {preventivo.centro?.provincia && (
                <>
                  <CircleDot className="h-2 w-2 text-muted-foreground/30" />
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{preventivo.centro.provincia}</span>
                </>
              )}
              {preventivo.centro?.ciudad && (
                <>
                  <CircleDot className="h-2 w-2 text-muted-foreground/30" />
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{preventivo.centro.ciudad}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Completion + arrow */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Mini completion */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className={`text-xs font-bold ${completionPct >= 80 ? 'text-teal-600' : completionPct >= 50 ? 'text-blue-600' : completionPct >= 20 ? 'text-amber-600' : 'text-gray-400'}`}>
                {completionPct}%
              </span>
              <div className="w-20 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    completionPct >= 80 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                    completionPct >= 50 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
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
// Preventivo Detail Dialog — full modern redesign
// ============================================================

function PreventivoDetailDialog({
  preventivo,
  schema,
  expandedSections,
  onToggleSection,
  onClose,
  currentUser,
  onRefresh,
}: {
  preventivo: PreventivoItem;
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

  const estadoConfig = getEstadoConfig(preventivo.estado);
  const EstadoIcon = estadoConfig.icon;
  const fecha = preventivo.fecha
    ? new Date(preventivo.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : 'Sin fecha';
  const createdAt = preventivo.createdAt ? new Date(preventivo.createdAt).toLocaleString('es-ES') : '—';

  const formData: Record<string, string> = useMemo(() => {
    if (!preventivo.formData) return {};
    if (typeof preventivo.formData === 'string') {
      try { return JSON.parse(preventivo.formData); } catch { return {}; }
    }
    return preventivo.formData as Record<string, string>;
  }, [preventivo.formData]);

  const getFieldValue = (key: string): string => {
    if (isEditing) return editFields[key] || '';
    return formData[key] || '';
  };

  const setEditFieldValue = (key: string, value: string) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };

  // Initialize edit fields when entering edit mode
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
      const res = await apiFetch('/api/preventivos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: preventivo.id, fields: editFields }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      toast({ title: 'Preventivo actualizado', description: 'Los cambios se han guardado correctamente.' });
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
      const res = await apiFetch(`/api/preventivos?id=${preventivo.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      toast({ title: 'Preventivo eliminado', description: 'El preventivo ha sido eliminado permanentemente.' });
      setShowDeleteConfirm(false);
      onClose();
      onRefresh();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error al eliminar el preventivo', variant: 'destructive' });
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

  // Count filled vs total for header
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
        {/* Compact header */}
        <div className={`${estadoConfig.bg} border-b ${estadoConfig.border}`}>
          <div className="px-5 py-3">
            {/* Title row */}
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${estadoConfig.gradient} flex items-center justify-center shadow-sm`}>
                    {isEditing ? <Pencil className="h-4 w-4 text-white" /> : <Eye className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-foreground font-semibold text-sm">{isEditing ? 'Editando Preventivo' : 'Detalle del Preventivo'}</span>
                </div>
                {/* Admin action buttons */}
                {isAdmin && !isEditing && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={enterEditMode}
                      className="h-7 gap-1.5 text-[11px] px-2.5"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="h-7 gap-1.5 text-[11px] px-2.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>

            {/* Center info row */}
            <div className="mt-2.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${estadoConfig.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <EstadoIcon className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-sm text-foreground leading-tight truncate">
                  {preventivo.centro?.nombre || preventivo.centro?.codigo}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border} text-[10px] font-semibold rounded-md px-2 h-5`}>
                    {estadoConfig.label}
                  </Badge>
                  {preventivo.procedimiento && (
                    <Badge variant="secondary" className="text-[10px] rounded-md px-2 h-5">
                      {preventivo.procedimiento}
                    </Badge>
                  )}
                  {preventivo.centro?.subEmpresa && (
                    <Badge variant="outline" className="text-[10px] rounded-md px-2 h-5">
                      {preventivo.centro.subEmpresa.nombre}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Completado</span>
                  <span className="font-bold text-foreground">{totalPct}%</span>
                </div>
                <div className="w-px h-3 bg-border/50" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                  <span className="text-muted-foreground">Campos</span>
                  <span className="font-bold text-foreground">{totalFilled}/{totalFields}</span>
                </div>
                {preventivo.fotos && preventivo.fotos.length > 0 && (
                  <>
                    <div className="w-px h-3 bg-border/50" />
                    <div className="flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Fotos</span>
                      <span className="font-bold text-foreground">{preventivo.fotos.length}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{fecha}</span>
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
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">¿Eliminar preventivo?</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Se eliminará permanentemente el preventivo de <strong className="text-foreground">{preventivo.centro?.nombre || preventivo.centro?.codigo}</strong> del día <strong className="text-foreground">{preventivo.fecha ? new Date(preventivo.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}</strong>, incluyendo todas sus fotografías asociadas.
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
        <div className="overflow-y-auto custom-scrollbar p-5 space-y-5" style={{ maxHeight: `calc(92vh - ${isEditing ? '190px' : '140px'})` }}>
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={Building2} label="Código centro" value={preventivo.centro?.codigo} />
            <MetaItem icon={User} label="Técnico" value={preventivo.tecnico?.name} />
            <MetaItem icon={Calendar} label="Fecha" value={fecha} />
            <MetaItem icon={MapPin} label="Ciudad" value={preventivo.centro?.ciudad} />
            {preventivo.latitud && preventivo.longitud && (
              <MetaItem icon={MapPinned} label="Coordenadas"
                value={`${preventivo.latitud.toFixed(4)}, ${preventivo.longitud.toFixed(4)}`} />
            )}
            <MetaItem icon={Clock} label="Creado" value={createdAt} />
          </div>

          {/* Basic data */}
          {(preventivo.tipoSuministro || preventivo.contadorVistaGeneral || preventivo.contadorCaja || preventivo.contadorFusibles || preventivo.parcelaEdificio) && (
            <div>
              <SectionLabel icon={Zap} label="Datos del Preventivo" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                {preventivo.tipoSuministro && <MetaItem icon={Zap} label="Tipo Suministro" value={preventivo.tipoSuministro} />}
                {preventivo.contadorVistaGeneral && <MetaItem icon={FileText} label="Contador Vista" value={preventivo.contadorVistaGeneral} />}
                {preventivo.contadorCaja && <MetaItem icon={FileText} label="Contador Caja" value={preventivo.contadorCaja} />}
                {preventivo.contadorFusibles && <MetaItem icon={FileText} label="Contador Fusibles" value={preventivo.contadorFusibles} />}
                {preventivo.parcelaEdificio && <MetaItem icon={Building2} label="Parcela/Edificio" value={preventivo.parcelaEdificio} />}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {preventivo.observaciones && (
            <div>
              <SectionLabel icon={FileText} label="Observaciones" />
              <div className="mt-3 bg-muted/40 rounded-xl p-4 border border-border/30">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {preventivo.observaciones}
                </p>
              </div>
            </div>
          )}

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
                      {/* Section header */}
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
                        <Badge variant="secondary" className={`text-[11px] rounded-lg px-2.5 h-6 ${hasData ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold' : 'bg-muted text-muted-foreground'}`}>
                          {filled}/{total}
                        </Badge>
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>

                      {/* Section content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-border/20">
                          {/* Main fields */}
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

                          {/* Subsections */}
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
          {preventivo.fotos && preventivo.fotos.length > 0 && (
            <div>
              <SectionLabel icon={Camera} label={`Fotografías (${preventivo.fotos.length})`} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {preventivo.fotos.map((foto, idx) => (
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
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">{label}</h3>
    </div>
  );
}

// ============================================================
// Meta Item — clean info display
// ============================================================

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="bg-muted/30 rounded-lg p-2.5 border border-border/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-primary/70" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-xs text-foreground font-semibold truncate">{value}</p>
    </div>
  );
}

// ============================================================
// Field Value Modern — spacious data display
// ============================================================

function FieldValueModern({ field, value, isEditing, onEdit }: { field: FormField; value: string; isEditing?: boolean; onEdit?: (val: string) => void }) {
  const isFilled = !!value && value.trim() !== '';
  const isImage = field.type === 'Image' || field.type === 'Photo';
  const isShow = field.type === 'Show';

  // Show fields — display as informational text
  if (isShow) {
    return (
      <div className="py-2 px-3 rounded-xl text-sm bg-muted/20 border border-border/10">
        <span className="text-muted-foreground italic">{field.label}</span>
      </div>
    );
  }

  // Image fields — not editable in visor
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

  // Editable mode — show Input for Text/Number/Decimal/Phone/Date fields
  if (isEditing && onEdit) {
    // Skip Show and Image types
    if (isShow || isImage) return null;

    // Enum type — show Select
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
              <Input
                value={value}
                onChange={(e) => onEdit(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 text-xs" onClick={() => onEdit('')}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // LongText — Textarea
    if (field.type === 'LongText') {
      return (
        <div className="py-1.5 px-3 rounded-xl text-sm border border-primary/20 bg-primary/5">
          <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1.5">{field.label}</p>
          <Textarea
            value={value}
            onChange={(e) => onEdit(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>
      );
    }

    // Default editable fields (Text, Number, Decimal, Phone, Date, etc.)
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

  // Normal fields — label + value layout (read mode)
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
