'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  X,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database,
  BarChart3,
  TableIcon,
  LayoutGrid,
  Columns3,
  RotateCcw,
  Save,
  FolderOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Zap,
  Thermometer,
  Building2,
  Wifi,
  TreePine,
  Link2,
  Radio,
  Sun,
  ChevronLeft,
  Eye,
  Layers,
  CircleDot,
  Plus,
  Trash2,
  FileDown,
  FileType,
  Table2,
} from 'lucide-react';
import {
  exportToExcel,
  exportToPDF,
  exportToWord,
  exportToCSV,
  type ExportField,
  type ExportCentro,
} from '@/lib/centros-export';

// ─── Types ──────────────────────────────────────────────────────

interface SectionConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  columns: ColumnConfig[];
}

interface ColumnConfig {
  index: number;
  key: string;
  label: string;
  type: string;
  options?: string[];
}

interface CentroData {
  [sectionKey: string]: Record<string, string> | string;
  nombre: string;
  codigo: string;
  provincia: string;
  prioridad: string;
  proyecto: string;
  tipo_centro: string;
  localizacion: string;
}

interface ActiveFilter {
  id: string;
  sectionKey: string;
  fieldKey: string;
  fieldLabel: string;
  values: string[];
}

interface FilterPreset {
  name: string;
  filters: ActiveFilter[];
  searchText: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

// ─── Constants ──────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  general: <Database className="h-4 w-4" />,
  suministro_electrico: <Zap className="h-4 w-4" />,
  remota: <Wifi className="h-4 w-4" />,
  evcc: <BatteryIcon className="h-4 w-4" />,
  aa: <Thermometer className="h-4 w-4" />,
  torre: <Building2 className="h-4 w-4" />,
  gamesystem: <Layers className="h-4 w-4" />,
  nidos: <TreePine className="h-4 w-4" />,
  infraestructura: <MapPin className="h-4 w-4" />,
  coubicados: <CircleDot className="h-4 w-4" />,
  cuadro_electrico: <Zap className="h-4 w-4" />,
  enlaces: <Link2 className="h-4 w-4" />,
  sigfox: <Radio className="h-4 w-4" />,
  fotovoltaica: <Sun className="h-4 w-4" />,
};

function BatteryIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
      <line x1="22" x2="22" y1="11" y2="13" />
      <line x1="6" x2="6" y1="11" y2="13" />
      <line x1="10" x2="10" y1="11" y2="13" />
      <line x1="14" x2="14" y1="11" y2="13" />
    </svg>
  );
}

const PAGE_SIZE = 50;

