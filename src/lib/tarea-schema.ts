// Tarea form field types — reuses same type system as preventivo-schema
export type FieldType = 'Text' | 'Number' | 'Decimal' | 'Enum' | 'EnumList' | 'LongText' | 'Phone' | 'Date' | 'LatLong' | 'Photo' | 'Show' | 'Ref' | 'Image' | 'Color';

// Re-export from preventivo-schema for shared types
export type { VisibilityCondition, ConditionOperator, FormField, FormSubsection, FormSection } from './preventivo-schema';
import { FormField, FormSubsection, FormSection, VisibilityCondition } from './preventivo-schema';

// ============================================================
// COMMON ENUM OPTIONS FOR TAREAS
// ============================================================
const PROVINCIA = ['Badajoz', 'Cáceres'];
const TIPO_CENTRO = ['INDOOR', 'OUTDOOR'];
const PRIORIDAD = ['P1', 'P3', 'P3 AIRE'];
const PROYECTO = ['BABEL', 'BABIECA', 'BUENAVISTA'];
const ESTADO_TAREA = ['Pendiente', 'Realizado'];
const BLACK_LIST = ['Sí', 'No'];
const TIPO_TAREA = [
  'Acometidas', 'Baterias', 'Cambio de componentes', 'Cambio descargadores',
  'Cambio remota', 'Candados/Cerraduras', 'Cartelería', 'Caseta',
  'Clima', 'Contador', 'Desbroce', 'EXTRACCIÓN', 'Estación de continua',
  'Extincion de roedores', 'Falso contacto - Alarma en remota', 'Filtro FC',
  'Fusibles', 'GameSystem', 'Instalacion bombin', 'Instalacion de Rectificador',
  'Instalación Rearmable', 'Instalación de Diodo para remota', 'Luminaria',
  'Preventivo', 'Raticida', 'Rearmable', 'Reconfiguración',
  'Recopilación de información', 'Reparacion de vallado', 'Reparacion electrica',
  'Reparacion monolito', 'Reparo', 'Retirada de arboles/zarzas/arbustos',
  'Retirar Carteleria', 'Revisión Alarmas Remota', 'Sensor puerta',
  'sonda temperatura',
];
const PRIORIDAD_TAREA = ['Green', 'Yellow', 'Red'];
const PERIODO = ['Mensual', 'Trimestral', 'Semestral', 'Anual', 'Puntual', 'Otro'];

