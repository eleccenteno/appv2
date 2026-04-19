/**
 * Mapping from Datos Centros column keys (col_X) to Preventivo form field keys.
 * When a centro is selected in the preventivo form, all matching fields
 * are pre-filled from the centro's data.
 *
 * Includes smart value normalization to handle mismatches between
 * centros data format and preventivo form enum options (case, accents, etc.)
 */

import { FORM_SECTIONS, FormSection, FormField } from '@/lib/preventivo-schema';

// ============================================================
// FIELD MAPPING
// ============================================================
export const CENTRO_TO_PREVENTIVO_MAP: Record<string, Record<string, string>> = {
  general: {
    'col_0': 'nombreCentro',
    'col_1': 'codigoInfo',
    'col_2': 'provincia',
    'col_3': 'prioridad',
    'col_4': 'proyecto',
    'col_5': 'tipoCentro',
    'col_6': 'localizacionCentro',
  },
  suministro_electrico: {
    'col_8': 'tipoSuministroElectrico',
    'col_9': 'dondeSuministro',
    'col_10': 'comercializadora',
    'col_11': 'cups',
    'col_12': 'telefonoComercializadora',
    'col_13': 'contactoComercializadora',
    'col_15': 'localizacionContador',
    'col_16': 'tipoLineaCentro',
    'col_17': 'tipoLineaAcometida',
    'col_18': 'estadoAcometida',
    'col_19': 'motivoDeficienciaAcometida',
    'col_20': 'propietarioGrupo',
  },
  remota: {
    'col_22': 'remota',
    'col_23': 'tarjetaSIM',
    'col_24': 'numTelefonoSIM',
    'col_25': 'ipRemota',
  },
  evcc: {
    'col_27': 'evcc',
    'col_28': 'rectificadores',
    'col_29': 'rectificadoresMaximos',
    'col_30': 'limitacionCargaEVCC',
    'col_31': 'existenBaterias',
    'col_32': 'marcaBaterias',
    'col_33': 'bancadas',
    'col_34': 'numeroBaterias',
    'col_35': 'fechaInstalacionBaterias',
    'col_36': 'estadoBaterias',
  },
  aa: {
    'col_38': 'disponeAA',
    'col_39': 'cuantasMaquinasAA',
    'col_40': 'tipoMaquinaPrincipal',
    'col_42': 'marcaAAPrincipalExterior',
    'col_43': 'modeloAAPrincipalExterior',
    'col_44': 'numSerieAAPrincipalExterior',
    'col_45': 'tipoGasRefrigerante',
    'col_46': 'kgGasRefrigerante',
    'col_47': 'correctamenteSellado',
    'col_48': 'modeloAAPrincipalInterior',
    'col_49': 'numSerieAAPrincipalInterior',
    'col_50': 'correctoFuncionamientoAA',
    'col_51': 'motivoNoCorrectoAA',
    'col_53': 'correctoFuncionamientoAASec',
    'col_54': 'motivoNoCorrectoAASec',
    'col_55': 'marcaAASecundarioExterior',
    'col_56': 'modeloAASecundarioExterior',
    'col_57': 'numSerieAASecundarioExterior',
    'col_58': 'tipoGasRefrigeranteSec',
    'col_59': 'kgGasRefrigeranteSec',
    'col_60': 'modeloAASecundarioInterior',
    'col_61': 'numSerieAASecundarioInterior',
    'col_63': 'aaContingencia',
    'col_64': 'marcaAAContingencia',
    'col_66': 'correctaOrientacionSonda',
    'col_68': 'disponeExtraccion',
    'col_69': 'tipoExtraccionAire',
    'col_70': 'disponeFiltroFC',
  },
  torre: {
    'col_72': 'alturaTorre',
    'col_73': 'tipoEscaleras',
    'col_74': 'estadoPinturaTorre',
    'col_75': 'tienePararrayos',
    'col_76': 'consta5Puntas',
  },
  gamesystem: {
    'col_78': 'tipoLineaVida',
    'col_79': 'estadoLineaVida',
    'col_80': 'proximaRevisionLineaVida',
  },
  nidos: {
    'col_82': 'hayNidosCigueña',
    'col_83': 'numeroNidos',
    'col_84': 'existeCestaNidos',
    'col_85': 'hayNidosInteriorCesta',
    'col_86': 'observacionesNidos',
  },
  infraestructura: {
    'col_88': 'parcelaEdificio',
    'col_89': 'existeCandadoCancillaCamino',
    'col_90': 'tipoCandadoCancillaCamino',
    'col_91': 'accesoRestringido',
    'col_92': 'vehiculo4x4',
    'col_93': 'disponeCilindroLocken',
    'col_94': 'existeCandadoCancillaRecinto',
    'col_95': 'tipoCandadoCancillaRecinto',
    'col_96': 'estadoPuertaAcceso',
    'col_97': 'disponeBarraAntivandalica',
    'col_98': 'tipoCandadoBarraAntivandalica',
    'col_99': 'existeCerraduraAcceso',
    'col_100': 'estadoCerraduraAcceso',
    'col_101': 'tipoCerraduraAcceso',
    'col_102': 'funcionaSensorPuerta',
    'col_103': 'estadoGeneralVallado',
    'col_104': 'reparaValladoPreventivo',
    'col_105': 'tipoTerrenoRecinto',
    'col_106': 'necesitaDesbroce',
    'col_107': 'seHaDesbrozado',
    'col_108': 'aplicacionHerbicida',
    'col_109': 'tipoHerbicida',
    'col_110': 'vegetacionOtrosProcedimientos',
    'col_111': 'chatarraCentro',
  },
  coubicados: {
    'col_114': 'disponeEquiposExteriores',
    'col_115': 'companiasCoubicadaExterior',
    'col_117': 'disponeEquiposInteriores',
    'col_118': 'companiasCoubicadaInterior',
    'col_119': 'nombreCompaniaInterior',
  },
  cuadro_electrico: {
    'col_121': 'repartoCargasCorrecto',
    'col_122': 'totalCVMINI',
    'col_123': 'tipoAlimentacionMovistarExt',
    'col_124': 'tipoAlimentacionOrangeExt',
    'col_125': 'tipoAlimentacionVodafoneExt',
    'col_126': 'tipoAlimentacionYoigoExt',
    'col_127': 'tipoAlimentacionOtrosExt',
    'col_128': 'tipoAlimentacionMovistarInt',
    'col_129': 'tipoAlimentacionOrangeInt',
    'col_130': 'tipoAlimentacionVodafoneInt',
    'col_131': 'tipoAlimentacionYoigoInt',
    'col_132': 'tipoAlimentacionOtrosInt',
    'col_133': 'diodoColocado',
    'col_134': 'sensorPuertaCuadro',
  },
  enlaces: {
    'col_136': 'existenEnlaces',
    'col_137': 'numeroEnlaces',
    'col_138': 'numeroVano1',    'col_139': 'marcaEquipo1',    'col_140': 'modeloEquipo1',
    'col_141': 'numeroVano2',    'col_142': 'marcaEquipo2',    'col_143': 'modeloEquipo2',
    'col_144': 'numeroVano3',    'col_145': 'marcaEquipo3',    'col_146': 'modeloEquipo3',
    'col_147': 'numeroVano4',    'col_148': 'marcaEquipo4',    'col_149': 'modeloEquipo4',
    'col_150': 'numeroVano5',    'col_151': 'marcaEquipo5',    'col_152': 'modeloEquipo5',
    'col_153': 'numeroVano6',    'col_154': 'marcaEquipo6',    'col_155': 'modeloEquipo6',
    'col_156': 'numeroVano7',    'col_157': 'marcaEquipo7',    'col_158': 'modeloEquipo7',
    'col_159': 'numeroVano8',    'col_160': 'marcaEquipo8',    'col_161': 'modeloEquipo8',
    'col_162': 'numeroVano9',    'col_163': 'marcaEquipo9',    'col_164': 'modeloEquipo9',
    'col_165': 'numeroVano10',   'col_166': 'marcaEquipo10',   'col_167': 'modeloEquipo10',
  },
  sigfox: {
    'col_169': 'disponeEquiposSigfox',
    'col_170': 'modeloSigfox',
  },
  fotovoltaica: {
    'col_172': 'instalacionFotovoltaica',
    'col_173': 'tipoInversor',
    'col_174': 'modeloInversorFotovoltaica',
    'col_175': 'modeloEVCCFotovoltaica',
    'col_176': 'rectificadoresEVCCFV',
    'col_177': 'rectificadoresMaximosEVCCFV',
    'col_178': 'numeroPanelesFV',
    'col_179': 'observacionesFotovoltaica',
  },
};