const PRIORIDAD_COLORS: Record<string, string> = {
  P1: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  P2: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  P3: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  'P3 AIRE': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

const TIPO_CENTRO_COLORS: Record<string, string> = {
  INDOOR: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  OUTDOOR: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
};

// ─── Main Component ─────────────────────────────────────────────

export default function CentrosSearchView() {
  const { currentUser, setCurrentView } = useAppStore();
  const { toast } = useToast();

  // Data state
  const [centros, setCentros] = useState<CentroData[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });

  // UI state
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [detailCentro, setDetailCentro] = useState<CentroData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // ─── Load Data ────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      try {
        const [centrosRes, sectionsRes] = await Promise.all([
          fetch('/datos_centros_atw.json'),
          fetch('/sections_config.json'),
        ]);
        const centrosData = await centrosRes.json();
        const sectionsData = await sectionsRes.json();

        setCentros(centrosData.centros || []);
        setSections(sectionsData || []);

        // Set default visible columns
        const defaultCols = ['nombre', 'codigo', 'provincia', 'prioridad', 'proyecto', 'tipo_centro'];
        // Add key enum fields from sections
        const enumCols: string[] = [];
        (sectionsData || []).forEach((s: SectionConfig) => {
          (s.columns || []).forEach((col: ColumnConfig) => {
            if ((col.type === 'Enum' || col.type === 'EnumList') && enumCols.length < 14) {
              enumCols.push(`${s.key}.${col.key}`);
            }
          });
        });
        setSelectedColumns([...defaultCols, ...enumCols]);

        // Load presets from localStorage
        try {
          const saved = localStorage.getItem('centros_search_presets');
          if (saved) setPresets(JSON.parse(saved));
        } catch {}
      } catch (error) {
        console.error('Error loading data:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  // ─── Computed: Filter options ─────────────────────────────────

  const filterOptions = useMemo(() => {
    const options: Record<string, { label: string; values: string[]; sectionKey: string; sectionLabel: string }> = {};

    // Top-level fields
    options['nombre'] = { label: 'Nombre', values: [], sectionKey: '_top', sectionLabel: 'General' };
    options['codigo'] = { label: 'Código', values: [], sectionKey: '_top', sectionLabel: 'General' };
    options['provincia'] = { label: 'Provincia', values: [...new Set(centros.map(c => c.provincia).filter(Boolean))].sort(), sectionKey: '_top', sectionLabel: 'General' };
    options['prioridad'] = { label: 'Prioridad', values: [...new Set(centros.map(c => c.prioridad).filter(Boolean))].sort(), sectionKey: '_top', sectionLabel: 'General' };
    options['proyecto'] = { label: 'Proyecto', values: [...new Set(centros.map(c => c.proyecto).filter(Boolean))].sort(), sectionKey: '_top', sectionLabel: 'General' };
    options['tipo_centro'] = { label: 'Tipo Centro', values: [...new Set(centros.map(c => c.tipo_centro).filter(Boolean))].sort(), sectionKey: '_top', sectionLabel: 'General' };

    // Section fields (Enum type only for filtering)
    sections.forEach(section => {
      (section.columns || []).forEach(col => {
        if (col.type === 'Enum' || col.type === 'EnumList') {
          const key = `${section.key}.${col.key}`;
          const values = [...new Set(
            centros.map(c => {
              const sectionData = c[section.key];
              if (sectionData && typeof sectionData === 'object') {
                return (sectionData as Record<string, string>)[col.key];
              }
              return undefined;
            }).filter(Boolean) as string[]
          )].sort();
          if (values.length > 0) {
            options[key] = { label: col.label, values, sectionKey: section.key, sectionLabel: section.label };
          }
        }
      });
    });

    return options;
  }, [centros, sections]);

  // ─── Computed: Filtered & Sorted Data ─────────────────────────

  const filteredCentros = useMemo(() => {
    let result = [...centros];

    // Text search
    if (searchText.trim()) {
      const terms = searchText.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(c => {
        const allValues: string[] = [];
        // Check top-level fields
        Object.entries(c).forEach(([key, val]) => {
          if (typeof val === 'string') {
            allValues.push(val.toLowerCase());
          } else if (val && typeof val === 'object') {
            Object.values(val as Record<string, string>).forEach(v => {
              if (v) allValues.push(v.toLowerCase());
            });
          }
        });
        return terms.every(term => allValues.some(v => v.includes(term)));
      });
    }

    // Apply filters
    activeFilters.forEach(filter => {
      if (filter.values.length === 0) return;
      result = result.filter(c => {
        let fieldValue: string | undefined;
        if (filter.sectionKey === '_top') {
          fieldValue = c[filter.fieldKey] as string;
        } else {
          const sectionData = c[filter.sectionKey];
          if (sectionData && typeof sectionData === 'object') {
            fieldValue = (sectionData as Record<string, string>)[filter.fieldKey];
          }
        }
        return fieldValue ? filter.values.includes(fieldValue) : false;
      });
    });

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal: string | undefined;
        let bVal: string | undefined;

        if (sortConfig.key.startsWith('_top.')) {
          const field = sortConfig.key.replace('_top.', '');
          aVal = a[field] as string;
          bVal = b[field] as string;
        } else {
          const [sectionKey, fieldKey] = sortConfig.key.split('.');
          const aSection = a[sectionKey];
          const bSection = b[sectionKey];
          if (aSection && typeof aSection === 'object') aVal = (aSection as Record<string, string>)[fieldKey];
          if (bSection && typeof bSection === 'object') bVal = (bSection as Record<string, string>)[fieldKey];
        }

        const cmp = (aVal || '').localeCompare(bVal || '', 'es', { numeric: true });
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [centros, searchText, activeFilters, sortConfig]);

  // ─── Computed: Statistics ─────────────────────────────────────

  const stats = useMemo(() => {
    const byProvincia: Record<string, number> = {};
    const byPrioridad: Record<string, number> = {};
    const byTipo: Record<string, number> = {};
    const byProyecto: Record<string, number> = {};

    filteredCentros.forEach(c => {
      byProvincia[c.provincia || 'N/A'] = (byProvincia[c.provincia || 'N/A'] || 0) + 1;
      byPrioridad[c.prioridad || 'N/A'] = (byPrioridad[c.prioridad || 'N/A'] || 0) + 1;
      byTipo[c.tipo_centro || 'N/A'] = (byTipo[c.tipo_centro || 'N/A'] || 0) + 1;
      byProyecto[c.proyecto || 'N/A'] = (byProyecto[c.proyecto || 'N/A'] || 0) + 1;
    });

    return { byProvincia, byPrioridad, byTipo, byProyecto, total: filteredCentros.length };
  }, [filteredCentros]);

  // ─── Pagination ───────────────────────────────────────────────

  const totalPages = Math.ceil(filteredCentros.length / PAGE_SIZE);
  const paginatedCentros = filteredCentros.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, activeFilters]);

  // ─── Handlers ─────────────────────────────────────────────────

  const addFilter = useCallback((fieldKey: string) => {
    const opt = filterOptions[fieldKey];
    if (!opt) return;
    const existing = activeFilters.find(f => f.id === fieldKey);
    if (existing) return;
    setActiveFilters(prev => [...prev, {
      id: fieldKey,
      sectionKey: opt.sectionKey,
      fieldKey: fieldKey.includes('.') ? fieldKey.split('.')[1] : fieldKey,
      fieldLabel: opt.label,
      values: [],
    }]);
  }, [filterOptions, activeFilters]);

  const removeFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  const updateFilterValues = useCallback((filterId: string, values: string[]) => {
    setActiveFilters(prev => prev.map(f => f.id === filterId ? { ...f, values } : f));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchText('');
    setSortConfig({ key: '', direction: null });
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key, direction: null };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const getFieldValue = useCallback((centro: CentroData, colKey: string): string => {
    if (colKey.startsWith('_top.')) {
      return (centro[colKey.replace('_top.', '')] as string) || '';
    }
    if (colKey.includes('.')) {
      const [sectionKey, fieldKey] = colKey.split('.');
      const sectionData = centro[sectionKey];
      if (sectionData && typeof sectionData === 'object') {
        return (sectionData as Record<string, string>)[fieldKey] || '';
      }
    }
    return (centro[colKey] as string) || '';
  }, []);

  const getColumnLabel = useCallback((colKey: string): string => {
    if (colKey === 'nombre') return 'Nombre';
    if (colKey === 'codigo') return 'Código';
    if (colKey === 'provincia') return 'Provincia';
    if (colKey === 'prioridad') return 'Prioridad';
    if (colKey === 'proyecto') return 'Proyecto';
    if (colKey === 'tipo_centro') return 'Tipo Centro';
    if (colKey === 'localizacion') return 'Localización';

    if (colKey.includes('.')) {
      const [sectionKey, fieldKey] = colKey.split('.');
      const section = sections.find(s => s.key === sectionKey);
      if (section) {
        const col = section.columns.find(c => c.key === fieldKey);
        if (col) return col.label;
      }
    }
    return colKey;
  }, [sections]);

  // ─── Export Handler ───────────────────────────────────────────

  const handleExport = useCallback(async (format: 'excel' | 'pdf' | 'word' | 'csv') => {
    setExportLoading(format);
    try {
      const exportFields: ExportField[] = selectedColumns.map(key => ({
        key,
        label: getColumnLabel(key),
        section: key.includes('.') ? key.split('.')[0] : undefined,
      }));

      const exportData: ExportCentro[] = filteredCentros.map(centro => {
        const row: ExportCentro = {};
        selectedColumns.forEach(key => {
          if (key.startsWith('_top.') || !key.includes('.')) {
            row[key] = centro[key.includes('.') ? key.split('.')[1] : key] as string || '';
          } else {
            const [sectionKey, fieldKey] = key.split('.');
            const sectionData = centro[sectionKey];
            if (sectionData && typeof sectionData === 'object') {
              row[key] = (sectionData as Record<string, string>)[fieldKey] || '';
            }
          }
        });
        return row;
      });

      const filename = `centros_onTower_${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'excel':
          exportToExcel(exportData, exportFields, filename);
          break;
        case 'pdf':
          exportToPDF(exportData, exportFields, filename);
          break;
        case 'word':
          await exportToWord(exportData, exportFields, filename);
          break;
        case 'csv':
          exportToCSV(exportData, exportFields, filename);
          break;
      }

      toast({
        title: 'Exportación completada',
        description: `${filteredCentros.length} centros exportados en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Error', description: 'No se pudo exportar los datos', variant: 'destructive' });
    } finally {
      setExportLoading(null);
    }
  }, [filteredCentros, selectedColumns, getColumnLabel, toast]);

  // ─── Preset Handlers ──────────────────────────────────────────

  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;
    const preset: FilterPreset = {
      name: presetName.trim(),
      filters: activeFilters.filter(f => f.values.length > 0),
      searchText,
    };
    const updated = [...presets, preset];
    setPresets(updated);
    localStorage.setItem('centros_search_presets', JSON.stringify(updated));
    setPresetName('');
    setPresetDialogOpen(false);
    toast({ title: 'Preset guardado', description: `"${preset.name}" guardado correctamente` });
  }, [presetName, activeFilters, searchText, presets, toast]);

  const loadPreset = useCallback((preset: FilterPreset) => {
    setActiveFilters(preset.filters);
    setSearchText(preset.searchText);
    toast({ title: 'Preset cargado', description: `"${preset.name}" aplicado` });
  }, [toast]);

  const deletePreset = useCallback((index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    setPresets(updated);
    localStorage.setItem('centros_search_presets', JSON.stringify(updated));
  }, [presets]);

  // ─── Render helpers ───────────────────────────────────────────

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="h-3 w-3 ml-1 text-primary" />;
    if (sortConfig.direction === 'desc') return <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  };

  // ─── Loading State ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando datos de centros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView('ontower')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Búsqueda Avanzada Centros
            </h1>
            <p className="text-sm text-muted-foreground">
              OnTower / Cellnex — {centros.length} centros disponibles
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="flex items-center gap-2">
          {/* Export Summary Badge */}
          {filteredCentros.length > 0 && (
            <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-border/60 bg-muted/30">
              <Database className="h-3 w-3" />
              {filteredCentros.length} registros
            </Badge>
          )}

          {/* Export Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 gap-2 h-10 px-4"
                disabled={filteredCentros.length === 0 || !!exportLoading}
              >
                {exportLoading ? (
                  <div className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white rounded-full" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="font-semibold">Exportar</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-2" align="end" sideOffset={8}>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1 pb-2">
                  Formato de exportación
                </p>

                {/* Excel */}
                <button
                  onClick={() => handleExport('excel')}
                  disabled={!!exportLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 group cursor-pointer text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">Excel</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold">.XLSX</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Hojas de cálculo con datos + resúmenes por provincia y prioridad
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* PDF */}
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!exportLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group cursor-pointer text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">PDF</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-bold">.PDF</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Documento A3 horizontal con tabla formateada y paginación
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Word */}
                <button
                  onClick={() => handleExport('word')}
                  disabled={!!exportLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 group cursor-pointer text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <FileType className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">Word</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold">.DOCX</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Documento editable con tabla y estilos profesionales
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* CSV */}
                <button
                  onClick={() => handleExport('csv')}
                  disabled={!!exportLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-200 group cursor-pointer text-left"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <Table2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">CSV</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-bold">.CSV</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      Datos en texto plano separado por comas, compatible con todo
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>

              {/* Footer info */}
              <div className="mt-2 pt-2 border-t px-2">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileDown className="h-3 w-3" />
                  Se exportarán {filteredCentros.length} centros con {selectedColumns.length} columnas
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en todos los campos... (términos separados por espacio)"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 h-11"
              />
              {searchText && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchText('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Popover open={columnPickerOpen} onOpenChange={setColumnPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-11">
                    <Columns3 className="h-4 w-4 mr-1" />
                    Columnas ({selectedColumns.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Buscar columna..." />
                    <CommandList>
                      <CommandEmpty>No se encontró columna</CommandEmpty>
                      {/* Top-level fields */}
                      <CommandGroup heading="Campos Principales">
                        {['nombre', 'codigo', 'provincia', 'prioridad', 'proyecto', 'tipo_centro'].map(key => (
                          <CommandItem
                            key={key}
                            onSelect={() => {
                              setSelectedColumns(prev =>
                                prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                              );
                            }}
                          >
                            <Checkbox checked={selectedColumns.includes(key)} className="mr-2" />
                            {getColumnLabel(key)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {/* Section fields */}
                      {sections.map(section => {
                        const sectionCols = section.columns.filter(c =>
                          c.type === 'Enum' || c.type === 'EnumList' || c.type === 'Text'
                        );
                        if (sectionCols.length === 0) return null;
                        return (
                          <CommandGroup key={section.key} heading={section.label}>
                            {sectionCols.map(col => {
                              const key = `${section.key}.${col.key}`;
                              return (
                                <CommandItem
                                  key={key}
                                  onSelect={() => {
                                    setSelectedColumns(prev =>
                                      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                                    );
                                  }}
                                >
                                  <Checkbox checked={selectedColumns.includes(key)} className="mr-2" />
                                  <span className="truncate">{col.label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                className="h-11"
                onClick={clearAllFilters}
                disabled={activeFilters.length === 0 && !searchText}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Active Filters Chips */}
          {(activeFilters.length > 0 || searchText) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {searchText && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  <Search className="h-3 w-3" />
                  &quot;{searchText}&quot;
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setSearchText('')}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {activeFilters.map(filter => (
                <Badge key={filter.id} variant="secondary" className="gap-1 pr-1">
                  <Filter className="h-3 w-3" />
                  {filter.fieldLabel}: {filter.values.length > 0 ? filter.values.join(', ') : 'Sin valor'}
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => removeFilter(filter.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground self-center">
                {filteredCentros.length} de {centros.length} centros
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Main Content with Tabs ──────────────────────────── */}
      <Tabs defaultValue="filters" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filters" className="gap-1">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters.length > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                {activeFilters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="presets" className="gap-1">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Filters Tab ────────────────────────────────── */}
        <TabsContent value="filters" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Filter Panel */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Añadir Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                {/* Quick filters */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principales</p>
                  {['provincia', 'prioridad', 'proyecto', 'tipo_centro'].map(key => {
                    const opt = filterOptions[key];
                    if (!opt) return null;
                    const isActive = activeFilters.some(f => f.id === key);
                    return (
                      <Button
                        key={key}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => isActive ? removeFilter(key) : addFilter(key)}
                      >
                        {isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                        {opt.label}
                        {opt.values.length > 0 && <span className="ml-auto opacity-60">({opt.values.length})</span>}
                      </Button>
                    );
                  })}
                </div>

                <Separator />

                {/* Section filters */}
                {sections.map(section => {
                  const enumCols = section.columns.filter(c => c.type === 'Enum' || c.type === 'EnumList');
                  if (enumCols.length === 0) return null;
                  return (
                    <Collapsible key={section.key}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full text-left py-1 hover:text-primary transition-colors">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          {SECTION_ICONS[section.key] || <Database className="h-3 w-3" />}
                          {section.label}
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pl-2 pt-1">
                        {enumCols.map(col => {
                          const key = `${section.key}.${col.key}`;
                          const isActive = activeFilters.some(f => f.id === key);
                          return (
                            <Button
                              key={key}
                              variant={isActive ? 'default' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs h-7"
                              onClick={() => isActive ? removeFilter(key) : addFilter(key)}
                            >
                              {isActive ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                              <span className="truncate">{col.label}</span>
                            </Button>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>

            {/* Filter Values Panel */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Valores de Filtro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                {activeFilters.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Añade filtros desde el panel izquierdo</p>
                  </div>
                ) : (
                  activeFilters.map(filter => {
                    const opt = filterOptions[filter.id];
                    if (!opt) return null;
                    return (
                      <div key={filter.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-foreground">{filter.fieldLabel}</p>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFilter(filter.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant={filter.values.length === 0 ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => updateFilterValues(filter.id, [])}
                          >
                            Todos
                          </Button>
                          {opt.values.map(val => (
                            <Button
                              key={val}
                              variant={filter.values.includes(val) ? 'default' : 'outline'}
                              size="sm"
                              className="h-6 text-[10px]"
                              onClick={() => {
                                const newValues = filter.values.includes(val)
                                  ? filter.values.filter(v => v !== val)
                                  : [...filter.values, val];
                                updateFilterValues(filter.id, newValues);
                              }}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Results Stats Mini */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Resumen de Resultados
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {filteredCentros.length} / {centros.length} centros
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  {Object.entries(stats.byProvincia).sort().map(([key, val]) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{val}</p>
                      <p className="text-xs text-muted-foreground">{key}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {Object.entries(stats.byPrioridad).sort().map(([key, val]) => (
                    <div key={key} className={`text-center p-2 rounded-lg border ${PRIORIDAD_COLORS[key] || 'bg-muted border-border'}`}>
                      <p className="text-lg font-bold">{val}</p>
                      <p className="text-[10px]">{key}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {Object.entries(stats.byTipo).sort().map(([key, val]) => (
                    <div key={key} className={`text-center p-2 rounded-lg border ${TIPO_CENTRO_COLORS[key] || 'bg-muted border-border'}`}>
                      <p className="text-lg font-bold">{val}</p>
                      <p className="text-[10px]">{key}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Stats Tab ──────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By Provincia */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Provincia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byProvincia).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-24 truncate">{key}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(val / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Prioridad */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byPrioridad).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Badge variant="outline" className={`w-20 justify-center text-xs ${PRIORIDAD_COLORS[key] || ''}`}>{key}</Badge>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            key === 'P1' ? 'bg-red-500' : key === 'P2' ? 'bg-orange-500' : key === 'P3' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(val / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Tipo Centro */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Tipo de Centro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byTipo).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Badge variant="outline" className={`w-24 justify-center text-xs ${TIPO_CENTRO_COLORS[key] || ''}`}>{key}</Badge>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${key === 'INDOOR' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                          style={{ width: `${(val / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Proyecto */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byProyecto).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-28 truncate">{key}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${(val / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed field stats for active filters */}
            {activeFilters.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Distribución por Filtros Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeFilters.filter(f => f.values.length > 0).map(filter => {
                      const opt = filterOptions[filter.id];
                      if (!opt) return null;
                      // Count filtered centros by this field
                      const fieldCounts: Record<string, number> = {};
                      filteredCentros.forEach(c => {
                        let val: string | undefined;
                        if (filter.sectionKey === '_top') {
                          val = c[filter.fieldKey] as string;
                        } else {
                          const sd = c[filter.sectionKey];
                          if (sd && typeof sd === 'object') val = (sd as Record<string, string>)[filter.fieldKey];
                        }
                        fieldCounts[val || 'N/A'] = (fieldCounts[val || 'N/A'] || 0) + 1;
                      });
                      return (
                        <div key={filter.id}>
                          <p className="text-xs font-semibold mb-2">{filter.fieldLabel}</p>
                          <div className="space-y-1">
                            {Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs w-24 truncate">{key}</span>
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${(val / stats.total) * 100}%` }} />
                                </div>
                                <span className="text-xs font-medium w-6 text-right">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Presets Tab ────────────────────────────────── */}
        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Filtros Guardados</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setPresetDialogOpen(true)} disabled={activeFilters.length === 0 && !searchText}>
                  <Save className="h-4 w-4 mr-1" />
                  Guardar Actual
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {presets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay presets guardados</p>
                  <p className="text-xs mt-1">Aplica filtros y guárdalos para reutilizarlos</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{preset.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {preset.searchText && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              &quot;{preset.searchText}&quot;
                            </Badge>
                          )}
                          {preset.filters.map(f => (
                            <Badge key={f.id} variant="outline" className="text-[10px] h-5">
                              {f.fieldLabel}: {f.values.join(',')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => loadPreset(preset)}>
                          Aplicar
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deletePreset(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Preset Dialog */}
          <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Guardar Filtro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nombre del preset..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                />
                <div className="flex flex-wrap gap-1">
                  {searchText && <Badge variant="secondary">&quot;{searchText}&quot;</Badge>}
                  {activeFilters.filter(f => f.values.length > 0).map(f => (
                    <Badge key={f.id} variant="outline">{f.fieldLabel}: {f.values.join(',')}</Badge>
                  ))}
                </div>
                <Button onClick={savePreset} disabled={!presetName.trim()} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Preset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* ─── Results Table ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              Resultados ({filteredCentros.length} centros)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCentros.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg font-medium">Sin resultados</p>
              <p className="text-sm mt-1">Ajusta los filtros o el texto de búsqueda</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">#</TableHead>
                      {selectedColumns.slice(0, 10).map(colKey => (
                        <TableHead
                          key={colKey}
                          className="cursor-pointer hover:bg-muted/80 transition-colors whitespace-nowrap"
                          onClick={() => handleSort(colKey.includes('.') ? colKey : `_top.${colKey}`)}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{getColumnLabel(colKey)}</span>
                            {renderSortIcon(colKey.includes('.') ? colKey : `_top.${colKey}`)}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCentros.map((centro, idx) => (
                      <TableRow
                        key={`${centro.codigo}-${idx}`}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => { setDetailCentro(centro); setDetailOpen(true); }}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        {selectedColumns.slice(0, 10).map(colKey => {
                          const val = getFieldValue(centro, colKey);
                          return (
                            <TableCell key={colKey} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                              {colKey === 'prioridad' ? (
                                <Badge variant="outline" className={`text-[10px] h-5 ${PRIORIDAD_COLORS[val] || ''}`}>
                                  {val}
                                </Badge>
                              ) : colKey === 'tipo_centro' ? (
                                <Badge variant="outline" className={`text-[10px] h-5 ${TIPO_CENTRO_COLORS[val] || ''}`}>
                                  {val}
                                </Badge>
                              ) : colKey === 'nombre' ? (
                                <span className="font-medium">{val}</span>
                              ) : (
                                val
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDetailCentro(centro); setDetailOpen(true); }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 max-h-[600px] overflow-y-auto">
              {paginatedCentros.map((centro, idx) => (
                <Card
                  key={`${centro.codigo}-${idx}`}
                  className="cursor-pointer hover:shadow-md transition-shadow border"
                  onClick={() => { setDetailCentro(centro); setDetailOpen(true); }}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm truncate">{centro.nombre}</p>
                        <p className="text-xs text-muted-foreground">{centro.codigo}</p>
                      </div>
                      <div className="flex gap-1">
                        {centro.prioridad && (
                          <Badge variant="outline" className={`text-[9px] h-4 ${PRIORIDAD_COLORS[centro.prioridad] || ''}`}>
                            {centro.prioridad}
                          </Badge>
                        )}
                        {centro.tipo_centro && (
                          <Badge variant="outline" className={`text-[9px] h-4 ${TIPO_CENTRO_COLORS[centro.tipo_centro] || ''}`}>
                            {centro.tipo_centro}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {centro.provincia && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{centro.provincia}</span>}
                      {centro.proyecto && <span>Proyecto: {centro.proyecto}</span>}
                    </div>
                    {selectedColumns.filter(c => c.includes('.')).slice(0, 3).map(colKey => {
                      const val = getFieldValue(centro, colKey);
                      return val ? (
                        <div key={colKey} className="text-xs">
                          <span className="text-muted-foreground">{getColumnLabel(colKey)}: </span>
                          <span className="font-medium truncate">{val}</span>
                        </div>
                      ) : null;
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Mostrando {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCentros.length)} de {filteredCentros.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Detail Sheet ──────────────────────────────────────── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {detailCentro?.nombre || 'Detalle'}
            </SheetTitle>
          </SheetHeader>
          {detailCentro && (
            <div className="mt-6 space-y-4">
              {/* Top-level info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Código</p>
                  <p className="font-semibold">{detailCentro.codigo}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Provincia</p>
                  <p className="font-semibold">{detailCentro.provincia}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Prioridad</p>
                  <Badge variant="outline" className={PRIORIDAD_COLORS[detailCentro.prioridad] || ''}>{detailCentro.prioridad}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Proyecto</p>
                  <p className="font-semibold">{detailCentro.proyecto}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Tipo</p>
                  <Badge variant="outline" className={TIPO_CENTRO_COLORS[detailCentro.tipo_centro] || ''}>{detailCentro.tipo_centro}</Badge>
                </div>
                {detailCentro.localizacion && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Localización</p>
                    <p className="text-xs font-mono">{detailCentro.localizacion}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section details */}
              {sections.map(section => {
                const sectionData = detailCentro[section.key];
                if (!sectionData || typeof sectionData !== 'object') return null;
                const entries = Object.entries(sectionData as Record<string, string>).filter(([_, v]) => v);
                if (entries.length === 0) return null;

                return (
                  <Collapsible key={section.key} defaultOpen={section.key === 'general'}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-primary transition-colors border-b">
                      <span className="flex items-center gap-2 font-semibold text-sm">
                        {SECTION_ICONS[section.key] || <Database className="h-4 w-4" />}
                        {section.label}
                        <Badge variant="secondary" className="text-[10px]">{entries.length}</Badge>
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
                        {section.columns.map(col => {
                          const val = (sectionData as Record<string, string>)[col.key];
                          if (!val) return null;
                          return (
                            <div key={col.key} className="p-2 rounded bg-muted/30">
                              <p className="text-[10px] text-muted-foreground">{col.label}</p>
                              <p className="text-xs font-medium">{val}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
