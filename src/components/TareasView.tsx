'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { TAREA_SECTIONS, FormSection, FormField, FormSubsection, countSectionFields, isVisible } from '@/lib/tarea-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  X,
  Save,
  Send,
  MapPin,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Building2,
  ClipboardList,
  Upload,
  Trash2,
  RotateCcw,
  Check,
  Clock,
  User,
  CalendarDays,
  EyeOff,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Download,
  RefreshCw,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { getCentroPreFillData } from '@/lib/centro-to-preventivo-map';
import { compressImage, formatFileSize } from '@/lib/image-compress';
import { useOnlineStatus, useAutosave, useDrafts, useOfflineSync } from '@/hooks/useOfflineSync';
import { saveOfflinePhoto, DraftData, formatTimeAgo } from '@/lib/offline-storage';

// Section icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Building2, ClipboardList, Camera,
  TowerControl: Building2,
  Users: Building2,
  CircuitBoard: ClipboardList,
};

// Color mapping for prioridadTarea Color field
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Baja: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-400' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  Alta: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
  Urgente: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
};

// Centro data type
interface CentroOption {
  codigo: string;
  nombre: string;
  provincia: string;
  prioridad: string;
  tipo_centro: string;
}

// Full centro data
interface CentroFullData {
  codigo: string;
  nombre: string;
  provincia: string;
  prioridad: string;
  tipo_centro: string;
  proyecto: string;
  localizacion: string;
  [sectionKey: string]: string | Record<string, string>;
}

