'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  ArrowLeft,
  Database,
  Lock,
  Save,
  ChevronRight,
  Filter,
  X,
  Building2,
  MapPin,
  Tag,
  Loader2,
  ExternalLink,
  Phone as PhoneIcon,
  Calendar,
  Hash,
  Type,
  ListChecks,
} from 'lucide-react';

// Types
type FieldType =
  | 'Text'
  | 'Number'
  | 'Decimal'
  | 'Enum'
  | 'EnumList'
  | 'LongText'
  | 'Phone'
  | 'Date'
  | 'LatLong'
  | 'Show';

interface SectionColumn {
  index: number;
  key: string;
  label: string;
  type: FieldType;
}

interface SectionConfig {
  key: string;
  label: string;
  columns: SectionColumn[];
}

interface CentroData {
  general: Record<string, string>;
  suministro_electrico: Record<string, string>;
  remota: Record<string, string>;
  evcc: Record<string, string>;
  aa: Record<string, string>;
  torre: Record<string, string>;
  gamesystem: Record<string, string>;
  nidos: Record<string, string>;
  infraestructura: Record<string, string>;
  coubicados: Record<string, string>;
  cuadro_electrico: Record<string, string>;
  enlaces: Record<string, string>;
  sigfox: Record<string, string>;
  fotovoltaica: Record<string, string>;
  nombre: string;
  codigo: string;
  provincia: string;
  prioridad: string;
  proyecto: string;
  tipo_centro: string;
  localizacion: string;
}

const PAGE_SIZE = 50;

