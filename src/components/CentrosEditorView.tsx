'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useCentrosSchemaStore } from '@/lib/centros-schema-store';
import {
  FormSection, FormField, FormSubsection, FieldType, VisibilityCondition, ConditionOperator,
  cloneSections,
} from '@/lib/preventivo-schema';
import { getAllEnumFields } from '@/lib/centros-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Edit, Eye, EyeOff,
  Settings, Save, RotateCcw, ChevronDown, ChevronRight, GripVertical,
  X, Sparkles, Copy, Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Field types for centros (no Photo/Image/Ref needed)
const CENTROS_FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'Text', label: 'Texto', icon: 'Aa' },
  { value: 'Number', label: 'Número', icon: '#' },
  { value: 'Decimal', label: 'Decimal', icon: '#.#' },
  { value: 'Enum', label: 'Selector (único)', icon: '▾' },
  { value: 'EnumList', label: 'Selector (múltiple)', icon: '☑' },
  { value: 'LongText', label: 'Texto largo', icon: '¶' },
  { value: 'Phone', label: 'Teléfono', icon: '☏' },
  { value: 'Date', label: 'Fecha', icon: '📅' },
  { value: 'LatLong', label: 'Coordenadas', icon: '📍' },
  { value: 'Show', label: 'Mostrar texto', icon: '💬' },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'es igual a' },
  { value: 'not_equals', label: 'no es igual a' },
  { value: 'contains', label: 'contiene' },
  { value: 'not_contains', label: 'no contiene' },
  { value: 'is_empty', label: 'está vacío' },
  { value: 'is_not_empty', label: 'no está vacío' },
];