export default function TareasView() {
  const { currentUser, setCurrentView, setIsLoading, isLoading } = useAppStore();

  // Local form state (NOT from Zustand store)
  const [fields, setFields] = useState<Record<string, string>>({});
  const [centroId, setCentroId] = useState('');
  const [selectedCentroData, setSelectedCentroData] = useState<CentroOption | null>(null);

  const { toast } = useToast();
  const [employees, setEmployees] = useState<{ id: string; name: string; username: string }[]>([]);
  const [centros, setCentros] = useState<CentroOption[]>([]);
  const [centrosFullData, setCentrosFullData] = useState<Record<string, CentroFullData>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [showCentroSearch, setShowCentroSearch] = useState(false);
  const [centroSearchQuery, setCentroSearchQuery] = useState('');
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set());
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Offline & autosave hooks
  const online = useOnlineStatus();
  const { lastSaved, isSaving: isAutosaving, formattedTime: autosaveTime } = useAutosave();
  const { drafts, loadDraft, removeDraft, checkForExistingDraft } = useDrafts();
  const { isSyncing, syncProgress, pendingCount, submitOffline, syncPendingSubmissions } = useOfflineSync();

  // Draft recovery dialog state
  const [showDraftRecovery, setShowDraftRecovery] = useState<DraftData | null>(null);

  const formSections = TAREA_SECTIONS;

  // Fetch employees and centros
  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data.employees || []))
      .catch(() => {});

    fetch('/datos_centros_atw.json')
      .then(res => res.json())
      .then(data => {
        const centrosRaw = data.centros || [];
        const centrosList: CentroOption[] = centrosRaw.map((c: any) => ({
          codigo: c.codigo || '',
          nombre: c.nombre || '',
          provincia: c.provincia || '',
          prioridad: c.prioridad || '',
          tipo_centro: c.tipo_centro || '',
        }));
        setCentros(centrosList);

        const fullDataMap: Record<string, CentroFullData> = {};
        centrosRaw.forEach((c: any) => {
          if (c.codigo) {
            fullDataMap[c.codigo] = c;
          }
        });
        setCentrosFullData(fullDataMap);
      })
      .catch(() => {});
  }, []);

  // Set defaults on mount
  useEffect(() => {
    // Default fecha to today
    if (!fields['fecha']) {
      setFieldValue('fecha', new Date().toISOString().split('T')[0]);
    }
    // Auto-fill tecnico from currentUser
    if (currentUser && !fields['tecnico']) {
      setFieldValue('tecnico', currentUser.name);
    }
  }, [currentUser]);

  // Auto-fill anio from fecha
  useEffect(() => {
    if (fields['fecha']) {
      const year = new Date(fields['fecha']).getFullYear().toString();
      if (fields['anio'] !== year) {
        setFields(prev => ({ ...prev, anio: year }));
      }
    }
  }, [fields['fecha']]);

  // Auto-generate computedKey when centro + tipo + periodo + anio change
  useEffect(() => {
    const codigo = selectedCentroData?.codigo || '';
    const tipo = fields['tipoTarea'] || '';
    const periodo = fields['periodo'] || '';
    const anio = fields['anio'] || '';
    if (codigo && tipo) {
      const key = `${codigo}_${tipo}${periodo ? '_' + periodo : ''}${anio ? '_' + anio : ''}`;
      setFields(prev => ({ ...prev, computedKey: key }));
    }
  }, [selectedCentroData, fields['tipoTarea'], fields['periodo'], fields['anio']]);

  // Filter centros by search
  const filteredCentros = useMemo(() => {
    if (!centroSearchQuery.trim()) return centros.slice(0, 50);
    const q = centroSearchQuery.toLowerCase().trim();
    return centros
      .filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        c.provincia.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [centros, centroSearchQuery]);

  // Auto-fill when centro is selected
  const handleSelectCentro = useCallback((centro: CentroOption) => {
    setCentroId(centro.codigo);
    setSelectedCentroData(centro);

    // Auto-fill nombreCentro
    setFieldValue('nombreCentro', centro.nombre);

    // Pre-fill from full centro data using the mapping
    const fullData = centrosFullData[centro.codigo];
    const newPrefilled = new Set<string>();
    if (fullData) {
      const preFillFields = getCentroPreFillData(fullData as unknown as Record<string, Record<string, string>>);
      for (const [key, value] of Object.entries(preFillFields)) {
        setFieldValue(key, value);
        newPrefilled.add(key);
      }
    }
    setPrefilledFields(newPrefilled);

    if (newPrefilled.size > 0) {
      toast({
        title: 'Datos precargados',
        description: `Se han prerellenado ${newPrefilled.size} campos con los datos del centro.`,
      });
    }

    setShowCentroSearch(false);
    setCentroSearchQuery('');
    setActiveTab(0);
  }, [centrosFullData, toast]);

  // Toggle subsection
  const toggleSubsection = (key: string) => {
    setExpandedSubsections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validate
  const validate = (): boolean => {
    const errors: string[] = [];
    if (!centroId) errors.push('Seleccione un centro');
    if (!fields['fecha']) errors.push('Fecha es requerida');
    if (!fields['tecnico']) errors.push('Técnico es requerido');
    if (!fields['tipoTarea']) errors.push('Tipo de tarea es requerido');
    if (!fields['prioridadTarea']) errors.push('Prioridad tarea es requerida');
    if (!fields['estado']) errors.push('Estado es requerido');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Auto-generate titulo
  const generateTitulo = useCallback((): string => {
    const centroName = selectedCentroData?.nombre || fields['nombreCentro'] || '';
    const tipo = fields['tipoTarea'] || '';
    const fecha = fields['fecha'] || '';
    return `${centroName} — ${tipo} ${fecha}`.trim();
  }, [selectedCentroData, fields['nombreCentro'], fields['tipoTarea'], fields['fecha']]);

  // Save
  const handleSave = async (estado: string) => {
    if (!validate()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Resolve asignadoA (empleado ID) from tecnico name or currentUser
      const tecnicoName = fields['tecnico'] || currentUser?.name || '';
      const empleado = employees.find(e => e.name === tecnicoName);
      const asignadoA = empleado?.id || currentUser?.id || '';

      const titulo = generateTitulo();
      const tipo = (fields['tipoTarea'] || 'correctivo').toLowerCase().replace(/ /g, '_');
      const prioridad = (fields['prioridadTarea'] || 'media').toLowerCase();

      const body = {
        titulo,
        tipo,
        prioridad,
        estado,
        centroId,
        asignadoA,
        fechaLimite: fields['fechaRealizacion'] || fields['fecha'] || null,
        fields,
      };

      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar');
      }
      toast({
        title: estado === 'pendiente' ? 'Tarea guardada' : 'Tarea enviada',
        description: `La tarea ha sido ${estado === 'pendiente' ? 'guardada' : 'enviada'} correctamente.`,
      });
      setFields({});
      setCentroId('');
      setSelectedCentroData(null);
      setCurrentView('ontower');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al guardar la tarea',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFields({});
    setCentroId('');
    setSelectedCentroData(null);
    setCurrentView('ontower');
  };

  // Get/set field value (local state)
  const getFieldValue = (key: string): string => {
    return fields[key] || '';
  };

  const setFieldValue = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  // Get field completion stats
  const getSectionStats = (section: FormSection) => {
    let total = 0;
    let filled = 0;
    const countFields = (fieldsList: FormField[]) => {
      fieldsList.forEach(f => {
        total++;
        if (getFieldValue(f.key)) filled++;
      });
    };
    countFields(section.fields);
    section.subsections.forEach(sub => countFields(sub.fields));
    return { total, filled };
  };

  // Check if a field was pre-filled
  const isPrefilled = (key: string): boolean => prefilledFields.has(key);

  // Helper: determine image src
  const getImageSrc = (value: string): string => {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('data:')) return value;
    if (value.startsWith('/api/')) return value;
    if (value.startsWith('http')) return value;
    if (value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value)) {
      return `data:image/jpeg;base64,${value}`;
    }
    return '';
  };

  // Check if a value is a server-stored photo path
  const isServerPhoto = (value: string): boolean => !!value && typeof value === 'string' && value.startsWith('/api/fotos-preventivo/');

  // Handle photo capture
  const handlePhotoCapture = async (file: File, fieldKey: string, fieldLabel: string) => {
    if (!selectedCentroData || !centroId) {
      toast({ title: 'Centro requerido', description: 'Seleccione un centro antes de tomar fotografías', variant: 'destructive' });
      return;
    }

    setUploadingFields(prev => new Set(prev).add(fieldKey));
    try {
      const compressed = await compressImage(file);

      const base64Promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressed.blob);
      });
      const base64 = await base64Promise;

      // OFFLINE
      if (!online) {
        const year = fields['fecha'] ? new Date(fields['fecha']).getFullYear().toString() : new Date().getFullYear().toString();
        const provincia = fields['provincia'] || selectedCentroData.provincia || 'Sin Provincia';

        await saveOfflinePhoto({
          fieldKey,
          fieldLabel,
          base64,
          timestamp: new Date().toISOString(),
        });

        setFieldValue(fieldKey, base64);

        toast({
          title: 'Foto guardada sin conexión',
          description: `${fieldLabel} — Se subirá al servidor cuando recupere la conexión.`,
          duration: 3000,
        });
        return;
      }

      // ONLINE
      const year = fields['fecha'] ? new Date(fields['fecha']).getFullYear().toString() : new Date().getFullYear().toString();
      const provincia = fields['provincia'] || selectedCentroData.provincia || 'Sin Provincia';

      const formData = new FormData();
      formData.append('file', compressed.blob, `${fieldLabel}.jpg`);
      formData.append('year', year);
      formData.append('provincia', provincia);
      formData.append('centroNombre', selectedCentroData.nombre);
      formData.append('centroCodigo', centroId);
      formData.append('fieldLabel', fieldLabel);
      formData.append('fieldKey', fieldKey);

      const res = await fetch('/api/fotos-preventivo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir fotografía');
      }

      const data = await res.json();
      setFieldValue(fieldKey, data.apiPath);

      toast({
        title: 'Fotografía guardada',
        description: `${fieldLabel} — ${formatFileSize(compressed.sizeBytes)} (original: ${formatFileSize(compressed.originalSizeBytes)}, compresión: ${Math.round((1 - compressed.compressionRatio) * 100)}%)`,
      });
    } catch (err) {
      console.error('Photo upload error:', err);

      if (!online || (err instanceof TypeError && err.message.includes('fetch'))) {
        toast({
          title: 'Sin conexión',
          description: 'La foto se ha guardado localmente. Se subirá cuando recupere la conexión.',
          duration: 3000,
        });
        return;
      }

      toast({
        title: 'Error al subir fotografía',
        description: err instanceof Error ? err.message : 'No se pudo subir la fotografía',
        variant: 'destructive',
      });
    } finally {
      setUploadingFields(prev => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async (fieldKey: string) => {
    const value = getFieldValue(fieldKey);
    if (isServerPhoto(value)) {
      try {
        const url = new URL(value, window.location.origin);
        const relativePath = url.searchParams.get('path');
        if (relativePath) {
          await fetch(`/api/fotos-preventivo/upload?path=${encodeURIComponent(relativePath)}`, { method: 'DELETE' });
        }
      } catch {
        // Silently fail
      }
    }
    setFieldValue(fieldKey, '');
  };

  // Sanitize a value
  const sanitizeValue = (value: string | undefined | null): string => {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') return String(value);
    return value;
  };

  // Render a single form field based on type
  const renderField = (field: FormField, compact = false) => {
    const rawValue = getFieldValue(field.key);
    const value = sanitizeValue(rawValue);
    const isEdited = !!value;
    const prefilled = isPrefilled(field.key);
    const prefilledBorder = prefilled ? 'border-blue-300 ring-1 ring-blue-100' : isEdited ? 'border-primary/30' : '';

    // Check suspicious content
    const hasSuspiciousContent = value.includes('<script') || value.includes('javascript:') || value.includes('onerror=');
    if (hasSuspiciousContent && value) {
      setFieldValue(field.key, value.replace(/<script.*?>|javascript:|onerror=/gi, ''));
    }

    switch (field.type) {
      case 'Text':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder || field.label}
              className={`h-10 text-sm ${prefilledBorder}`}
            />
          </div>
        );

      case 'Number': {
        const numericValue = value === '' || value === undefined || /^-?\d+$/.test(value) ? value : '';
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Input
              type="number"
              value={numericValue}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder || '0'}
              className={`h-10 text-sm ${prefilledBorder}`}
            />
          </div>
        );
      }

      case 'Decimal': {
        const decimalValue = value === '' || value === undefined || /^-?\d+(\.\d+)?$/.test(value) ? value : '';
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={decimalValue}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder || '0.00'}
              className={`h-10 text-sm ${prefilledBorder}`}
            />
          </div>
        );
      }

      case 'Enum': {
        const hasMatch = !value || (field.options && field.options.includes(value));
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            {hasMatch ? (
              <Select
                value={value || undefined}
                onValueChange={(v) => setFieldValue(field.key, v)}
              >
                <SelectTrigger className={`h-10 text-sm ${prefilledBorder}`}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  value={value}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  className={`h-10 text-sm flex-1 ${prefilledBorder}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
                  onClick={() => setFieldValue(field.key, '')}
                  title="Limpiar valor para usar el selector"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      }

      case 'EnumList':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <EnumListField
              options={field.options || []}
              value={value}
              onChange={(v) => setFieldValue(field.key, v)}
            />
          </div>
        );

      case 'Color': {
        const colorOptions = field.options || ['Baja', 'Media', 'Alta', 'Urgente'];
        const selectedColor = COLOR_MAP[value];
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => {
                const colorCfg = COLOR_MAP[opt];
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFieldValue(field.key, opt)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isSelected && colorCfg
                        ? `${colorCfg.bg} ${colorCfg.text} ${colorCfg.border} ring-2 ring-offset-1 shadow-sm`
                        : isSelected
                        ? 'bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20 ring-offset-1'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {colorCfg && <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.dot}`} />}
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'LongText':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Textarea
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder || field.label}
              rows={3}
              className={`text-sm resize-none ${prefilledBorder}`}
            />
          </div>
        );

      case 'Phone':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Input
              type="tel"
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder || '600 000 000'}
              className={`h-10 text-sm ${prefilledBorder}`}
            />
          </div>
        );

      case 'Date':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <Input
              type="date"
              value={value}
              onChange={(e) => setFieldValue(field.key, e.target.value)}
              className={`h-10 text-sm ${prefilledBorder}`}
            />
          </div>
        );

      case 'LatLong':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {field.label}
            </Label>
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => setFieldValue(field.key, e.target.value)}
                placeholder="Lat, Lng"
                className="h-10 text-sm flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 border-primary/20 hover:bg-primary/5 shrink-0"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFieldValue(field.key, `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                      },
                      () => {
                        toast({ title: 'Error', description: 'No se pudo obtener la ubicación', variant: 'destructive' });
                      }
                    );
                  }
                }}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'Show':
        return (
          <div key={field.key} className="py-2">
            <p className={`text-xs font-medium leading-relaxed ${
              field.label.startsWith('➢') ? 'text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/10' :
              field.label.startsWith('Nota:') ? 'text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100' :
              field.label.endsWith('.') ? 'text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md font-medium text-[11px]' :
              'text-muted-foreground italic'
            }`}>
              {field.label}
            </p>
          </div>
        );

      case 'Ref':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={value}
                readOnly
                placeholder={field.placeholder || 'Se completa automáticamente'}
                className="h-10 text-sm bg-gray-50 border-gray-200 cursor-default"
              />
              <Badge variant="secondary" className="text-[9px] shrink-0 bg-gray-100 text-gray-500">AUTO</Badge>
            </div>
          </div>
        );

      case 'Image':
      case 'Photo': {
        const isUploading = uploadingFields.has(field.key);
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
              {prefilled && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 font-semibold leading-none ml-1">DC</span>}
              {isServerPhoto(value) && <span className="text-[9px] px-1 py-0.5 rounded bg-green-100 text-green-600 font-semibold leading-none ml-1">Servidor</span>}
            </Label>
            {isUploading ? (
              <div className="w-full h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center bg-primary/5">
                <Loader2 className="h-6 w-6 text-primary animate-spin mb-1" />
                <span className="text-xs text-primary">Comprimiendo y subiendo...</span>
              </div>
            ) : value ? (
              <div className="space-y-1.5">
                <div className="relative">
                  <img
                    src={getImageSrc(value)}
                    alt={field.label}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 border-primary/20 hover:bg-primary/5 text-primary text-xs"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.capture = 'environment';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          handlePhotoDelete(field.key).then(() => {
                            handlePhotoCapture(file, field.key, field.label);
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Repetir
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={async () => {
                      await handlePhotoDelete(field.key);
                      toast({ title: 'Fotografía eliminada', description: 'Puede volver a capturar la fotografía' });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 border-primary/20 hover:bg-primary/5 flex-1"
                  disabled={!selectedCentroData}
                  onClick={() => {
                    if (!selectedCentroData) {
                      toast({ title: 'Centro requerido', description: 'Seleccione un centro antes de tomar fotografías', variant: 'destructive' });
                      return;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handlePhotoCapture(file, field.key, field.label);
                    };
                    input.click();
                  }}
                >
                  <Camera className="h-4 w-4 mr-1.5" /> Capturar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 border-primary/20 hover:bg-primary/5"
                  disabled={!selectedCentroData}
                  onClick={() => {
                    if (!selectedCentroData) {
                      toast({ title: 'Centro requerido', description: 'Seleccione un centro antes de tomar fotografías', variant: 'destructive' });
                      return;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handlePhotoCapture(file, field.key, field.label);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!selectedCentroData && !value && (
              <p className="text-[10px] text-amber-600">Seleccione un centro para habilitar las fotos</p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Render a section's content
  const renderSectionContent = (section: FormSection) => {
    const visibleFields = section.fields.filter(f => isVisible(f, fields));
    const visibleSubsections = section.subsections
      .filter(sub => isVisible(sub, fields))
      .map(sub => ({
        ...sub,
        fields: sub.fields.filter(f => isVisible(f, fields)),
      }));

    return (
      <div className="space-y-4">
        {visibleFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleFields.map(field => renderField(field))}
          </div>
        )}

        {visibleSubsections.map(subsection => {
          const isExpanded = expandedSubsections[subsection.key] !== false;
          return (
            <div key={subsection.key} className="mt-2">
              <button
                type="button"
                onClick={() => toggleSubsection(subsection.key)}
                className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-primary" />
                )}
                <span className="text-xs font-bold tracking-wide text-primary uppercase">
                  {subsection.label}
                </span>
                <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary">
                  {subsection.fields.length} campos
                </Badge>
              </button>

              {isExpanded && (
                <div className="mt-3 pl-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subsection.fields.map(field => renderField(field))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Nueva Tarea</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] sm:text-xs">
                {fields['fecha'] ? new Date(fields['fecha']).getFullYear() : new Date().getFullYear()}
              </Badge>
              {/* Online/Offline indicator */}
              {online ? (
                <Badge className="text-[9px] sm:text-[10px] h-5 bg-green-100 text-green-700 border-green-200 shrink-0">
                  <Wifi className="h-2.5 w-2.5 mr-0.5" /> Online
                </Badge>
              ) : (
                <Badge className="text-[9px] sm:text-[10px] h-5 bg-orange-100 text-orange-700 border-orange-200 shrink-0 animate-pulse">
                  <WifiOff className="h-2.5 w-2.5 mr-0.5" /> Sin conexión
                </Badge>
              )}
              {autosaveTime && (
                <Badge className="text-[9px] sm:text-[10px] h-5 bg-gray-100 text-gray-500 border-gray-200 shrink-0 hidden sm:inline-flex">
                  {isAutosaving ? <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" /> : <Cloud className="h-2.5 w-2.5 mr-0.5" />}
                  {isAutosaving ? 'Guardando...' : autosaveTime}
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge className="text-[9px] sm:text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200 shrink-0">
                  <RefreshCw className={`h-2.5 w-2.5 mr-0.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
                  <span className="sm:hidden">{pendingCount}</span>
                </Badge>
              )}
            </div>
            {selectedCentroData ? (
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {selectedCentroData.nombre} — {selectedCentroData.codigo}
                </p>
                {prefilledFields.size > 0 && (
                  <Badge className="text-[9px] sm:text-[10px] h-5 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 shrink-0">
                    <span className="hidden sm:inline">{prefilledFields.size} campos de Datos Centros</span>
                    <span className="sm:hidden">{prefilledFields.size} DC</span>
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-amber-600 mt-0.5">
                Seleccione un centro para comenzar
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-end gap-2">
          {pendingCount > 0 && online && !isSyncing && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncPendingSubmissions}
              className="border-amber-200 hover:bg-amber-50 text-amber-700 w-full sm:w-auto"
              title="Sincronizar envíos pendientes"
            >
              <RefreshCw className="h-4 w-4 sm:mr-1" /> <span className="sm:inline">Sincronizar ({pendingCount})</span>
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('pendiente')}
              disabled={isLoading}
              className="flex-1 sm:flex-none border-primary/20 hover:bg-primary/5"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('enviado')}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Enviar
            </Button>
          </div>
        </div>
      </div>

      {/* Centro Selector + Metadata Row */}
      <Card className="border shadow-sm mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Centro selector */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Centro <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCentroSearch(!showCentroSearch)}
                  className={`w-full h-10 px-3 text-left text-sm rounded-md border ${
                    selectedCentroData ? 'border-primary/30 bg-primary/5' : 'border-input'
                  } flex items-center justify-between hover:border-primary/40 transition-colors`}
                >
                  <span className={selectedCentroData ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedCentroData
                      ? `${selectedCentroData.nombre} (${selectedCentroData.codigo})`
                      : 'Seleccionar centro...'}
                  </span>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>

                {showCentroSearch && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b">
                      <Input
                        autoFocus
                        value={centroSearchQuery}
                        onChange={(e) => setCentroSearchQuery(e.target.value)}
                        placeholder="Buscar centro..."
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-52">
                      {filteredCentros.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3 text-center">No se encontraron centros</p>
                      ) : (
                        filteredCentros.map(centro => (
                          <button
                            key={centro.codigo}
                            type="button"
                            onClick={() => handleSelectCentro(centro)}
                            className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors border-b last:border-b-0"
                          >
                            <p className="text-sm font-medium text-foreground truncate">{centro.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{centro.codigo}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{centro.provincia}</span>
                              {centro.prioridad && (
                                <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200">
                                  {centro.prioridad}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Técnico */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Técnico <span className="text-red-500">*</span>
              </Label>
              <Select
                value={(() => {
                  const tecnicoName = fields['tecnico'] || '';
                  const emp = employees.find(e => e.name === tecnicoName);
                  return emp?.id || '';
                })()}
                onValueChange={(value) => {
                  const emp = employees.find(e => e.id === value);
                  setFieldValue('tecnico', emp?.name || '');
                }}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Técnico" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={fields['fecha'] || ''}
                onChange={(e) => setFieldValue('fecha', e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline Mode Banner */}
      {!online && (
        <div className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-orange-800">Modo sin conexión</h3>
              <p className="text-xs text-orange-700 mt-1">
                Los datos se guardan localmente y se enviarán cuando recupere la conexión.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Campos requeridos</span>
          </div>
          <ul className="list-disc list-inside">
            {validationErrors.map((err, i) => (
              <li key={i} className="text-xs text-red-600">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Navigation Slider */}
      <div className="mb-5">
        <div ref={tabScrollRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max pb-2">
            {formSections.map((section, idx) => {
              const stats = getSectionStats(section);
              const isActive = activeTab === idx;
              const Icon = ICON_MAP[section.icon] || FileText;
              const progressPct = stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0;

              return (
                <button
                  key={section.key}
                  onClick={() => setActiveTab(idx)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap min-w-[110px]
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                      : stats.filled > 0
                        ? 'bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30'
                        : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground hover:border-muted-foreground/20'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : ''}`} />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="leading-tight">{section.label}</span>
                    {stats.total > 0 && (
                      <div className="flex items-center gap-1.5 w-full">
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isActive ? 'bg-primary-foreground' : 'bg-primary/60'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className={`text-[9px] font-semibold tabular-nums ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {progressPct}%
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Section Content */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          {formSections[activeTab] && (() => {
            const section = formSections[activeTab];
            if (!isVisible(section, fields)) return (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <EyeOff className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-muted-foreground">Esta sección está oculta según las condiciones actuales</p>
              </div>
            );
            return (
              <>
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ICON_MAP[section.icon] || FileText;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                    <h2 className="text-base font-semibold text-foreground">
                      {section.label}
                    </h2>
                  </div>
                  {(() => {
                    const stats = getSectionStats(section);
                    return (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.filled / stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {stats.filled}/{stats.total}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {renderSectionContent(section)}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="mt-5 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
          disabled={activeTab === 0}
          className="border-border hover:bg-muted flex-1 sm:flex-none h-10 gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1.5 flex-1 justify-center">
          {formSections.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === activeTab
                  ? 'w-6 bg-primary'
                  : getSectionStats(formSections[idx]).filled > 0
                    ? 'w-2 bg-primary/40 hover:bg-primary/60'
                    : 'w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <div className="text-xs font-medium text-muted-foreground shrink-0 px-2 py-1 rounded-lg bg-muted tabular-nums">
          {activeTab + 1} / {formSections.length}
        </div>

        <Button
          type="button"
          onClick={() => setActiveTab(Math.min(formSections.length - 1, activeTab + 1))}
          disabled={activeTab === formSections.length - 1}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none h-10 gap-1.5 shadow-md shadow-primary/20"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <span className="sm:hidden">Sig.</span>
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Click outside to close centro search */}
      {showCentroSearch && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowCentroSearch(false); setCentroSearchQuery(''); }}
        />
      )}
    </div>
  );
}

// ==========================================
// EnumList field component (multi-select with checkboxes)
// ==========================================
function EnumListField({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const safeValue = value && typeof value === 'string' ? value : '';
  const selectedValues = safeValue ? safeValue.split(',').filter(Boolean) : [];

  const toggleOption = (opt: string) => {
    const newValues = selectedValues.includes(opt)
      ? selectedValues.filter(v => v !== opt)
      : [...selectedValues, opt];
    onChange(newValues.join(','));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 text-left text-sm rounded-md border border-input flex items-center justify-between hover:border-primary/40 transition-colors"
      >
        <span className={selectedValues.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedValues.length > 0 ? selectedValues.join(', ') : 'Seleccionar...'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex items-center gap-2 text-sm"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedValues.includes(opt)
                  ? 'bg-primary border-primary'
                  : 'border-gray-300'
              }`}>
                {selectedValues.includes(opt) && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