// ============================================================
// SMART VALUE NORMALIZATION
// ============================================================

/**
 * Normalize a string for comparison: lowercase, remove accents, trim.
 * This allows matching "INDOOR" to "Indoor", "Si" to "Sí", etc.
 */
function normalizeForComparison(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a lookup map of all Enum/EnumList field keys to their options
 * from the preventivo form schema.
 */
function buildEnumOptionsMap(sections: FormSection[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const processFields = (fields: FormField[]) => {
    for (const field of fields) {
      if ((field.type === 'Enum' || field.type === 'EnumList') && field.options) {
        map.set(field.key, field.options);
      }
    }
  };

  for (const section of sections) {
    processFields(section.fields);
    for (const sub of section.subsections) {
      processFields(sub.fields);
    }
  }

  return map;
}

/**
 * Try to match a raw centros value to a preventivo enum option.
 * Uses case-insensitive and accent-insensitive comparison.
 * Returns the matched option (with correct casing/accents) or the original value.
 */
function matchEnumOption(rawValue: string, options: string[]): string {
  const normalizedRaw = normalizeForComparison(rawValue);

  // 1. Try exact match first
  if (options.includes(rawValue)) {
    return rawValue;
  }

  // 2. Try case-insensitive + accent-insensitive match
  for (const option of options) {
    if (normalizeForComparison(option) === normalizedRaw) {
      return option; // Return the properly-formatted option
    }
  }

  // 3. Try "contains" match (e.g., "BADAJOZ" contains in "Badajoz" or vice versa)
  for (const option of options) {
    const normalizedOpt = normalizeForComparison(option);
    if (normalizedOpt.includes(normalizedRaw) || normalizedRaw.includes(normalizedOpt)) {
      return option;
    }
  }

  // 4. No match found — return original value
  // The form should handle this gracefully
  return rawValue;
}

/**
 * Pre-fill preventivo form fields from a centro's data.
 * Returns an object of { preventivoFieldKey: value } for all matching fields.
 *
 * Smart normalization:
 * - For Enum/EnumList fields, tries to match centros values to form options
 *   (case-insensitive, accent-insensitive)
 * - For Text/LongText fields, passes through as-is
 * - Only includes fields with non-empty values from the centro data
 */
export function getCentroPreFillData(centroData: Record<string, Record<string, string>>): Record<string, string> {
  const result: Record<string, string> = {};

  // Build enum options lookup from the current form schema
  const enumOptionsMap = buildEnumOptionsMap(FORM_SECTIONS);

  for (const [sectionKey, fieldMap] of Object.entries(CENTRO_TO_PREVENTIVO_MAP)) {
    const sectionData = centroData[sectionKey];
    if (!sectionData) continue;

    for (const [centroColKey, preventivoFieldKey] of Object.entries(fieldMap)) {
      const rawValue = sectionData[centroColKey];
      if (!rawValue || rawValue.trim() === '') continue;

      let finalValue = rawValue.trim();

      // Smart normalization for Enum/EnumList fields
      const enumOptions = enumOptionsMap.get(preventivoFieldKey);
      if (enumOptions) {
        finalValue = matchEnumOption(finalValue, enumOptions);
      }

      result[preventivoFieldKey] = finalValue;
    }
  }

  return result;
}
