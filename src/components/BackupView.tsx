'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import {
  HardDrive, Download, Upload, Trash2, ArrowLeft, Shield, Building2,
  Users, Car, ClipboardCheck, ClipboardList, CheckCircle2, AlertTriangle,
  Clock, FileJson, Loader2, Plus, RotateCcw, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Section definitions matching the backend
const SECTIONS = [
  { key: 'empresas' as const, label: 'Empresas y SubEmpresas', icon: Building2, color: 'text-blue-500', desc: 'Empresas, sub-empresas y su configuración' },
  { key: 'centros' as const, label: 'Centros', icon: Shield, color: 'text-cyan-500', desc: 'Centros e instalaciones con todos sus datos' },
  { key: 'empleados' as const, label: 'Empleados', icon: Users, color: 'text-purple-500', desc: 'Usuarios, técnicos y personal del sistema' },
  { key: 'vehiculos' as const, label: 'Vehículos', icon: Car, color: 'text-amber-500', desc: 'Vehículos, asignaciones y mantenimientos' },
  { key: 'preventivos' as const, label: 'Preventivos', icon: ClipboardCheck, color: 'text-teal-500', desc: 'Inspecciones preventivas y sus fotografías' },
  { key: 'tareas' as const, label: 'Tareas', icon: ClipboardList, color: 'text-rose-500', desc: 'Tareas correctivas, instalaciones y sus fotografías' },
];

type SectionKey = 'empresas' | 'centros' | 'empleados' | 'vehiculos' | 'preventivos' | 'tareas';

interface BackupInfo {
  version: string;
  timestamp: string;
  filename: string;
  sections: Record<SectionKey, boolean>;
  counts: Record<string, number>;
  fileSize: number;
}

interface CurrentCounts {
  empresas: number;
  subEmpresas: number;
  centros: number;
  empleados: number;
  vehiculos: number;
  preventivos: number;
  tareas: number;
  fotoPreventivos: number;
  fotoTareas: number;
}