export default function CentrosEditorView() {
  const { setCurrentView } = useAppStore();
  const schemaStore = useCentrosSchemaStore();
  const { toast } = useToast();

  const [editingField, setEditingField] = useState<{
    sectionKey: string;
    subsectionKey: string | null;
    fieldKey: string;
  } | null>(null);
  const [showAddField, setShowAddField] = useState<{
    sectionKey: string;
    subsectionKey: string | null;
  } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddSubsection, setShowAddSubsection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load schema on mount
  useEffect(() => {
    schemaStore.loadSchema();
  }, []);

  const schema = schemaStore.getSchema();
  const isCustomized = schemaStore.isCustomized;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count fields
  const totalFields = useMemo(() => {
    let count = 0;
    schema.forEach(s => {
      count += s.fields.length;
      s.subsections.forEach(sub => { count += sub.fields.length; });
    });
    return count;
  }, [schema]);

  const hiddenFields = useMemo(() => {
    let count = 0;
    schema.forEach(s => {
      s.fields.forEach(f => { if (f.visible === false) count++; });
      s.subsections.forEach(sub => sub.fields.forEach(f => { if (f.visible === false) count++; }));
    });
    return count;
  }, [schema]);

  const conditionalFields = useMemo(() => {
    let count = 0;
    schema.forEach(s => {
      s.fields.forEach(f => { if (f.conditions && f.conditions.length > 0) count++; });
      s.subsections.forEach(sub => sub.fields.forEach(f => { if (f.conditions && f.conditions.length > 0) count++; }));
    });
    return count;
  }, [schema]);

  const handleReset = () => {
    schemaStore.resetToDefault();
    toast({ title: 'Esquema restaurado', description: 'Se ha restaurado el esquema por defecto de Datos Centros' });
  };

  const handleExport = () => {
    const data = JSON.stringify(schema, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centros_schema.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Esquema exportado', description: 'Archivo JSON descargado' });
  };

  // Find a specific field
  const findField = (sectionKey: string, subsectionKey: string | null, fieldKey: string): FormField | undefined => {
    const section = schema.find(s => s.key === sectionKey);
    if (!section) return undefined;
    if (!subsectionKey) {
      return section.fields.find(f => f.key === fieldKey);
    }
    const sub = section.subsections.find(s => s.key === subsectionKey);
    return sub?.fields.find(f => f.key === fieldKey);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('editor')} className="h-10 w-10 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Editor de Datos Centros
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personaliza las secciones, campos, opciones y lógica de los datos de centros
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExport} className="border-blue-200">
            <Copy className="h-4 w-4 mr-1" /> Exportar
          </Button>
          {isCustomized && (
            <Button variant="outline" size="sm" onClick={handleReset} className="border-red-200 text-red-600 hover:bg-red-50">
              <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-blue-100">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-800">{schema.length}</p>
            <p className="text-xs text-muted-foreground">Secciones</p>
          </CardContent>
        </Card>
        <Card className="border-indigo-100">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-indigo-800">{totalFields}</p>
            <p className="text-xs text-muted-foreground">Campos</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-800">{hiddenFields}</p>
            <p className="text-xs text-muted-foreground">Ocultos</p>
          </CardContent>
        </Card>
        <Card className="border-violet-100">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-violet-800">{conditionalFields}</p>
            <p className="text-xs text-muted-foreground">Condicionales</p>
          </CardContent>
        </Card>
      </div>

      {isCustomized && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-700">Esquema personalizado activo</span>
        </div>
      )}

      {/* Sections list */}
      <div className="space-y-3">
        {schema.map((section, sectionIdx) => {
          const isExpanded = expandedSections[section.key] !== false;
          const sectionFieldCount = section.fields.length + section.subsections.reduce((acc, sub) => acc + sub.fields.length, 0);

          return (
            <Card key={section.key} className="border shadow-sm">
              {/* Section Header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-blue-50/50 transition-colors rounded-t-xl"
                onClick={() => toggleSection(section.key)}
              >
                <GripVertical className="h-4 w-4 text-gray-300" />
                {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
                <span className="font-semibold text-sm text-blue-800 flex-1">{section.label}</span>
                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                  {sectionFieldCount} campos
                </Badge>
                {section.visible === false && (
                  <Badge className="text-[10px] bg-gray-100 text-gray-500">OCULTA</Badge>
                )}
                {section.conditions && section.conditions.length > 0 && (
                  <Badge className="text-[10px] bg-violet-100 text-violet-700">CONDICIONAL</Badge>
                )}

                {/* Section actions */}
                <div className="flex items-center gap-0.5 ml-2" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => schemaStore.moveSection(section.key, 'up')}
                    disabled={sectionIdx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => schemaStore.moveSection(section.key, 'down')}
                    disabled={sectionIdx === schema.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => {
                      schemaStore.updateSection(section.key, { visible: section.visible === false ? undefined : false });
                    }}>
                    {section.visible === false ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-blue-500" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => schemaStore.removeSection(section.key)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>

              {/* Section content */}
              {isExpanded && (
                <CardContent className="pt-0 pb-3 px-3">
                  {/* Top-level fields */}
                  <div className="space-y-1">
                    {section.fields.map((field, fieldIdx) => (
                      <FieldRow
                        key={field.key}
                        field={field}
                        sectionKey={section.key}
                        subsectionKey={null}
                        onEdit={() => setEditingField({ sectionKey: section.key, subsectionKey: null, fieldKey: field.key })}
                        onMoveUp={fieldIdx > 0 ? () => schemaStore.moveField(section.key, null, field.key, 'up') : undefined}
                        onMoveDown={fieldIdx < section.fields.length - 1 ? () => schemaStore.moveField(section.key, null, field.key, 'down') : undefined}
                        onToggleVisibility={() => schemaStore.updateField(section.key, null, field.key, { visible: field.visible === false ? undefined : false })}
                        onDelete={() => schemaStore.removeField(section.key, null, field.key)}
                        onToggleRequired={() => schemaStore.updateField(section.key, null, field.key, { required: !field.required })}
                      />
                    ))}

                    {/* Add field button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200"
                      onClick={() => setShowAddField({ sectionKey: section.key, subsectionKey: null })}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Añadir campo
                    </Button>
                  </div>

                  {/* Subsections */}
                  {section.subsections.map((sub, subIdx) => (
                    <div key={sub.key} className="mt-3 ml-2 border-l-2 border-blue-200 pl-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{sub.label}</span>
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600">
                          {sub.fields.length}
                        </Badge>
                        {sub.visible === false && <Badge className="text-[10px] bg-gray-100 text-gray-500">OCULTA</Badge>}
                        <div className="ml-auto flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => schemaStore.updateSubsection(section.key, sub.key, { visible: sub.visible === false ? undefined : false })}>
                            {sub.visible === false ? <EyeOff className="h-3 w-3 text-gray-400" /> : <Eye className="h-3 w-3 text-blue-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => schemaStore.removeSubsection(section.key, sub.key)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {sub.fields.map((field, fieldIdx) => (
                          <FieldRow
                            key={field.key}
                            field={field}
                            sectionKey={section.key}
                            subsectionKey={sub.key}
                            onEdit={() => setEditingField({ sectionKey: section.key, subsectionKey: sub.key, fieldKey: field.key })}
                            onMoveUp={fieldIdx > 0 ? () => schemaStore.moveField(section.key, sub.key, field.key, 'up') : undefined}
                            onMoveDown={fieldIdx < sub.fields.length - 1 ? () => schemaStore.moveField(section.key, sub.key, field.key, 'down') : undefined}
                            onToggleVisibility={() => schemaStore.updateField(section.key, sub.key, field.key, { visible: field.visible === false ? undefined : false })}
                            onDelete={() => schemaStore.removeField(section.key, sub.key, field.key)}
                            onToggleRequired={() => schemaStore.updateField(section.key, sub.key, field.key, { required: !field.required })}
                          />
                        ))}
                        <Button
                          variant="ghost" size="sm"
                          className="w-full h-7 text-xs text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200"
                          onClick={() => setShowAddField({ sectionKey: section.key, subsectionKey: sub.key })}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Añadir campo
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add subsection button */}
                  <Button
                    variant="ghost" size="sm"
                    className="w-full h-8 mt-3 text-xs text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200"
                    onClick={() => setShowAddSubsection(section.key)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Añadir subsección
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Add section button */}
        <Button
          variant="outline"
          className="w-full h-12 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          onClick={() => setShowAddSection(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Añadir nueva sección
        </Button>
      </div>

      {/* ====== DIALOGS ====== */}

      {/* Field Editor Dialog */}
      {editingField && (
        <CentrosFieldEditorDialog
          field={findField(editingField.sectionKey, editingField.subsectionKey, editingField.fieldKey)}
          sectionKey={editingField.sectionKey}
          subsectionKey={editingField.subsectionKey}
          allSections={schema}
          onClose={() => setEditingField(null)}
        />
      )}

      {/* Add Field Dialog */}
      {showAddField && (
        <CentrosAddFieldDialog
          sectionKey={showAddField.sectionKey}
          subsectionKey={showAddField.subsectionKey}
          onClose={() => setShowAddField(null)}
        />
      )}

      {/* Add Section Dialog */}
      {showAddSection && (
        <CentrosAddSectionDialog onClose={() => setShowAddSection(false)} />
      )}

      {/* Add Subsection Dialog */}
      {showAddSubsection && (
        <CentrosAddSubsectionDialog sectionKey={showAddSubsection} onClose={() => setShowAddSubsection(null)} />
      )}
    </div>
  );
}

// ==========================================
// Field Row Component
// ==========================================
function FieldRow({ field, sectionKey, subsectionKey, onEdit, onMoveUp, onMoveDown, onToggleVisibility, onDelete, onToggleRequired }: {
  field: FormField;
  sectionKey: string;
  subsectionKey: string | null;
  onEdit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onToggleRequired: () => void;
}) {
  const typeInfo = CENTROS_FIELD_TYPES.find(t => t.value === field.type) || { icon: '?' };
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors group ${
      field.visible === false ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200'
    }`}>
      <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />

      {/* Type badge */}
      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shrink-0 border border-blue-100">
        {typeInfo.icon}
      </span>

      {/* Label */}
      <span className={`text-sm flex-1 truncate ${field.visible === false ? 'text-gray-400 line-through' : 'text-foreground'}`}>
        {field.label}
      </span>

      {/* Key info */}
      <span className="text-[9px] font-mono text-gray-400 hidden sm:inline">{field.key}</span>

      {/* Badges */}
      {field.required && <Badge className="text-[9px] px-1 py-0 h-4 bg-red-100 text-red-600 border-red-200">REQ</Badge>}
      {field.type === 'Enum' && <Badge className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-600 border-blue-200">{field.options?.length || 0} opts</Badge>}
      {field.type === 'EnumList' && <Badge className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-600 border-blue-200">{field.options?.length || 0} opts</Badge>}
      {field.conditions && field.conditions.length > 0 && (
        <Badge className="text-[9px] px-1 py-0 h-4 bg-violet-100 text-violet-600 border-violet-200">COND</Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}>
            <ArrowUp className="h-3 w-3" />
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}>
            <ArrowDown className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleRequired} title={field.required ? 'Quitar obligatorio' : 'Marcar obligatorio'}>
          <span className={`text-xs font-bold ${field.required ? 'text-red-500' : 'text-gray-300'}`}>*</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleVisibility}>
          {field.visible === false ? <EyeOff className="h-3 w-3 text-gray-400" /> : <Eye className="h-3 w-3 text-blue-500" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
          <Edit className="h-3 w-3 text-blue-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// Field Editor Dialog
// ==========================================
function CentrosFieldEditorDialog({ field, sectionKey, subsectionKey, allSections, onClose }: {
  field: FormField | undefined;
  sectionKey: string;
  subsectionKey: string | null;
  allSections: FormSection[];
  onClose: () => void;
}) {
  const schemaStore = useCentrosSchemaStore();
  const { toast } = useToast();

  // All hooks must be called before any conditional returns
  const [label, setLabel] = useState(field?.label || '');
  const [fieldType, setFieldType] = useState<FieldType>(field?.type || 'Text');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [options, setOptions] = useState<string[]>(field?.options || []);
  const [conditions, setConditions] = useState<VisibilityCondition[]>(field?.conditions || []);
  const [conditionLogic, setConditionLogic] = useState<'and' | 'or'>(field?.conditionLogic || 'and');

  // Enum fields for condition editor
  const enumFields = useMemo(() => getAllEnumFields(allSections), [allSections]);

  // Enum option management
  const [newOption, setNewOption] = useState('');

  // Condition management
  const [condFieldKey, setCondFieldKey] = useState('');
  const [condOperator, setCondOperator] = useState<ConditionOperator>('equals');
  const [condValue, setCondValue] = useState('');

  if (!field) return null;

  const handleSave = () => {
    const updates: Partial<FormField> = {
      label,
      type: fieldType,
      placeholder: placeholder || undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      conditionLogic: conditions.length > 1 ? conditionLogic : undefined,
    };

    // Only update options for Enum/EnumList
    if (fieldType === 'Enum' || fieldType === 'EnumList') {
      updates.options = options;
    } else {
      updates.options = undefined;
    }

    schemaStore.updateField(sectionKey, subsectionKey, field.key, updates);
    toast({ title: 'Campo actualizado', description: `"${label}" guardado correctamente` });
    onClose();
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    const newOptions = [...options, newOption.trim()];
    setOptions(newOptions);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { options: newOptions });
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    const newOptions = options.filter((_, i) => i !== idx);
    setOptions(newOptions);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { options: newOptions });
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { options: newOptions });
  };

  const moveOption = (idx: number, dir: 'up' | 'down') => {
    const newOptions = [...options];
    if (dir === 'up' && idx > 0) {
      [newOptions[idx - 1], newOptions[idx]] = [newOptions[idx], newOptions[idx - 1]];
    } else if (dir === 'down' && idx < newOptions.length - 1) {
      [newOptions[idx], newOptions[idx + 1]] = [newOptions[idx + 1], newOptions[idx]];
    }
    setOptions(newOptions);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { options: newOptions });
  };

  const addCondition = () => {
    if (!condFieldKey) return;
    const newCond: VisibilityCondition = {
      id: `cond-${Date.now()}`,
      fieldKey: condFieldKey,
      operator: condOperator,
      value: condValue,
    };
    const newConds = [...conditions, newCond];
    setConditions(newConds);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { conditions: newConds, conditionLogic: conditions.length > 0 ? conditionLogic : undefined });
    setCondFieldKey('');
    setCondOperator('equals');
    setCondValue('');
  };

  const removeCondition = (id: string) => {
    const newConds = conditions.filter(c => c.id !== id);
    setConditions(newConds);
    schemaStore.updateField(sectionKey, subsectionKey, field.key, { conditions: newConds.length > 0 ? newConds : undefined });
  };

  // Get selected condition field's options
  const selectedCondField = enumFields.find(f => f.key === condFieldKey);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-800 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Campo de Datos Centros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Etiqueta</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-10" />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo de campo</Label>
            <Select value={fieldType} onValueChange={v => setFieldType(v as FieldType)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CENTROS_FIELD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="font-mono mr-2">{t.icon}</span>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Placeholder</Label>
            <Input value={placeholder} onChange={e => setPlaceholder(e.target.value)} placeholder="Texto de ayuda..." className="h-10" />
          </div>

          {/* Enum Options Editor */}
          {(fieldType === 'Enum' || fieldType === 'EnumList') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                Opciones del selector
                <Badge variant="secondary" className="text-[10px]">{options.length}</Badge>
              </Label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-lg p-2 bg-gray-50/50">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1 group">
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => moveOption(idx, 'up')} disabled={idx === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => moveOption(idx, 'down')} disabled={idx === options.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Input
                      value={opt}
                      onChange={e => updateOption(idx, e.target.value)}
                      className="h-7 text-sm flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600" onClick={() => removeOption(idx)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {options.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No hay opciones</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={e => setNewOption(e.target.value)}
                  placeholder="Nueva opción..."
                  className="h-8 text-sm flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') addOption(); }}
                />
                <Button size="sm" onClick={addOption} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Conditional Visibility Editor */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              Visibilidad condicional
            </Label>
            <p className="text-xs text-muted-foreground">
              El campo solo se mostrará cuando se cumplan las condiciones
            </p>

            {/* Existing conditions */}
            {conditions.length > 0 && (
              <div className="space-y-1.5">
                {conditions.map((cond, idx) => {
                  const condField = enumFields.find(f => f.key === cond.fieldKey);
                  return (
                    <div key={cond.id} className="flex items-center gap-1 bg-violet-50 rounded-lg px-2 py-1.5 text-xs">
                      <span className="font-medium text-violet-800">{condField?.label || cond.fieldKey}</span>
                      <span className="text-violet-600">{CONDITION_OPERATORS.find(o => o.value === cond.operator)?.label}</span>
                      {cond.value && <span className="font-semibold text-violet-900">"{cond.value}"</span>}
                      {idx < conditions.length - 1 && (
                        <Select value={conditionLogic} onValueChange={v => setConditionLogic(v as 'and' | 'or')}>
                          <SelectTrigger className="h-5 w-14 text-[10px] border-violet-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="and">Y</SelectItem>
                            <SelectItem value="or">O</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => removeCondition(cond.id)}>
                        <X className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add condition */}
            <div className="bg-gray-50 rounded-lg p-2 space-y-2">
              <Select value={condFieldKey} onValueChange={setCondFieldKey}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Campo a evaluar..." />
                </SelectTrigger>
                <SelectContent>
                  {enumFields.map(f => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={condOperator} onValueChange={v => setCondOperator(v as ConditionOperator)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {condOperator !== 'is_empty' && condOperator !== 'is_not_empty' && (
                selectedCondField?.options ? (
                  <Select value={condValue} onValueChange={setCondValue}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Valor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCondField.options.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={condValue} onChange={e => setCondValue(e.target.value)} placeholder="Valor..." className="h-8 text-xs" />
                )
              )}

              <Button size="sm" onClick={addCondition} className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white w-full" disabled={!condFieldKey}>
                <Plus className="h-3 w-3 mr-1" /> Añadir condición
              </Button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="border-blue-200">Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-1" /> Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Add Field Dialog
// ==========================================
function CentrosAddFieldDialog({ sectionKey, subsectionKey, onClose }: {
  sectionKey: string;
  subsectionKey: string | null;
  onClose: () => void;
}) {
  const schemaStore = useCentrosSchemaStore();
  const { toast } = useToast();

  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('Text');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const generateKey = () => {
    const base = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30);
    return `col_custom_${base}_${Date.now().toString(36)}`;
  };

  const handleAdd = () => {
    if (!label.trim()) {
      toast({ title: 'Error', description: 'La etiqueta es requerida', variant: 'destructive' });
      return;
    }

    const field: FormField = {
      key: generateKey(),
      label: label.trim(),
      type: fieldType,
      options: (fieldType === 'Enum' || fieldType === 'EnumList') ? options : undefined,
      placeholder: '',
    };

    schemaStore.addField(sectionKey, subsectionKey, field);
    toast({ title: 'Campo añadido', description: `"${label}" añadido correctamente` });
    onClose();
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    setOptions([...options, newOption.trim()]);
    setNewOption('');
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-800">Nuevo Campo de Datos Centros</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Etiqueta *</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre del campo" className="h-10" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={fieldType} onValueChange={v => setFieldType(v as FieldType)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CENTROS_FIELD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="font-mono mr-2">{t.icon}</span> {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(fieldType === 'Enum' || fieldType === 'EnumList') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Opciones</Label>
              <div className="space-y-1">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-sm flex-1">{opt}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Nueva opción" className="h-8 text-sm flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') addOption(); }} />
                <Button size="sm" onClick={addOption} className="h-8"><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="border-blue-200">Cancelar</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Añadir campo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Add Section Dialog
// ==========================================
function CentrosAddSectionDialog({ onClose }: { onClose: () => void }) {
  const schemaStore = useCentrosSchemaStore();
  const { toast } = useToast();
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30);
    schemaStore.addSection({
      key,
      label: label.trim(),
      icon: 'FileText',
      color: 'text-blue-700',
      fields: [],
      subsections: [],
    });
    toast({ title: 'Sección añadida', description: `"${label}" creada` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-800">Nueva Sección de Datos Centros</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nombre de la sección *</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Datos Específicos" className="h-10" autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-blue-200">Cancelar</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Crear sección
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Add Subsection Dialog
// ==========================================
function CentrosAddSubsectionDialog({ sectionKey, onClose }: { sectionKey: string; onClose: () => void }) {
  const schemaStore = useCentrosSchemaStore();
  const { toast } = useToast();
  const [label, setLabel] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30);
    schemaStore.addSubsection(sectionKey, {
      key,
      label: label.trim(),
      fields: [],
    });
    toast({ title: 'Subsección añadida', description: `"${label}" creada` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-blue-800">Nueva Subsección</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nombre de la subsección *</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Datos específicos" className="h-10" autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-blue-200">Cancelar</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Crear subsección
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