export default function DatosCentrosView() {
  const { currentUser, setCurrentView } = useAppStore();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'admin';

  // Data state
  const [centros, setCentros] = useState<CentroData[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedCentro, setSelectedCentro] = useState<CentroData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvincia, setFilterProvincia] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [filterTipoCentro, setFilterTipoCentro] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [centrosRes, sectionsRes] = await Promise.all([
          fetch('/datos_centros_atw.json'),
          fetch('/sections_config.json'),
        ]);
        const centrosData = await centrosRes.json();
        const sectionsData = await sectionsRes.json();

        setCentros(centrosData.centros || []);
        setSections(sectionsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extract unique enum values from centros data for each Enum/EnumList field
  const enumOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    if (centros.length === 0 || sections.length === 0) return options;

    sections.forEach((section) => {
      section.columns.forEach((col) => {
        if (col.type === 'Enum' || col.type === 'EnumList') {
          const values = new Set<string>();
          centros.forEach((centro) => {
            const sectionData = centro[section.key as keyof CentroData] as Record<string, string>;
            if (sectionData && sectionData[col.key]) {
              // For EnumList, values may be comma-separated
              if (col.type === 'EnumList') {
                sectionData[col.key].split(',').forEach((v) => {
                  const trimmed = v.trim();
                  if (trimmed) values.add(trimmed);
                });
              } else {
                values.add(sectionData[col.key]);
              }
            }
          });
          const sorted = Array.from(values).sort();
          if (sorted.length > 0) {
            options[col.key] = sorted;
          }
        }
      });
    });

    return options;
  }, [centros, sections]);

  // Unique filter values
  const provincias = useMemo(() => {
    const set = new Set(centros.map((c) => c.provincia).filter(Boolean));
    return Array.from(set).sort();
  }, [centros]);

  const prioridades = useMemo(() => {
    const set = new Set(centros.map((c) => c.prioridad).filter(Boolean));
    return Array.from(set).sort();
  }, [centros]);

  const tiposCentro = useMemo(() => {
    const set = new Set(centros.map((c) => c.tipo_centro).filter(Boolean));
    return Array.from(set).sort();
  }, [centros]);

  // Filtered centros
  const filteredCentros = useMemo(() => {
    let result = centros;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.codigo.toLowerCase().includes(q) ||
          c.provincia.toLowerCase().includes(q)
      );
    }

    if (filterProvincia !== 'all') {
      result = result.filter((c) => c.provincia === filterProvincia);
    }

    if (filterPrioridad !== 'all') {
      result = result.filter((c) => c.prioridad === filterPrioridad);
    }

    if (filterTipoCentro !== 'all') {
      result = result.filter((c) => c.tipo_centro === filterTipoCentro);
    }

    return result;
  }, [centros, searchQuery, filterProvincia, filterPrioridad, filterTipoCentro]);

  const displayedCentros = useMemo(() => {
    return filteredCentros.slice(0, displayCount);
  }, [filteredCentros, displayCount]);

  const hasMore = displayCount < filteredCentros.length;

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [searchQuery, filterProvincia, filterPrioridad, filterTipoCentro]);

  const handleSelectCentro = useCallback((centro: CentroData) => {
    setSelectedCentro(centro);
    setActiveTab(0);
    setEditedData({});
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCentro(null);
    setEditedData({});
  }, []);

  const handleEdit = useCallback((sectionKey: string, colKey: string, value: string) => {
    if (!selectedCentro) return;
    const dataKey = `${sectionKey}.${colKey}`;
    setEditedData((prev) => ({ ...prev, [dataKey]: value }));
  }, [selectedCentro]);

  const getFieldValue = useCallback(
    (sectionKey: string, colKey: string): string => {
      if (!selectedCentro) return '';
      const dataKey = `${sectionKey}.${colKey}`;
      if (dataKey in editedData) return editedData[dataKey];
      const section = selectedCentro[sectionKey as keyof CentroData] as Record<string, string>;
      return section?.[colKey] ?? '';
    },
    [selectedCentro, editedData]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    toast({
      title: 'Datos guardados',
      description: 'Los cambios han sido guardados correctamente.',
    });
  }, [toast]);

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'P1':
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">{prioridad}</Badge>;
      case 'P2':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">{prioridad}</Badge>;
      case 'P3':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">{prioridad}</Badge>;
      default:
        return <Badge variant="secondary">{prioridad}</Badge>;
    }
  };

  // Render LatLong value as a Google Maps link
  const renderLatLongValue = (value: string, isEditMode: boolean, sectionKey: string, colKey: string) => {
    if (isEditMode) {
      return (
        <div className="flex gap-1.5">
          <Input
            value={value}
            onChange={(e) => handleEdit(sectionKey, colKey, e.target.value)}
            className={`h-9 text-sm flex-1 ${`${sectionKey}.${colKey}` in editedData ? 'border-teal-400 ring-1 ring-teal-200' : ''}`}
            placeholder="lat, lng"
          />
          {value && (
            <a
              href={`https://www.google.com/maps?q=${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLink className="h-4 w-4 text-teal-600" />
            </a>
          )}
        </div>
      );
    }

    if (!value) {
      return (
        <div className="min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm bg-muted/30 border-dashed text-muted-foreground">
          —
        </div>
      );
    }

    return (
      <a
        href={`https://www.google.com/maps?q=${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{value}</span>
        <ExternalLink className="h-3 w-3 shrink-0 ml-1 opacity-60" />
      </a>
    );
  };

  // Render Phone value as a clickable link
  const renderPhoneValue = (value: string, isEditMode: boolean, sectionKey: string, colKey: string) => {
    if (isEditMode) {
      return (
        <div className="flex gap-1.5">
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleEdit(sectionKey, colKey, e.target.value)}
            className={`h-9 text-sm flex-1 ${`${sectionKey}.${colKey}` in editedData ? 'border-teal-400 ring-1 ring-teal-200' : ''}`}
            placeholder="—"
          />
          {value && (
            <a
              href={`tel:${value}`}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <PhoneIcon className="h-4 w-4 text-teal-600" />
            </a>
          )}
        </div>
      );
    }

    if (!value) {
      return (
        <div className="min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm bg-muted/30 border-dashed text-muted-foreground">
          —
        </div>
      );
    }

    return (
      <a
        href={`tel:${value}`}
        className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
        <span>{value}</span>
      </a>
    );
  };

  // Render field based on its type
  const renderFieldByType = (
    col: SectionColumn,
    sectionKey: string
  ) => {
    const value = getFieldValue(sectionKey, col.key);
    const isEdited = `${sectionKey}.${col.key}` in editedData;
    const editedClass = isEdited ? 'border-teal-400 ring-1 ring-teal-200' : '';

    // Admin (editable) mode
    if (isAdmin) {
      switch (col.type) {
        case 'Enum':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight block">
                {col.label}
              </label>
              <Select
                value={value || '_empty'}
                onValueChange={(v) => handleEdit(sectionKey, col.key, v === '_empty' ? '' : v)}
              >
                <SelectTrigger className={`h-9 text-sm ${editedClass}`}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">— Sin valor —</SelectItem>
                  {(enumOptions[col.key] || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );

        case 'EnumList':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {col.label}
              </label>
              <Select
                value={value || '_empty'}
                onValueChange={(v) => handleEdit(sectionKey, col.key, v === '_empty' ? '' : v)}
              >
                <SelectTrigger className={`h-9 text-sm ${editedClass}`}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_empty">— Sin valor —</SelectItem>
                  {(enumOptions[col.key] || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );

        case 'Number':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {col.label}
              </label>
              <Input
                type="number"
                value={value}
                onChange={(e) => handleEdit(sectionKey, col.key, e.target.value)}
                className={`h-9 text-sm ${editedClass}`}
                placeholder="—"
              />
            </div>
          );

        case 'Decimal':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {col.label}
              </label>
              <Input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => handleEdit(sectionKey, col.key, e.target.value)}
                className={`h-9 text-sm ${editedClass}`}
                placeholder="0.00"
              />
            </div>
          );

        case 'LongText':
          return (
            <div key={col.key} className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground leading-tight block">
                {col.label}
              </label>
              <Textarea
                value={value}
                onChange={(e) => handleEdit(sectionKey, col.key, e.target.value)}
                className={`text-sm min-h-[60px] ${editedClass}`}
                placeholder="—"
              />
            </div>
          );

        case 'Phone':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <PhoneIcon className="h-3 w-3" />
                {col.label}
              </label>
              {renderPhoneValue(value, true, sectionKey, col.key)}
            </div>
          );

        case 'Date':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {col.label}
              </label>
              <Input
                type="date"
                value={value}
                onChange={(e) => handleEdit(sectionKey, col.key, e.target.value)}
                className={`h-9 text-sm ${editedClass}`}
              />
            </div>
          );

        case 'LatLong':
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {col.label}
              </label>
              {renderLatLongValue(value, true, sectionKey, col.key)}
            </div>
          );

        case 'Text':
        default:
          return (
            <div key={col.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
                <Type className="h-3 w-3" />
                {col.label}
              </label>
              <Input
                value={value}
                onChange={(e) => handleEdit(sectionKey, col.key, e.target.value)}
                className={`h-9 text-sm ${editedClass}`}
                placeholder="—"
              />
            </div>
          );
      }
    }

    // Read-only mode (non-admin)
    switch (col.type) {
      case 'Enum':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight block">
              {col.label}
            </label>
            <div
              className={`min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm ${
                value
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );

      case 'EnumList':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {col.label}
            </label>
            <div
              className={`min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm ${
                value
                  ? 'bg-violet-50 border-violet-200 text-violet-800'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );

      case 'Number':
      case 'Decimal':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {col.label}
            </label>
            <div
              className={`min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm font-mono ${
                value
                  ? 'bg-background border-border text-foreground'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );

      case 'LongText':
        return (
          <div key={col.key} className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground leading-tight block">
              {col.label}
            </label>
            <div
              className={`min-h-[48px] px-3 py-2 rounded-md border text-sm whitespace-pre-wrap ${
                value
                  ? 'bg-background border-border text-foreground'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );

      case 'Phone':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
              <PhoneIcon className="h-3 w-3" />
              {col.label}
            </label>
            {renderPhoneValue(value, false, sectionKey, col.key)}
          </div>
        );

      case 'Date':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {col.label}
            </label>
            <div
              className={`min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm ${
                value
                  ? 'bg-background border-border text-foreground'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );

      case 'LatLong':
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {col.label}
            </label>
            {renderLatLongValue(value, false, sectionKey, col.key)}
          </div>
        );

      case 'Text':
      default:
        return (
          <div key={col.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground leading-tight block">
              {col.label}
            </label>
            <div
              className={`min-h-[36px] flex items-center px-3 py-1.5 rounded-md border text-sm ${
                value
                  ? 'bg-background border-border text-foreground'
                  : 'bg-muted/30 border-dashed text-muted-foreground'
              }`}
            >
              {value || '—'}
            </div>
          </div>
        );
    }
  };

  // Render section content for detail view
  const renderSectionContent = (section: SectionConfig) => {
    const elements: React.ReactNode[] = [];
    let gridItems: React.ReactNode[] = [];

    const flushGrid = () => {
      if (gridItems.length > 0) {
        elements.push(
          <div key={`grid-${elements.length}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gridItems}
          </div>
        );
        gridItems = [];
      }
    };

    section.columns.forEach((col) => {
      // Skip Show type columns — render as section/subsection headers
      if (col.type === 'Show') {
        flushGrid();

        // Determine if it's a main section header or subsection header
        const isMainHeader = col.label.startsWith('DATOS INTERES') || col.label.startsWith('DATOS INTERESSUMINISTRO');

        if (isMainHeader) {
          // Main section header — skip (already shown as tab/card header)
          return;
        }

        // Subsection header divider
        elements.push(
          <div key={`sub-${col.key}`} className="flex items-center gap-3 py-3 mt-2">
            <div className="h-px bg-teal-200 flex-1" />
            <span className="text-xs font-bold tracking-wider text-teal-700 uppercase whitespace-nowrap">
              {col.label}
            </span>
            <div className="h-px bg-teal-200 flex-1" />
          </div>
        );
        return;
      }

      // Render field based on its type
      const fieldElement = renderFieldByType(col, section.key);

      // LongText fields span 2 columns
      if (col.type === 'LongText') {
        flushGrid();
        // Render LongText in its own full-width grid
        elements.push(
          <div key={`longtext-grid-${col.key}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldElement}
          </div>
        );
      } else {
        gridItems.push(fieldElement);
      }
    });

    // Flush remaining grid items
    flushGrid();

    return <div className="space-y-1">{elements}</div>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando datos de centros...</p>
        </div>
      </div>
    );
  }

  // =====================
  // DETAIL VIEW
  // =====================
  if (selectedCentro) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-teal-800 truncate">
                {selectedCentro.nombre}
              </h1>
              {!isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center text-muted-foreground cursor-help">
                        <Lock className="h-4 w-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Solo editable por administradores</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {selectedCentro.codigo}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {selectedCentro.provincia}
              </span>
              {getPrioridadBadge(selectedCentro.prioridad)}
              <Badge variant="outline" className="text-xs">
                {selectedCentro.tipo_centro}
              </Badge>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 shrink-0"
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Guardar
            </Button>
          )}
        </div>

        {/* Horizontal scrollable tab bar */}
        <div className="relative mb-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-1 min-w-max">
              {sections.map((section, idx) => (
                <button
                  key={section.key}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    activeTab === idx
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <h2 className="text-base font-semibold text-foreground">
              {sections[activeTab]?.label}
            </h2>
          </CardHeader>
          <CardContent className="pt-4">
            {sections[activeTab] && renderSectionContent(sections[activeTab])}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================
  // LIST VIEW
  // =====================
  const hasActiveFilters = filterProvincia !== 'all' || filterPrioridad !== 'all' || filterTipoCentro !== 'all';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('ontower')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-teal-800">Datos Centros</h1>
          <p className="text-xs text-muted-foreground">OnTower — Base de datos de centros</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o provincia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filtros:</span>
          </div>

          <Select value={filterProvincia} onValueChange={setFilterProvincia}>
            <SelectTrigger className="h-8 text-xs w-[150px]" size="sm">
              <SelectValue placeholder="Provincia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las provincias</SelectItem>
              {provincias.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="h-8 text-xs w-[130px]" size="sm">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {prioridades.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTipoCentro} onValueChange={setFilterTipoCentro}>
            <SelectTrigger className="h-8 text-xs w-[140px]" size="sm">
              <SelectValue placeholder="Tipo centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {tiposCentro.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterProvincia('all');
                setFilterPrioridad('all');
                setFilterTipoCentro('all');
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCentros.length}</span>
          {filteredCentros.length !== centros.length && (
            <>
              {' '}de <span className="font-semibold">{centros.length}</span>
            </>
          )}{' '}
          centros encontrados
        </p>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Database className="h-4 w-4" />
        </div>
      </div>

      {/* Centros list */}
      {filteredCentros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">No se encontraron centros</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCentros.map((centro) => (
            <Card
              key={centro.codigo}
              className="cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-teal-200 group"
              onClick={() => handleSelectCentro(centro)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-teal-700 transition-colors">
                        {centro.nombre}
                      </h3>
                      {getPrioridadBadge(centro.prioridad)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {centro.codigo}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {centro.provincia}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {centro.tipo_centro}
                      </span>
                    </div>
                    {centro.proyecto && (
                      <span className="inline-block mt-2 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-medium">
                        {centro.proyecto}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-teal-500 transition-colors shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
            className="text-sm"
          >
            Cargar más ({filteredCentros.length - displayCount} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