export default function BackupView() {
  const { currentUser, token } = useAppStore();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [currentCounts, setCurrentCounts] = useState<CurrentCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedSections, setSelectedSections] = useState<SectionKey[]>([]);
  const [description, setDescription] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [importSections, setImportSections] = useState<SectionKey[]>([]);
  const [importSelectAll, setImportSelectAll] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Result state
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [progress, setProgress] = useState(0);

  // Expanded backup details
  const [expandedBackup, setExpandedBackup] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'restore' | 'history'>('create');

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setCurrentCounts(data.currentCounts || null);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  // Toggle section selection for export
  const toggleSection = (key: SectionKey) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedSections([]);
    } else {
      setSelectedSections(SECTIONS.map(s => s.key));
    }
    setSelectAll(!selectAll);
  };

  // Toggle section selection for import
  const toggleImportSection = (key: SectionKey) => {
    setImportSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const toggleImportSelectAll = () => {
    if (importSelectAll) {
      setImportSections([]);
    } else {
      const availableSections = SECTIONS.filter(s => importData?.sections?.[s.key]).map(s => s.key);
      setImportSections(availableSections);
    }
    setImportSelectAll(!importSelectAll);
  };

  // Create backup
  const handleExport = async () => {
    if (selectedSections.length === 0) return;
    setExporting(true);
    setProgress(10);
    setResultMessage(null);

    try {
      setProgress(30);
      const res = await fetch('/api/backup?action=export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sections: selectedSections,
          description,
        }),
      });
      setProgress(80);

      const data = await res.json();
      setProgress(100);

      if (res.ok) {
        setResultMessage({ type: 'success', text: `Copia de seguridad creada: ${data.backup.filename} (${data.backup.fileSizeFormatted})` });
        setSelectedSections([]);
        setDescription('');
        setSelectAll(false);
        fetchBackups();
        setActiveTab('history');
      } else {
        setResultMessage({ type: 'error', text: data.error || 'Error al crear la copia de seguridad' });
      }
    } catch (error) {
      setResultMessage({ type: 'error', text: 'Error de conexión al crear la copia de seguridad' });
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  // Download backup - re-export and trigger browser download
  const handleDownload = async (backup: BackupInfo) => {
    try {
      // Get the sections that were included in this backup
      const sections = Object.entries(backup.sections)
        .filter(([, included]) => included)
        .map(([key]) => key as SectionKey);

      if (sections.length === 0) {
        setResultMessage({ type: 'error', text: 'No se encontraron secciones en esta copia' });
        return;
      }

      setResultMessage({ type: 'success', text: 'Preparando descarga...' });

      const res = await fetch('/api/backup?action=export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sections,
          description: `Copia de seguridad - ${formatDate(backup.timestamp)}`,
          download: true,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `copia_seguridad_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setResultMessage({ type: 'success', text: 'Descarga completada' });
      } else {
        setResultMessage({ type: 'error', text: 'Error al descargar. Intenta crear una nueva copia.' });
      }
    } catch (error) {
      setResultMessage({ type: 'error', text: 'Error de conexión al descargar. El servidor puede estar reiniciándose.' });
    }
  };

  // Delete backup
  const handleDelete = (filename: string) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar copia de seguridad',
      description: `¿Estás seguro de que quieres eliminar "${filename}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/backup?filename=${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setResultMessage({ type: 'success', text: 'Copia de seguridad eliminada' });
            fetchBackups();
          } else {
            const data = await res.json();
            setResultMessage({ type: 'error', text: data.error || 'Error al eliminar' });
          }
        } catch {
          setResultMessage({ type: 'error', text: 'Error de conexión' });
        }
      },
    });
  };

  // Restore backup
  const handleImport = () => {
    if (!importData || importSections.length === 0) return;

    const sectionLabels = importSections.map(key => SECTIONS.find(s => s.key === key)?.label).join(', ');

    setConfirmDialog({
      open: true,
      title: '⚠️ Restaurar copia de seguridad',
      description: `Esta acción ELIMINARÁ los datos actuales de las siguientes secciones y los reemplazará con los datos de la copia: ${sectionLabels}. Los datos actuales de estas secciones se perderán. ¿Estás seguro?`,
      onConfirm: async () => {
        setImporting(true);
        setProgress(10);
        setResultMessage(null);

        try {
          setProgress(30);
          const res = await fetch('/api/backup?action=import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              backupData: importData,
              sections: importSections,
            }),
          });
          setProgress(80);

          const data = await res.json();
          setProgress(100);

          if (res.ok) {
            const importDetails = Object.entries(data.importCounts || {})
              .map(([key, count]) => `${key}: ${count}`)
              .join(', ');
            setResultMessage({ type: 'success', text: `Restauración completada. Registros importados: ${importDetails}` });
            setImportFile(null);
            setImportData(null);
            setImportSections([]);
            setImportSelectAll(false);
            fetchBackups();
          } else {
            setResultMessage({ type: 'error', text: data.error || 'Error al restaurar' });
          }
        } catch {
          setResultMessage({ type: 'error', text: 'Error de conexión al restaurar' });
        } finally {
          setImporting(false);
          setTimeout(() => setProgress(0), 2000);
        }
      },
    });
  };

  // Handle file upload for import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setResultMessage({ type: 'error', text: 'Solo se permiten archivos .json' });
      return;
    }

    setImportFile(file);
    setResultMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.data || !data.sections) {
        setResultMessage({ type: 'error', text: 'Formato de archivo de copia de seguridad no válido' });
        setImportFile(null);
        return;
      }

      setImportData(data);
      // Pre-select all available sections
      const availableSections = SECTIONS.filter(s => data.sections?.[s.key]).map(s => s.key);
      setImportSections(availableSections);
      setImportSelectAll(availableSections.length > 0);
    } catch {
      setResultMessage({ type: 'error', text: 'Error al leer el archivo. Asegúrate de que es un archivo JSON válido.' });
      setImportFile(null);
    }
  };

  // Restore from existing backup (from history)
  const handleRestoreFromHistory = async (backup: BackupInfo) => {
    setConfirmDialog({
      open: true,
      title: '⚠️ Restaurar desde historial',
      description: `Se cargará la copia de seguridad "${backup.filename}" para restauración. Los datos se re-exportarán del servidor. ¿Continuar?`,
      onConfirm: async () => {
        try {
          const sections = Object.entries(backup.sections)
            .filter(([, included]) => included)
            .map(([key]) => key as SectionKey);

          if (sections.length === 0) {
            setResultMessage({ type: 'error', text: 'No se encontraron secciones en esta copia' });
            return;
          }

          // Re-export to get the full data
          const res = await fetch('/api/backup?action=export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sections, download: true }),
          });

          if (res.ok) {
            const text = await res.text();
            const data = JSON.parse(text);
            setImportData(data);
            const availableSections = SECTIONS.filter(s => data.sections?.[s.key]).map(s => s.key);
            setImportSections(availableSections);
            setImportSelectAll(availableSections.length > 0);
            setImportFile({ name: backup.filename } as File);
            setActiveTab('restore');
          } else {
            setResultMessage({ type: 'error', text: 'Error al cargar. Intenta subir un archivo manualmente.' });
          }
        } catch {
          setResultMessage({ type: 'error', text: 'Error de conexión. El servidor puede estar reiniciándose.' });
        }
      },
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Get count for a section from current DB
  const getSectionCount = (key: SectionKey): string => {
    if (!currentCounts) return '';
    switch (key) {
      case 'empresas': return `${currentCounts.empresas} empresas, ${currentCounts.subEmpresas} sub-empresas`;
      case 'centros': return `${currentCounts.centros} centros`;
      case 'empleados': return `${currentCounts.empleados} empleados`;
      case 'vehiculos': return `${currentCounts.vehiculos} vehículos`;
      case 'preventivos': return `${currentCounts.preventivos} preventivos, ${currentCounts.fotoPreventivos} fotos`;
      case 'tareas': return `${currentCounts.tareas} tareas, ${currentCounts.fotoTareas} fotos`;
      default: return '';
    }
  };

  // Get count from backup data for import display
  const getBackupSectionCount = (key: SectionKey): string => {
    if (!importData?.counts) return '';
    const counts = importData.counts;
    switch (key) {
      case 'empresas': return `${counts.empresas || 0} empresas, ${counts.subEmpresas || 0} sub-empresas`;
      case 'centros': return `${counts.centros || 0} centros`;
      case 'empleados': return `${counts.empleados || 0} empleados`;
      case 'vehiculos': return `${counts.vehiculos || 0} vehículos`;
      case 'preventivos': return `${counts.preventivos || 0} preventivos, ${counts.fotoPreventivos || 0} fotos`;
      case 'tareas': return `${counts.tareas || 0} tareas, ${counts.fotoTareas || 0} fotos`;
      default: return '';
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().setCurrentView('panel-control')} className="text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Panel
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Copias de Seguridad</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestiona las copias de seguridad del sistema</p>
            </div>
          </div>
        </div>

        {/* Result message */}
        {resultMessage && (
          <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {resultMessage.type === 'success'
              ? <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              : <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            }
            <p className="text-sm">{resultMessage.text}</p>
          </div>
        )}

        {/* Progress bar */}
        {(exporting || importing) && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {exporting ? 'Creando copia de seguridad...' : 'Restaurando copia de seguridad...'}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-muted/50 rounded-xl">
          {[
            { key: 'create' as const, label: 'Crear Copia', icon: Plus },
            { key: 'restore' as const, label: 'Restaurar', icon: RotateCcw },
            { key: 'history' as const, label: 'Historial', icon: Clock },
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
            </button>
          ))}
        </div>

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-500" />
                Crear Nueva Copia de Seguridad
              </CardTitle>
              <CardDescription>Selecciona las secciones que deseas incluir en la copia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <Label className="text-sm font-medium cursor-pointer" onClick={toggleSelectAll}>
                  Seleccionar todo
                </Label>
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                />
              </div>

              {/* Section checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTIONS.map(section => {
                  const Icon = section.icon;
                  const isSelected = selectedSections.includes(section.key);
                  const count = getSectionCount(section.key);
                  return (
                    <button
                      key={section.key}
                      onClick={() => toggleSection(section.key)}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-border bg-card'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary/10' : 'bg-muted/50'
                      }`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : section.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{section.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.desc}</p>
                        {count && (
                          <Badge variant="secondary" className="mt-1.5 text-[10px]">
                            {count}
                          </Badge>
                        )}
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSection(section.key)}
                        className="mt-1"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descripción (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Añade una descripción para identificar esta copia..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Selected count and export button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {selectedSections.length === 0
                    ? 'Selecciona al menos una sección'
                    : `${selectedSections.length} sección${selectedSections.length > 1 ? 'es' : ''} seleccionada${selectedSections.length > 1 ? 's' : ''}`
                  }
                </p>
                <Button
                  onClick={handleExport}
                  disabled={selectedSections.length === 0 || exporting}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Crear Copia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESTORE TAB */}
        {activeTab === 'restore' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-500" />
                Restaurar Copia de Seguridad
              </CardTitle>
              <CardDescription>Carga un archivo de copia de seguridad para restaurar los datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">¡Atención!</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Restaurar una copia de seguridad eliminará los datos actuales de las secciones seleccionadas y los reemplazará con los datos del archivo. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              {/* File upload */}
              {!importData ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <FileJson className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona un archivo de copia de seguridad (.json)
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    Cargar Archivo
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {/* Loaded file info */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Archivo cargado correctamente</p>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                      <p>Fecha de la copia: {formatDate(importData.timestamp)}</p>
                      <p>Archivo: {importFile?.name}</p>
                      {importData.description && <p>Descripción: {importData.description}</p>}
                    </div>
                  </div>

                  {/* Section selection for import */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <Label className="text-sm font-medium cursor-pointer" onClick={toggleImportSelectAll}>
                        Seleccionar todas las secciones disponibles
                      </Label>
                      <Checkbox
                        checked={importSelectAll}
                        onCheckedChange={toggleImportSelectAll}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SECTIONS.map(section => {
                        const Icon = section.icon;
                        const isAvailable = importData.sections?.[section.key];
                        const isSelected = importSections.includes(section.key);
                        const count = getBackupSectionCount(section.key);

                        if (!isAvailable) return null;

                        return (
                          <button
                            key={section.key}
                            onClick={() => toggleImportSection(section.key)}
                            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                                : 'border-border/50 hover:border-border bg-card'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted/50'
                            }`}>
                              <Icon className={`h-5 w-5 ${isSelected ? 'text-amber-600' : section.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground">{section.label}</p>
                              {count && (
                                <Badge variant="secondary" className="mt-1.5 text-[10px]">
                                  {count}
                                </Badge>
                              )}
                            </div>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleImportSection(section.key)}
                              className="mt-1"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Import actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportFile(null);
                        setImportData(null);
                        setImportSections([]);
                        setImportSelectAll(false);
                      }}
                      className="gap-2"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importSections.length === 0 || importing}
                      variant="destructive"
                      className="gap-2"
                    >
                      {importing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Restaurar ({importSections.length} secciones)
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Historial de Copias
                  </CardTitle>
                  <CardDescription>Copias de seguridad almacenadas en el servidor</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchBackups} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-12">
                  <HardDrive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay copias de seguridad</p>
                  <p className="text-xs text-muted-foreground mt-1">Crea tu primera copia desde la pestaña &quot;Crear Copia&quot;</p>
                </div>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {backups.map(backup => (
                      <div
                        key={backup.filename}
                        className="border border-border/50 rounded-xl p-4 hover:border-border transition-colors"
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {formatDate(backup.timestamp)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {formatFileSize(backup.fileSize)}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  v{backup.version}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(backup)}
                              title="Descargar"
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreFromHistory(backup)}
                              title="Restaurar"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(backup.filename)}
                              title="Eliminar"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Sections included */}
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedBackup(expandedBackup === backup.filename ? null : backup.filename)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedBackup === backup.filename ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            Secciones incluidas
                          </button>

                          {expandedBackup === backup.filename && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {SECTIONS.map(section => {
                                const Icon = section.icon;
                                const isIncluded = backup.sections?.[section.key];
                                return (
                                  <div
                                    key={section.key}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                                      isIncluded
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-muted/30 text-muted-foreground/50 line-through'
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                    {section.label}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Record counts summary */}
                        {backup.counts && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(backup.counts).map(([key, count]) => (
                              <span key={key} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {key}: {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Current DB summary */}
              {currentCounts && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      Estado actual de la base de datos
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'Empresas', count: currentCounts.empresas },
                        { label: 'Sub-Empresas', count: currentCounts.subEmpresas },
                        { label: 'Centros', count: currentCounts.centros },
                        { label: 'Empleados', count: currentCounts.empleados },
                        { label: 'Vehículos', count: currentCounts.vehiculos },
                        { label: 'Preventivos', count: currentCounts.preventivos },
                        { label: 'Tareas', count: currentCounts.tareas },
                        { label: 'Fotos Prev.', count: currentCounts.fotoPreventivos },
                        { label: 'Fotos Tareas', count: currentCounts.fotoTareas },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <Badge variant="secondary" className="text-[10px]">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirm Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, open: false }));
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
