import { create } from 'zustand';
import { FORM_SECTIONS, FormSection, cloneSections } from '@/lib/preventivo-schema';

const STORAGE_KEY = 'ec_preventivo_custom_schema';

function loadFromStorage(): FormSection[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return null;
}

function saveToStorage(sections: FormSection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch {}
}

function clearStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

interface SchemaState {
  // The active schema (custom if exists, default otherwise)
  customSchema: FormSection[] | null;
  isCustomized: boolean;

  // Actions
  loadSchema: () => void;
  getSchema: () => FormSection[];
  saveSchema: (sections: FormSection[]) => void;
  resetToDefault: () => void;

  // Field-level mutations
  updateField: (sectionKey: string, subsectionKey: string | null, fieldKey: string, updates: Partial<import('@/lib/preventivo-schema').FormField>) => void;
  addField: (sectionKey: string, subsectionKey: string | null, field: import('@/lib/preventivo-schema').FormField, index?: number) => void;
  removeField: (sectionKey: string, subsectionKey: string | null, fieldKey: string) => void;
  moveField: (sectionKey: string, subsectionKey: string | null, fieldKey: string, direction: 'up' | 'down') => void;

  // Section-level mutations
  updateSection: (sectionKey: string, updates: Partial<FormSection>) => void;
  addSection: (section: FormSection) => void;
  removeSection: (sectionKey: string) => void;
  moveSection: (sectionKey: string, direction: 'up' | 'down') => void;

  // Subsection-level mutations
  addSubsection: (sectionKey: string, subsection: import('@/lib/preventivo-schema').FormSubsection) => void;
  removeSubsection: (sectionKey: string, subsectionKey: string) => void;
  updateSubsection: (sectionKey: string, subsectionKey: string, updates: Partial<import('@/lib/preventivo-schema').FormSubsection>) => void;
  moveSubsectionField: (sectionKey: string, subsectionKey: string, fieldKey: string, direction: 'up' | 'down') => void;

  // Enum options mutations
  addEnumOption: (sectionKey: string, subsectionKey: string | null, fieldKey: string, option: string) => void;
  removeEnumOption: (sectionKey: string, subsectionKey: string | null, fieldKey: string, optionIndex: number) => void;
  updateEnumOption: (sectionKey: string, subsectionKey: string | null, fieldKey: string, optionIndex: number, newValue: string) => void;
  moveEnumOption: (sectionKey: string, subsectionKey: string | null, fieldKey: string, optionIndex: number, direction: 'up' | 'down') => void;

  // Condition mutations
  addCondition: (sectionKey: string, subsectionKey: string | null, fieldKey: string, condition: import('@/lib/preventivo-schema').VisibilityCondition) => void;
  removeCondition: (sectionKey: string, subsectionKey: string | null, fieldKey: string, conditionId: string) => void;
  updateCondition: (sectionKey: string, subsectionKey: string | null, fieldKey: string, conditionId: string, updates: Partial<import('@/lib/preventivo-schema').VisibilityCondition>) => void;
  setConditionLogic: (sectionKey: string, subsectionKey: string | null, fieldKey: string, logic: 'and' | 'or') => void;
}