// ============================================================
// TAREA FORM SECTIONS
// ============================================================
export const TAREA_SECTIONS: FormSection[] = [

  // ==========================================
  // 1. DATOS DEL CENTRO
  // ==========================================
  {
    key: 'datos_centro',
    label: 'Datos del Centro',
    icon: 'Building2',
    color: 'text-blue-700',
    fields: [
      { key: 'rowNumber', label: 'Nº Fila', type: 'Number', placeholder: 'Nº de fila' },
      { key: 'nombreCentro', label: 'Nombre del centro', type: 'Ref', required: true },
      { key: 'codigoInfo', label: 'Código info', type: 'Text', placeholder: 'Código de información' },
      { key: 'provincia', label: 'Provincia', type: 'Enum', options: PROVINCIA },
      { key: 'tipoCentro', label: 'Tipo centro', type: 'Enum', options: TIPO_CENTRO },
      { key: 'prioridad', label: 'Prioridad', type: 'Enum', options: PRIORIDAD },
      { key: 'proyecto', label: 'Proyecto', type: 'Enum', options: PROYECTO },
      { key: 'localizacion', label: 'Localización', type: 'LatLong' },
    ],
    subsections: [],
  },

  // ==========================================
  // 2. DATOS DE LA TAREA
  // ==========================================
  {
    key: 'datos_tarea',
    label: 'Datos de la Tarea',
    icon: 'ClipboardList',
    color: 'text-indigo-700',
    fields: [
      { key: 'estado', label: 'Estado', type: 'Enum', options: ESTADO_TAREA, required: true },
      { key: 'blackList', label: 'Black List', type: 'Enum', options: BLACK_LIST },
      { key: 'tipoTarea', label: 'Tipo de tarea', type: 'Enum', options: TIPO_TAREA, required: true },
      { key: 'prioridadTarea', label: 'Prioridad tarea', type: 'Color', required: true },
      { key: 'fecha', label: 'Fecha', type: 'Date', required: true },
      { key: 'fechaRealizacion', label: 'Fecha de realización', type: 'Date' },
      { key: 'tecnico', label: 'Técnico', type: 'Ref', required: true },
      { key: 'trabajoRealizar', label: 'Trabajo a realizar', type: 'LongText', required: true, placeholder: 'Describir el trabajo a realizar...' },
      { key: 'tecnicoRealiza', label: 'Técnico que realiza el trabajo', type: 'Ref' },
      { key: 'trabajoRealizado', label: 'Trabajo realizado', type: 'LongText', placeholder: 'Describir el trabajo realizado...' },
    ],
    subsections: [],
  },

  // ==========================================
  // 3. FOTOGRAFÍAS
  // ==========================================
  {
    key: 'fotografias',
    label: 'Fotografías',
    icon: 'Camera',
    color: 'text-emerald-700',
    fields: [
      { key: 'fotografia1', label: 'Fotografía 1', type: 'Image' },
      { key: 'fotografia2', label: 'Fotografía 2', type: 'Image' },
      { key: 'fotografia3', label: 'Fotografía 3', type: 'Image' },
      { key: 'fotografia4', label: 'Fotografía 4', type: 'Image' },
      { key: 'fotografia5', label: 'Fotografía 5', type: 'Image' },
      { key: 'fotografia6', label: 'Fotografía 6', type: 'Image' },
      { key: 'fotografia7', label: 'Fotografía 7', type: 'Image' },
      { key: 'fotografia8', label: 'Fotografía 8', type: 'Image' },
      { key: 'fotografia9', label: 'Fotografía 9', type: 'Image' },
      { key: 'fotografia10', label: 'Fotografía 10', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 4. INFORMACIÓN ADICIONAL
  // ==========================================
  {
    key: 'info_adicional',
    label: 'Información Adicional',
    icon: 'FileText',
    color: 'text-amber-700',
    fields: [
      { key: 'computedKey', label: 'Clave calculada', type: 'Text', placeholder: 'Se genera automáticamente' },
      { key: 'periodo', label: 'Periodo', type: 'Enum', options: PERIODO },
      { key: 'anio', label: 'Año', type: 'Text', placeholder: '2025' },
    ],
    subsections: [],
  },
];

// ============================================================
// HELPER FUNCTIONS — mirrors preventivo-schema
// ============================================================

/** Count total non-Show fields in a section */
export function countSectionFields(section: FormSection): { total: number; filled: number } {
  let total = 0;
  let filled = 0;
  const countField = (f: FormField) => {
    if (f.type === 'Show') return;
    total++;
  };
  section.fields.forEach(countField);
  section.subsections.forEach(sub => sub.fields.forEach(countField));
  return { total, filled };
}

/** Check if a field/subsection/section is visible based on conditions */
export function isVisible(
  item: { visible?: boolean; conditions?: VisibilityCondition[]; conditionLogic?: 'and' | 'or' },
  formFields: Record<string, string>
): boolean {
  if (item.visible === false) return false;
  if (!item.conditions || item.conditions.length === 0) return true;

  const results = item.conditions.map(cond => {
    const fieldValue = formFields[cond.fieldKey] || '';
    switch (cond.operator) {
      case 'equals': return fieldValue === cond.value;
      case 'not_equals': return fieldValue !== cond.value;
      case 'contains': return fieldValue.toLowerCase().includes(cond.value.toLowerCase());
      case 'not_contains': return !fieldValue.toLowerCase().includes(cond.value.toLowerCase());
      case 'is_empty': return !fieldValue || fieldValue.trim() === '';
      case 'is_not_empty': return !!fieldValue && fieldValue.trim() !== '';
      default: return true;
    }
  });

  return item.conditionLogic === 'or'
    ? results.some(Boolean)
    : results.every(Boolean);
}

/** Deep clone sections for mutation */
export function cloneSections(sections: FormSection[]): FormSection[] {
  return JSON.parse(JSON.stringify(sections));
}