// Helper: find and mutate a field in sections
function mutateField(
  sections: FormSection[],
  sectionKey: string,
  subsectionKey: string | null,
  fieldKey: string,
  mutator: (field: import('@/lib/preventivo-schema').FormField, arr: import('@/lib/preventivo-schema').FormField[], idx: number) => void
): FormSection[] {
  return sections.map(section => {
    if (section.key !== sectionKey) return section;

    if (!subsectionKey) {
      // Top-level fields
      const idx = section.fields.findIndex(f => f.key === fieldKey);
      if (idx !== -1) {
        const newFields = [...section.fields];
        mutator(newFields[idx], newFields, idx);
        return { ...section, fields: newFields };
      }
    } else {
      // Subsection fields
      const newSubsections = section.subsections.map(sub => {
        if (sub.key !== subsectionKey) return sub;
        const idx = sub.fields.findIndex(f => f.key === fieldKey);
        if (idx !== -1) {
          const newFields = [...sub.fields];
          mutator(newFields[idx], newFields, idx);
          return { ...sub, fields: newFields };
        }
        return sub;
      });
      return { ...section, subsections: newSubsections };
    }
    return section;
  });
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  customSchema: null,
  isCustomized: false,

  loadSchema: () => {
    const stored = loadFromStorage();
    if (stored) {
      set({ customSchema: stored, isCustomized: true });
    }
  },

  getSchema: () => {
    const { customSchema } = get();
    return customSchema || FORM_SECTIONS;
  },

  saveSchema: (sections: FormSection[]) => {
    saveToStorage(sections);
    set({ customSchema: sections, isCustomized: true });
  },

  resetToDefault: () => {
    clearStorage();
    set({ customSchema: null, isCustomized: false });
  },

  updateField: (sectionKey, subsectionKey, fieldKey, updates) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr) => {
      const idx = arr.indexOf(field);
      arr[idx] = { ...field, ...updates };
    });
    get().saveSchema(newSchema);
  },

  addField: (sectionKey, subsectionKey, field, index) => {
    const schema = get().getSchema();
    const newSchema = schema.map(section => {
      if (section.key !== sectionKey) return section;
      if (!subsectionKey) {
        const newFields = [...section.fields];
        if (index !== undefined) {
          newFields.splice(index, 0, field);
        } else {
          newFields.push(field);
        }
        return { ...section, fields: newFields };
      } else {
        const newSubsections = section.subsections.map(sub => {
          if (sub.key !== subsectionKey) return sub;
          const newFields = [...sub.fields];
          if (index !== undefined) {
            newFields.splice(index, 0, field);
          } else {
            newFields.push(field);
          }
          return { ...sub, fields: newFields };
        });
        return { ...section, subsections: newSubsections };
      }
    });
    get().saveSchema(newSchema);
  },

  removeField: (sectionKey, subsectionKey, fieldKey) => {
    const schema = get().getSchema();
    const newSchema = schema.map(section => {
      if (section.key !== sectionKey) return section;
      if (!subsectionKey) {
        return { ...section, fields: section.fields.filter(f => f.key !== fieldKey) };
      } else {
        return {
          ...section,
          subsections: section.subsections.map(sub => {
            if (sub.key !== subsectionKey) return sub;
            return { ...sub, fields: sub.fields.filter(f => f.key !== fieldKey) };
          }),
        };
      }
    });
    get().saveSchema(newSchema);
  },

  moveField: (sectionKey, subsectionKey, fieldKey, direction) => {
    const schema = get().getSchema();
    const newSchema = schema.map(section => {
      if (section.key !== sectionKey) return section;

      const swapInArray = (fields: import('@/lib/preventivo-schema').FormField[]) => {
        const newFields = [...fields];
        const idx = newFields.findIndex(f => f.key === fieldKey);
        if (idx === -1) return newFields;
        if (direction === 'up' && idx > 0) {
          [newFields[idx - 1], newFields[idx]] = [newFields[idx], newFields[idx - 1]];
        } else if (direction === 'down' && idx < newFields.length - 1) {
          [newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]];
        }
        return newFields;
      };

      if (!subsectionKey) {
        return { ...section, fields: swapInArray(section.fields) };
      } else {
        return {
          ...section,
          subsections: section.subsections.map(sub => {
            if (sub.key !== subsectionKey) return sub;
            return { ...sub, fields: swapInArray(sub.fields) };
          }),
        };
      }
    });
    get().saveSchema(newSchema);
  },

  updateSection: (sectionKey, updates) => {
    const schema = get().getSchema();
    const newSchema = schema.map(s => s.key === sectionKey ? { ...s, ...updates } : s);
    get().saveSchema(newSchema);
  },

  addSection: (section) => {
    const schema = get().getSchema();
    get().saveSchema([...schema, section]);
  },

  removeSection: (sectionKey) => {
    const schema = get().getSchema();
    get().saveSchema(schema.filter(s => s.key !== sectionKey));
  },

  moveSection: (sectionKey, direction) => {
    const schema = get().getSchema();
    const newSchema = [...schema];
    const idx = newSchema.findIndex(s => s.key === sectionKey);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      [newSchema[idx - 1], newSchema[idx]] = [newSchema[idx], newSchema[idx - 1]];
    } else if (direction === 'down' && idx < newSchema.length - 1) {
      [newSchema[idx], newSchema[idx + 1]] = [newSchema[idx + 1], newSchema[idx]];
    }
    get().saveSchema(newSchema);
  },

  addSubsection: (sectionKey, subsection) => {
    const schema = get().getSchema();
    const newSchema = schema.map(s => {
      if (s.key !== sectionKey) return s;
      return { ...s, subsections: [...s.subsections, subsection] };
    });
    get().saveSchema(newSchema);
  },

  removeSubsection: (sectionKey, subsectionKey) => {
    const schema = get().getSchema();
    const newSchema = schema.map(s => {
      if (s.key !== sectionKey) return s;
      return { ...s, subsections: s.subsections.filter(sub => sub.key !== subsectionKey) };
    });
    get().saveSchema(newSchema);
  },

  updateSubsection: (sectionKey, subsectionKey, updates) => {
    const schema = get().getSchema();
    const newSchema = schema.map(s => {
      if (s.key !== sectionKey) return s;
      return {
        ...s,
        subsections: s.subsections.map(sub => sub.key === subsectionKey ? { ...sub, ...updates } : sub),
      };
    });
    get().saveSchema(newSchema);
  },

  moveSubsectionField: (sectionKey, subsectionKey, fieldKey, direction) => {
    const schema = get().getSchema();
    const newSchema = schema.map(section => {
      if (section.key !== sectionKey) return section;
      return {
        ...section,
        subsections: section.subsections.map(sub => {
          if (sub.key !== subsectionKey) return sub;
          const newFields = [...sub.fields];
          const idx = newFields.findIndex(f => f.key === fieldKey);
          if (idx === -1) return sub;
          if (direction === 'up' && idx > 0) {
            [newFields[idx - 1], newFields[idx]] = [newFields[idx], newFields[idx - 1]];
          } else if (direction === 'down' && idx < newFields.length - 1) {
            [newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]];
          }
          return { ...sub, fields: newFields };
        }),
      };
    });
    get().saveSchema(newSchema);
  },

  addEnumOption: (sectionKey, subsectionKey, fieldKey, option) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      arr[idx] = { ...field, options: [...(field.options || []), option] };
    });
    get().saveSchema(newSchema);
  },

  removeEnumOption: (sectionKey, subsectionKey, fieldKey, optionIndex) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
      arr[idx] = { ...field, options: newOptions };
    });
    get().saveSchema(newSchema);
  },

  updateEnumOption: (sectionKey, subsectionKey, fieldKey, optionIndex, newValue) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      const newOptions = [...(field.options || [])];
      newOptions[optionIndex] = newValue;
      arr[idx] = { ...field, options: newOptions };
    });
    get().saveSchema(newSchema);
  },

  moveEnumOption: (sectionKey, subsectionKey, fieldKey, optionIndex, direction) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      const newOptions = [...(field.options || [])];
      if (direction === 'up' && optionIndex > 0) {
        [newOptions[optionIndex - 1], newOptions[optionIndex]] = [newOptions[optionIndex], newOptions[optionIndex - 1]];
      } else if (direction === 'down' && optionIndex < newOptions.length - 1) {
        [newOptions[optionIndex], newOptions[optionIndex + 1]] = [newOptions[optionIndex + 1], newOptions[optionIndex]];
      }
      arr[idx] = { ...field, options: newOptions };
    });
    get().saveSchema(newSchema);
  },

  addCondition: (sectionKey, subsectionKey, fieldKey, condition) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      arr[idx] = { ...field, conditions: [...(field.conditions || []), condition] };
    });
    get().saveSchema(newSchema);
  },

  removeCondition: (sectionKey, subsectionKey, fieldKey, conditionId) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      arr[idx] = { ...field, conditions: (field.conditions || []).filter(c => c.id !== conditionId) };
    });
    get().saveSchema(newSchema);
  },

  updateCondition: (sectionKey, subsectionKey, fieldKey, conditionId, updates) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      arr[idx] = {
        ...field,
        conditions: (field.conditions || []).map(c => c.id === conditionId ? { ...c, ...updates } : c),
      };
    });
    get().saveSchema(newSchema);
  },

  setConditionLogic: (sectionKey, subsectionKey, fieldKey, logic) => {
    const schema = get().getSchema();
    const newSchema = mutateField(schema, sectionKey, subsectionKey, fieldKey, (field, arr, idx) => {
      arr[idx] = { ...field, conditionLogic: logic };
    });
    get().saveSchema(newSchema);
  },
}));
