// Form field types
export type FieldType = 'Text' | 'Number' | 'Decimal' | 'Enum' | 'EnumList' | 'LongText' | 'Phone' | 'Date' | 'LatLong' | 'Photo' | 'Show' | 'Ref' | 'Image';

// Condition operator types
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';

export interface VisibilityCondition {
  id: string;
  fieldKey: string;
  operator: ConditionOperator;
  value: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  visible?: boolean;
  conditions?: VisibilityCondition[];
  conditionLogic?: 'and' | 'or';
}

export interface FormSubsection {
  key: string;
  label: string;
  fields: FormField[];
  visible?: boolean;
  conditions?: VisibilityCondition[];
  conditionLogic?: 'and' | 'or';
}

export interface FormSection {
  key: string;
  label: string;
  icon: string;
  color: string;
  fields: FormField[];
  subsections: FormSubsection[];
  visible?: boolean;
  conditions?: VisibilityCondition[];
  conditionLogic?: 'and' | 'or';
}

// ============================================================
// COMMON ENUM OPTIONS
// ============================================================
const SI_NO_NSNC = ['Sí', 'No', 'NS/NC'];
const SI_NO = ['Sí', 'No'];
const TIPO_CENTRO = ['Indoor', 'Outdoor', 'Shelter', 'Rooftop', 'Monoposte', 'Torre', 'Otro'];
const PRIORIDAD = ['P1', 'P2', 'P3', 'P4'];
const PROYECTO = ['ATW', 'R9V', 'AXN', 'GSM', 'Otros'];
const PROVINCIA = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón',
  'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara',
  'Gipuzkoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja',
  'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia',
  'Navarra', 'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
  'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza',
];
const TIPO_SUMINISTRO = ['Monofásico', 'Trifásico', 'CC', 'Otro'];
const TIPO_LINEA_ACOMETIDA = ['Aérea', 'Subterránea', 'Mixta', 'NS/NC'];
const ESTADO_ACOMETIDA = ['Correcto', 'Deficiente', 'Pendiente revisión', 'Sin acometida'];
const PROPIETARIO_GRUPO = ['Cellnex', 'Propietario', 'Compartido', 'Otro'];
const PARCELA_EDIFICIO = ['Parcela', 'Edificio', 'Azotea', 'Otro'];
const TIPO_CANDADO = ['Candado llave', 'Candado combinación', 'Cilindro Locken', 'Otro', 'No dispone'];
const ACCESO_RESTRINGIDO = ['Sí', 'No', 'Parcial'];
const VEHICULO_4X4 = ['Sí', 'No', 'No necesario'];
const ESTADO_PUERTA = ['Correcto', 'Deficiente', 'Sin puerta', 'NS/NC'];
const ESTADO_VALLADO = ['Correcto', 'Deficiente - Parcial', 'Deficiente - Total', 'Sin vallado'];
const TIPO_TERRENO = ['Tierra', 'Hierba', 'Grava', 'Asfalto', 'Mixto', 'Otro'];
const APLICACION_HERBICIDA = ['Sí', 'No', 'No necesario'];
const TIPO_HERBICIDA = ['Glifosato', 'Herbicida selectivo', 'Otro', 'No aplicado'];
const VEGETACION_OTROS = ['Zenú', 'Carrizo', 'Maleza', 'Otro', 'No'];
const CHATARRA = ['Sí', 'No', 'No observa'];
const COMPANIAS = ['Movistar', 'Orange', 'Vodafone', 'Yoigo', 'Otros'];
const TIPO_ALIMENTACION = ['AC', 'DC', 'Mixta', 'N/A'];
const ALTURA_TORRE = ['15m', '20m', '25m', '30m', '35m', '40m', '45m', '50m', '60m', '75m', '90m', '100m+', 'Otro'];
const TIPO_ESCALERAS = ['Fijas', 'De gato', 'Sin escaleras', 'Marina', 'Vertical'];
const TIPO_LINEA_VIDA = ['Cable', 'Rail', 'No dispone', 'NS/NC'];
const ESTADO_LINEA_VIDA = ['Vigente', 'Caducada', 'Pendiente revisión', 'Sin línea de vida'];
const PROXIMA_REVISION = ['< 6 meses', '6-12 meses', '> 12 meses', 'N/A'];
const ESTADO_PINTURA = ['Buen estado', 'Regular', 'Necesita pintura', 'N/A'];
const MARCA_AA = ['Daikin', 'Mitsubishi', 'Fujitsu', 'Samsung', 'LG', 'Toshiba', 'Carrier', 'Hisense', 'Haier', 'Otro'];
const TIPO_MAQUINA_AA = ['Split', 'Consola', 'Cassette', 'Techo', 'Conducto', 'Otro'];
const CANTIDAD_MAQUINAS_AA = ['1', '2', '3', '4', '5+'];
const GAS_REFRIGERANTE = ['R32', 'R410A', 'R22', 'R407C', 'R290', 'R134a', 'Otro'];
const MODELO_AA_EXTERIOR = ['Unidad exterior', 'Condensadora', 'Split exterior', 'Otro'];
const MODELO_AA_INTERIOR = ['Unidad interior', 'Evaporadora', 'Split interior', 'Otro'];
const EVCC_OPTIONS = ['Sí - Eltek', 'Sí - Huawei', 'Sí - ZTE', 'Sí - Otros', 'No'];
const LIMITACION_CARGA = ['Sin limitación', 'Limitado 10A', 'Limitado 15A', 'Limitado 20A', 'Otro'];
const MARCA_BATERIAS = ['Yuasa', 'Exide', 'Hoppecke', 'Fiamm', 'C&D', 'Enersys', 'Cegasa', 'Otro'];
const ESTADO_BATERIAS = ['Buen estado', 'Deficiente', 'Sin baterías', 'Pendiente revisión'];
const REMOTA_OPTIONS = ['Sí - OnTower', 'Sí - Movistar', 'Sí - Otros', 'No'];
const TARJETA_SIM = ['M2M Movistar', 'M2M Vodafone', 'M2M Orange', 'M2M Otros', 'No dispone'];
const MARCA_ENLACE = ['Cambium', 'Siklu', 'Ceragon', 'NEC', 'Ericsson', 'Nokia', 'Huawei', 'Otro'];
const MODELO_ENLACE = ['PTP 820C', 'PTP 820B', 'PTP 670', 'PTP 500', 'EH-1200FX', 'Otro'];
const MODELO_SIGFOX = ['NKE Watteco', 'Sensing Labs', 'ATIM', 'Adeunis', 'Otro'];
const FOTOVOLTAICA = ['Sí', 'No', 'En proyecto'];
const TIPO_INVERSOR = ['Fronius', 'SMA', 'Huawei', 'Sungrow', 'SolarEdge', 'GoodWe', 'Otro'];
const MODELO_EVCC_FV = ['CE+T', 'Eltek', 'Huawei', 'ZTE', 'Otro'];
const EXTRACCION = ['Extractor axial', 'Extractor centrífugo', 'Ventilador', 'Otro', 'No dispone'];
const FILTRO_FC = ['Sí', 'No', 'NS/NC'];
const CORRECTO_DEFICIENTE = ['Correcto', 'Deficiente', 'NS/NC'];
const TIPO_CERRADURA = ['Cerradura llave', 'Cerradura embutida', 'Bombín', 'Otro'];

// ============================================================
// FORM SECTIONS
// ============================================================
export const FORM_SECTIONS: FormSection[] = [

  // ==========================================
  // 1. GENERAL
  // ==========================================
  {
    key: 'general',
    label: 'General',
    icon: 'FileText',
    color: 'text-teal-700',
    fields: [
      { key: 'rowNumber', label: 'Nº Fila', type: 'Number', placeholder: 'Nº de fila' },
      { key: 'nombreCentro', label: 'Nombre del centro', type: 'Ref', required: true },
      { key: 'localizacionCentro', label: 'Localización centro', type: 'LatLong' },
      { key: 'codigoInfo', label: 'Código info', type: 'Text', placeholder: 'Código de información' },
      { key: 'provincia', label: 'Provincia', type: 'Enum', options: PROVINCIA },
      { key: 'tipoCentro', label: 'Tipo centro', type: 'Enum', options: TIPO_CENTRO },
      { key: 'prioridad', label: 'Prioridad', type: 'Enum', options: PRIORIDAD },
      { key: 'proyecto', label: 'Proyecto', type: 'Enum', options: PROYECTO },
      { key: 'cups', label: 'CUPS', type: 'Text', placeholder: 'Código CUPS...' },
      { key: 'comercializadora', label: 'Comercializadora', type: 'Text', placeholder: 'Comercializadora...' },
      { key: 'tecnico', label: 'Técnico', type: 'Ref', required: true },
      { key: 'fecha', label: 'Fecha', type: 'Date', required: true },
    ],
    subsections: [],
  },

  // ==========================================
  // 2. PROCEDIMIENTOS PREVENTIVOS
  // ==========================================
  {
    key: 'procedimientos',
    label: 'Procedimientos Preventivos',
    icon: 'ClipboardList',
    color: 'text-blue-700',
    fields: [
      { key: 'proc_revision_visual', label: '➢ Revisión visual de que todo está correcto, si se viese alguna anomalía informar lo antes posible.', type: 'Show' },
      { key: 'proc_rellenar_formulario', label: '➢ Rellenar el formulario de preventivos.', type: 'Show' },
      { key: 'proc_capturas_remota', label: '➢ Realizar capturas de pantalla de toda la información de la remota, si procede.', type: 'Show' },
      { key: 'proc_test_remota', label: '➢ Realizar test a la remota, si procede.', type: 'Show' },
      { key: 'proc_backup_remota', label: '➢ Realizar backup de la remota, tanto desde la aplicación como desde la web, si procede.', type: 'Show' },
      { key: 'proc_capturas_evcc', label: '➢ Realizar capturas de pantalla de la EVCC, si procede.', type: 'Show' },
      { key: 'proc_medidas_bateria', label: '➢ Realizar tomas de medidas de batería.', type: 'Show' },
      { key: 'proc_medidas_tierra', label: '➢ Realizar tomas de medidas de tierra.', type: 'Show' },
      { key: 'proc_reapretado_cuadro', label: '➢ Reapretado de todos los componentes del cuadro eléctrico.', type: 'Show' },
      { key: 'proc_limpieza_equipos', label: '➢ Limpieza de todos los equipos del centro.', type: 'Show' },
      { key: 'proc_barrer_fregar', label: '➢ Barrer y fregar el centro.', type: 'Show' },
      { key: 'proc_desbroce', label: '➢ Desbroce y/o Retirada de pequeñas plantas/arbustos.', type: 'Show' },
      { key: 'seHaLeidoProcedimientos', label: 'Se ha leído los Procedimientos?', type: 'Enum', options: SI_NO, required: true },
    ],
    subsections: [],
  },

  // ==========================================
  // 3. INFRAESTRUCTURA
  // ==========================================
  {
    key: 'infraestructura',
    label: 'Infraestructura',
    icon: 'Building2',
    color: 'text-cyan-700',
    fields: [
      { key: 'localizacionContador', label: 'Localización contador', type: 'LatLong' },
      { key: 'tipoLineaAcometida', label: 'Tipo de línea de acometida', type: 'Enum', options: TIPO_LINEA_ACOMETIDA },
      { key: 'estadoAcometida', label: 'Estado de acometida', type: 'Enum', options: ESTADO_ACOMETIDA },
      { key: 'motivoDeficienciaAcometida', label: 'Motivo deficiencia acometida', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoDeficienciaAcometida', label: 'Fotografía deficiencia acometida', type: 'Image' },
      { key: 'tipoSuministroElectrico', label: 'Tipo de suministro eléctrico', type: 'Enum', options: TIPO_SUMINISTRO },
      { key: 'dondeSuministro', label: '¿De dónde cogemos el suministro?', type: 'LongText', placeholder: 'Describir origen...' },
      { key: 'propietarioGrupo', label: 'Propietario grupo', type: 'Enum', options: PROPIETARIO_GRUPO },
      { key: 'contadorVistaGeneral', label: 'Contador vista general', type: 'Image' },
      { key: 'contadorCaja', label: 'Contador caja', type: 'Image' },
      { key: 'contadorFusibles', label: 'Contador fusibles', type: 'Image' },
      { key: 'parcelaEdificio', label: 'Parcela o edificio', type: 'Enum', options: PARCELA_EDIFICIO },
      // Acceso camino
      { key: 'existeCandadoCancillaCamino', label: '¿Existe candado para la cancilla de acceso al camino?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'tipoCandadoCancillaCamino', label: 'Tipo de candado para la cancilla de acceso al camino', type: 'Enum', options: TIPO_CANDADO },
      { key: 'fotoCancillaCamino', label: 'Fotografía a la cancilla del camino al centro si la hubiese', type: 'Image' },
      { key: 'fotoCandadoCancillaCamino', label: 'Fotografía candado de la cancilla del camino al centro si la hubiese', type: 'Image' },
      { key: 'fotoPortal', label: 'Fotografía del portal', type: 'Image' },
      { key: 'fotoPuertaImportante', label: 'Fotografía si hubiese alguna puerta importante para el acceso', type: 'Image' },
      // Acceso
      { key: 'accesoRestringido', label: 'Acceso Restringido', type: 'Enum', options: ACCESO_RESTRINGIDO },
      { key: 'vehiculo4x4', label: '4x4', type: 'Enum', options: VEHICULO_4X4 },
      // Cilindro Locken
      { key: 'disponeCilindroLocken', label: '¿Dispone de cilindro Locken?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'fotoLocalizacionCilindro', label: 'Fotografía general de la localización del cilindro', type: 'Image' },
      { key: 'fotoLlavesInterioresCilindro', label: 'Fotografía de las llaves interiores del cilindro', type: 'Image' },
      // Acceso recinto
      { key: 'existeCandadoCancillaRecinto', label: '¿Existe candado para la cancilla de acceso al recinto?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'tipoCandadoCancillaRecinto', label: 'Tipo de candado para la cancilla de acceso al recinto', type: 'Enum', options: TIPO_CANDADO },
      { key: 'fotoCandadoRecinto', label: 'Fotografía candado recinto centro', type: 'Image' },
      { key: 'fotoGeneralConjunto1', label: 'Fotografía General de todo el conjunto (Recinto+Caseta, distancia + 5metros) 1', type: 'Image' },
      { key: 'fotoGeneralConjunto2', label: 'Fotografía General de todo el conjunto (Recinto+Caseta, distancia + 5metros) 2', type: 'Image' },
      // Puerta
      { key: 'estadoPuertaAcceso', label: 'Estado de puerta de acceso al centro', type: 'Enum', options: ESTADO_PUERTA },
      { key: 'motivoDeficientePuerta', label: 'Motivo de porqué el estado de la puerta es deficiente', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoDeficientePuerta', label: 'Fotografía deficiente puerta centro', type: 'Image' },
      { key: 'fotoEstadoGeneralPuerta', label: 'Fotografía estado general de la puerta del centro', type: 'Image' },
      // Barra antivandálica
      { key: 'disponeBarraAntivandalica', label: '¿Dispone de barra antivandálica?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'tipoCandadoBarraAntivandalica', label: 'Tipo candado barra antivandálica', type: 'Enum', options: TIPO_CANDADO },
      { key: 'fotoBarraAntivandalica', label: 'Fotografía barra antivandálica', type: 'Image' },
      // Cerradura
      { key: 'existeCerraduraAcceso', label: '¿Existe cerradura para el acceso al centro?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'estadoCerraduraAcceso', label: 'Estado cerradura de acceso al centro', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'tipoCerraduraAcceso', label: 'Tipo de cerradura para el acceso al centro', type: 'Enum', options: TIPO_CERRADURA },
      { key: 'motivoDeficienteCerradura', label: 'Motivo de porqué el estado de la cerradura de la puerta es deficiente', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoDeficienteCerradura', label: 'Fotografía deficiente cerradura centro', type: 'Image' },
      { key: 'fotoCerraduraCentro', label: 'Fotografía cerradura centro', type: 'Image' },
      { key: 'fotoBombinPuerta', label: 'Fotografía Bombín puerta acceso centro', type: 'Image' },
      // Estado general
      { key: 'fotoEstadoGeneral1', label: 'Fotografía estado general centro 1 (Cuando llegas)', type: 'Image' },
      { key: 'fotoEstadoGeneral2', label: 'Fotografía estado general centro 2 (Cuando llegas)', type: 'Image' },
      { key: 'fotoLuminarias', label: 'Foto luminarias', type: 'Image' },
      // Sensor puerta
      { key: 'funcionaSensorPuerta', label: '¿Funciona correctamente el sensor de puerta?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'seSustituyeSensorPuerta', label: '¿Se sustituye el sensor de puerta?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'motivoNoFuncionaSensor', label: 'Motivo de porqué no funciona/sustituye el sensor de la puerta', type: 'LongText', placeholder: 'Describir motivo...' },
      // Caseta exterior
      { key: 'fotoCasetaNorte', label: 'Foto caseta cara norte', type: 'Image' },
      { key: 'fotoCasetaSur', label: 'Foto caseta cara sur', type: 'Image' },
      { key: 'fotoCasetaEste', label: 'Foto caseta cara este', type: 'Image' },
      { key: 'fotoCasetaOeste', label: 'Foto caseta cara oeste', type: 'Image' },
      { key: 'fotoPasamurosExterior', label: 'Foto pasamuros exterior', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 4. TORRE
  // ==========================================
  {
    key: 'torre',
    label: 'Torre',
    icon: 'Radio',
    color: 'text-indigo-700',
    fields: [
      { key: 'alturaTorre', label: 'Altura torre', type: 'Enum', options: ALTURA_TORRE },
      { key: 'tipoEscaleras', label: 'Tipo de escaleras', type: 'Enum', options: TIPO_ESCALERAS },
      { key: 'tipoLineaVida', label: 'Tipo de línea de vida', type: 'Enum', options: TIPO_LINEA_VIDA },
      { key: 'estadoLineaVida', label: 'Estado línea de vida', type: 'Enum', options: ESTADO_LINEA_VIDA },
      { key: 'proximaRevisionLineaVida', label: 'Próxima revisión línea de vida', type: 'Enum', options: PROXIMA_REVISION },
      { key: 'motivoDeficienteLineaVida', label: 'Motivo de porqué el estado de la línea de vida es deficiente', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoSistemaAnticaida', label: 'Foto sistema anticaída si procede', type: 'Image' },
      { key: 'fotoFechaSistemaAnticaidas', label: 'Foto fecha sistema anticaídas', type: 'Image' },
      { key: 'fotoCartelCellnex', label: 'Fotografía cartel Cellnex', type: 'Image' },
      { key: 'fotoTorreNorte', label: 'Fotografía torre Norte', type: 'Image' },
      { key: 'fotoTorreSur', label: 'Fotografía torre Sur', type: 'Image' },
      { key: 'fotoTorreEste', label: 'Fotografía torre Este', type: 'Image' },
      { key: 'fotoTorreOeste', label: 'Fotografía torre Oeste', type: 'Image' },
      { key: 'estadoPinturaTorre', label: 'Estado pintura de la torre', type: 'Enum', options: ESTADO_PINTURA },
      { key: 'tienePararrayos', label: '¿Tiene pararrayos?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'consta5Puntas', label: '¿Consta de 5 puntas?', type: 'Enum', options: SI_NO_NSNC },
      // Nidos
      { key: 'hayNidosCigueña', label: '¿Hay nidos de cigüeña en la torre?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'numeroNidos', label: 'Número de nidos', type: 'Number', placeholder: '0' },
      { key: 'existeCestaNidos', label: '¿Existe cesta para los nidos?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'hayNidosInteriorCesta', label: '¿Hay nidos en el interior de la cesta?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'observacionesNidos', label: 'Observaciones sobre los nidos', type: 'LongText', placeholder: 'Observaciones...' },
      { key: 'fotoNidos1', label: 'Nidos 1', type: 'Image' },
      { key: 'fotoNidos2', label: 'Nidos 2', type: 'Image' },
      { key: 'fotoNidos3', label: 'Nidos 3', type: 'Image' },
      { key: 'fotoNidos4', label: 'Nidos 4', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 5. EQUIPOS EXTERIORES
  // ==========================================
  {
    key: 'equipos_exteriores',
    label: 'Equipos Exteriores',
    icon: 'Wifi',
    color: 'text-orange-700',
    fields: [
      { key: 'disponeEquiposExteriores', label: '¿Dispone de equipos de compañías exteriores?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'companiasCoubicadaExterior', label: 'Compañías coubicada en el exterior', type: 'EnumList', options: COMPANIAS },
      { key: 'nombreCompaniaExterior', label: 'Nombre de la compañía exterior', type: 'Text', placeholder: 'Nombre...' },
      { key: 'fotoEquiposExteriores1', label: 'Equipos compañía exteriores 1', type: 'Image' },
      { key: 'fotoEquiposExteriores2', label: 'Equipos compañía exteriores 2', type: 'Image' },
      { key: 'fotoEquiposExteriores3', label: 'Equipos compañía exteriores 3', type: 'Image' },
      { key: 'fotoEquiposExteriores4', label: 'Equipos compañía exteriores 4', type: 'Image' },
      { key: 'fotoEquiposExteriores5', label: 'Equipos compañía exteriores 5', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 6. VALLADO Y TERRENO
  // ==========================================
  {
    key: 'vallado_terreno',
    label: 'Vallado y Terreno',
    icon: 'Shield',
    color: 'text-emerald-700',
    fields: [
      { key: 'estadoGeneralVallado', label: 'Estado general del vallado', type: 'Enum', options: ESTADO_VALLADO },
      { key: 'reparaValladoPreventivo', label: '¿Se repara vallado en la realización del preventivo?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'motivoDeficienteVallado', label: 'Motivo de porqué el estado del vallado es deficiente', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoReparacionValladoAntes1', label: 'Fotografía reparación vallado (ANTES) 1', type: 'Image' },
      { key: 'fotoReparacionValladoAntes2', label: 'Fotografía reparación vallado (ANTES) 2', type: 'Image' },
      { key: 'fotoReparacionValladoDespues1', label: 'Fotografía reparación vallado (DESPUÉS) 1', type: 'Image' },
      { key: 'fotoReparacionValladoDespues2', label: 'Fotografía reparación vallado (DESPUÉS) 2', type: 'Image' },
      { key: 'fotoCancillaRecinto', label: 'Fotografía cancilla recinto centro', type: 'Image' },
      { key: 'fotoVallado1', label: 'Fotografía vallado 1', type: 'Image' },
      { key: 'fotoVallado2', label: 'Fotografía vallado 2', type: 'Image' },
      { key: 'fotoVallado3', label: 'Fotografía vallado 3', type: 'Image' },
      { key: 'fotoVallado4', label: 'Fotografía vallado 4', type: 'Image' },
      // Terreno
      { key: 'tipoTerrenoRecinto', label: 'Tipo de terreno recinto centro', type: 'Enum', options: TIPO_TERRENO },
      { key: 'necesitaDesbroce', label: '¿Necesita desbroce?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'seHaDesbrozado', label: '¿Se ha desbrozado?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'fotoEstadoTerreno1', label: 'Fotografía Estado General Terreno 1', type: 'Image' },
      { key: 'fotoEstadoTerreno2', label: 'Fotografía Estado General Terreno 2', type: 'Image' },
      { key: 'fotoEstadoTerreno3', label: 'Fotografía Estado General Terreno 3', type: 'Image' },
      { key: 'fotoDesbroceAntes1', label: 'Fotografía desbroce 1 (ANTES)', type: 'Image' },
      { key: 'fotoDesbroceAntes2', label: 'Fotografía desbroce 2 (ANTES)', type: 'Image' },
      { key: 'fotoDesbroceAntes3', label: 'Fotografía desbroce 3 (ANTES)', type: 'Image' },
      { key: 'fotoDesbroceAntes4', label: 'Fotografía desbroce 4 (ANTES)', type: 'Image' },
      { key: 'fotoDesbroceAntes5', label: 'Fotografía desbroce 5 (ANTES)', type: 'Image' },
      { key: 'fotoDesbroceDespues1', label: 'Fotografía desbroce 1 (DESPUÉS)', type: 'Image' },
      { key: 'fotoDesbroceDespues2', label: 'Fotografía desbroce 2 (DESPUÉS)', type: 'Image' },
      { key: 'fotoDesbroceDespues3', label: 'Fotografía desbroce 3 (DESPUÉS)', type: 'Image' },
      { key: 'fotoDesbroceDespues4', label: 'Fotografía desbroce 4 (DESPUÉS)', type: 'Image' },
      { key: 'fotoDesbroceDespues5', label: 'Fotografía desbroce 5 (DESPUÉS)', type: 'Image' },
      // Herbicida
      { key: 'aplicacionHerbicida', label: 'Aplicación de herbicida', type: 'Enum', options: APLICACION_HERBICIDA },
      { key: 'tipoHerbicida', label: 'Tipo de herbicida utilizado', type: 'Enum', options: TIPO_HERBICIDA },
      { key: 'vegetacionOtrosProcedimientos', label: 'Vegetación que requiera otros procedimientos', type: 'EnumList', options: VEGETACION_OTROS },
      { key: 'chatarraCentro', label: 'Chatarra en el centro', type: 'Enum', options: CHATARRA },
      { key: 'fotoResiduosChatarra', label: 'Fotos residuos (Chatarra)', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 7. EQUIPOS INTERIORES
  // ==========================================
  {
    key: 'equipos_interiores',
    label: 'Equipos Interiores',
    icon: 'Battery',
    color: 'text-purple-700',
    fields: [
      { key: 'disponeEquiposInteriores', label: '¿Dispone de equipos de compañías interiores?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'companiasCoubicadaInterior', label: 'Compañías coubicada en el interior', type: 'EnumList', options: COMPANIAS },
      { key: 'nombreCompaniaInterior', label: 'Nombre de la compañía interior', type: 'LongText', placeholder: 'Nombre de la compañía...' },
      { key: 'fotoEquiposInteriores1', label: 'Equipos compañía interiores 1', type: 'Image' },
      { key: 'fotoEquiposInteriores2', label: 'Equipos compañía interiores 2', type: 'Image' },
      { key: 'fotoEquiposInteriores3', label: 'Equipos compañía interiores 3', type: 'Image' },
      { key: 'fotoEquiposInteriores4', label: 'Equipos compañía interiores 4', type: 'Image' },
      { key: 'fotoEquiposInteriores5', label: 'Equipos compañía interiores 5', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 8. CUADRO ELÉCTRICO
  // ==========================================
  {
    key: 'cuadro_electrico',
    label: 'Cuadro Eléctrico',
    icon: 'Zap',
    color: 'text-amber-700',
    fields: [
      { key: 'tipoLineaCentro', label: 'Tipo de línea del centro', type: 'Enum', options: ['AT', 'MT', 'BT', 'NS/NC'] },
      { key: 'repartoCargasCorrecto', label: '¿Está bien realizado el reparto de cargas en el cuadro eléctrico? (poner climatizador en marcha donde exista)', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'motivoDeficienteRepartoCargas', label: 'Motivo por el cual es deficiente el reparto de cargas', type: 'LongText', placeholder: 'Describir motivo...' },
      // Fotos cuadro cerrado
      { key: 'fotoCuadroCerradoGeneral', label: 'Fotografía cuadro eléctrico vista general (cerrado)', type: 'Image' },
      { key: 'fotoCuadroCerradoSuperior', label: 'Fotografía cuadro eléctrico mitad superior (cerrado)', type: 'Image' },
      { key: 'fotoCuadroCerradoInferior', label: 'Fotografía cuadro eléctrico mitad inferior (cerrado)', type: 'Image' },
      { key: 'fotoIGACable', label: 'Fotografía IGA y sección del cable del cuadro eléctrico', type: 'Image' },
      // Fotos cuadro abierto
      { key: 'fotoCuadroAbiertoGeneral', label: 'Fotografía Cuadro eléctrico revisado vista general (abierto)', type: 'Image' },
      { key: 'fotoCuadroAbiertoSuperior', label: 'Fotografía cuadro eléctrico revisado mitad superior (abierto)', type: 'Image' },
      { key: 'fotoCuadroAbiertoInferior', label: 'Fotografía cuadro eléctrico revisado mitad inferior (abierto)', type: 'Image' },
      // Voltajes
      { key: 'fotoVoltajeL1L2', label: 'Fotografía Voltaje L1+L2 (POLÍMETRO)', type: 'Image' },
      { key: 'fotoVoltajeL2L3', label: 'Fotografía Voltaje L2+L3 (POLÍMETRO)', type: 'Image' },
      { key: 'fotoVoltajeL3L1', label: 'Fotografía Voltaje L3+L1 (POLÍMETRO)', type: 'Image' },
      { key: 'fotoVoltajeNL', label: 'Fotografía Voltaje N+L (POLÍMETRO)', type: 'Image' },
      // Intensidades
      { key: 'fotoIntensidadR', label: 'Fotografía Intensidad con pinzas amperimétricas "R"', type: 'Image' },
      { key: 'fotoIntensidadS', label: 'Fotografía Intensidad con pinzas amperimétricas "S"', type: 'Image' },
      { key: 'fotoIntensidadT', label: 'Fotografía Intensidad con pinzas amperimétricas "T"', type: 'Image' },
      { key: 'fotoIntensidadN', label: 'Fotografía Intensidad con pinzas amperimétricas "N"', type: 'Image' },
      // CV-MINI
      { key: 'totalCVMINI', label: 'Total CV-MINI Cuadro eléctrico', type: 'Number', placeholder: '0' },
      { key: 'fotoCVMINIGeneral', label: 'Fotografía valores contadores CV-MINI (GENERAL)', type: 'Image' },
      { key: 'fotoCVMINIEVCC', label: 'Fotografía valores contadores CV-MINI (EVCC)', type: 'Image' },
      { key: 'fotoCVMINICompania2', label: 'Fotografía valores contadores CV-MINI (COMPAÑÍA 2)', type: 'Image' },
      { key: 'fotoCVMINICompania3', label: 'Fotografía valores contadores CV-MINI (COMPAÑÍA 3)', type: 'Image' },
      { key: 'fotoMedidasTierra', label: 'Medidas de tierra', type: 'Image' },
      // Consumos Exterior
      { key: 'header_movistar_ext', label: 'Consumo Compañía Movistar Exterior', type: 'Show' },
      { key: 'tipoAlimentacionMovistarExt', label: 'Tipo de alimentación Movistar Exterior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadMovistarExt', label: 'Fotografía Intensidad Movistar Exterior', type: 'Image' },
      { key: 'header_orange_ext', label: 'Consumo Compañía Orange Exterior', type: 'Show' },
      { key: 'tipoAlimentacionOrangeExt', label: 'Tipo de alimentación Orange Exterior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadOrangeExt', label: 'Fotografía Intensidad Orange Exterior', type: 'Image' },
      { key: 'header_vodafone_ext', label: 'Consumo Compañía Vodafone Exterior', type: 'Show' },
      { key: 'tipoAlimentacionVodafoneExt', label: 'Tipo de alimentación Vodafone Exterior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadVodafoneExt', label: 'Fotografía Intensidad Vodafone Exterior', type: 'Image' },
      { key: 'header_yoigo_ext', label: 'Consumo Compañía Yoigo Exterior', type: 'Show' },
      { key: 'tipoAlimentacionYoigoExt', label: 'Tipo de alimentación Yoigo Exterior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadYoigoExt', label: 'Fotografía Intensidad Yoigo Exterior', type: 'Image' },
      { key: 'header_otros_ext', label: 'Consumo Compañía Otros Exterior', type: 'Show' },
      { key: 'tipoAlimentacionOtrosExt', label: 'Tipo de alimentación Otros Exterior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadOtrosExt', label: 'Fotografía Intensidad Otros Exterior', type: 'Image' },
      // Consumos Interior
      { key: 'header_movistar_int', label: 'Consumo Compañía Movistar Interior', type: 'Show' },
      { key: 'tipoAlimentacionMovistarInt', label: 'Tipo de alimentación Movistar Interior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadMovistarInt', label: 'Fotografía Intensidad Movistar Interior', type: 'Image' },
      { key: 'header_orange_int', label: 'Consumo Compañía Orange Interior', type: 'Show' },
      { key: 'tipoAlimentacionOrangeInt', label: 'Tipo de alimentación Orange Interior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadOrangeInt', label: 'Fotografía Intensidad Orange Interior', type: 'Image' },
      { key: 'header_vodafone_int', label: 'Consumo Compañía Vodafone Interior', type: 'Show' },
      { key: 'tipoAlimentacionVodafoneInt', label: 'Tipo de alimentación Vodafone Interior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadVodafoneInt', label: 'Fotografía Intensidad Vodafone Interior', type: 'Image' },
      { key: 'header_yoigo_int', label: 'Consumo Compañía Yoigo Interior', type: 'Show' },
      { key: 'tipoAlimentacionYoigoInt', label: 'Tipo de alimentación Yoigo Interior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadYoigoInt', label: 'Fotografía Intensidad Yoigo Interior', type: 'Image' },
      { key: 'header_otros_int', label: 'Consumo Compañía Otros Interior', type: 'Show' },
      { key: 'tipoAlimentacionOtrosInt', label: 'Tipo de alimentación Otros Interior', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'fotoIntensidadOtrosInt', label: 'Fotografía Intensidad Otros Interior', type: 'Image' },
      // Descargadores
      { key: 'sustitucionDescargadores', label: 'Sustitución de descargadores', type: 'Enum', options: SI_NO_NSNC },
      { key: 'cantidadDescargadoresCambiados', label: 'Cantidad de descargadores cambiados', type: 'Number', placeholder: '0' },
      { key: 'fotoDescargadoresAntes', label: 'Fotografía descargadores antes', type: 'Image' },
      { key: 'fotoDescargadoresDespues', label: 'Fotografía descargadores después', type: 'Image' },
      // Diodo
      { key: 'diodoColocado', label: 'Diodo colocado', type: 'Enum', options: SI_NO_NSNC },
      { key: 'fotoDiodo', label: 'Fotografía diodo', type: 'Image' },
      // Sensor puerta
      { key: 'sensorPuertaCuadro', label: '¿Se ha cableado/instalado sensor en la puerta del cuadro eléctrico?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'notaTareaImportante', label: 'Al ser un centro importante, Crea una tarea para realizar este trabajo.', type: 'Show' },
    ],
    subsections: [],
  },

  // ==========================================
  // 9. EVCC
  // ==========================================
  {
    key: 'evcc',
    label: 'EVCC',
    icon: 'Battery',
    color: 'text-lime-700',
    fields: [
      { key: 'evcc', label: 'EVCC', type: 'Enum', options: EVCC_OPTIONS },
      { key: 'fotoEVCC', label: 'Fotografía EVCC', type: 'Image' },
      { key: 'fotoTermicosEVCC1', label: 'Fotografía térmicos EVCC 1 (Que sea legible las etiquetas)', type: 'Image' },
      { key: 'fotoTermicosEVCC2', label: 'Fotografía térmicos EVCC 2 (Que sea legible las etiquetas)', type: 'Image' },
      { key: 'rectificadores', label: 'Rectificadores', type: 'Number', placeholder: '0' },
      { key: 'rectificadoresMaximos', label: 'Rectificadores máximos', type: 'Number', placeholder: '0' },
      { key: 'limitacionCargaEVCC', label: 'Limitación de carga EVCC', type: 'Enum', options: LIMITACION_CARGA },
      { key: 'evccValoresConsumo', label: 'EVCC valores consumo', type: 'Image' },
      // Baterías
      { key: 'existenBaterias', label: '¿Existen baterías?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'fotoBaterias', label: 'Fotografía Baterías', type: 'Image' },
      { key: 'estadoBaterias', label: 'Estado de las baterías', type: 'Enum', options: ESTADO_BATERIAS },
      { key: 'motivoEstadoBaterias', label: 'Motivo de porqué el estado de las baterías no es correcto', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'marcaBaterias', label: 'Marca Baterías', type: 'Enum', options: MARCA_BATERIAS },
      { key: 'bancadas', label: 'Bancadas', type: 'Number', placeholder: '0' },
      { key: 'fotoBancadas', label: 'Fotografía Bancadas', type: 'Image' },
      { key: 'numeroBaterias', label: 'Número Baterías', type: 'Number', placeholder: '0' },
      { key: 'fechaInstalacionBaterias', label: 'Fecha instalación baterías', type: 'Date' },
      { key: 'fotoFechaBaterias', label: 'Fecha Baterías', type: 'Image' },
      { key: 'seHanRetiradoBaterias', label: '¿Se han retirado baterías?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'numeroBateriasRetiradas', label: 'Número de baterías retiradas', type: 'Number', placeholder: '0' },
      { key: 'fotoConductancia', label: 'Foto Conductancia (medidor baterías)', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 10. REMOTA
  // ==========================================
  {
    key: 'remota',
    label: 'Remota',
    icon: 'Wifi',
    color: 'text-sky-700',
    fields: [
      { key: 'remota', label: 'Remota', type: 'Enum', options: REMOTA_OPTIONS },
      { key: 'tarjetaSIM', label: 'Tarjeta SIM', type: 'Enum', options: TARJETA_SIM },
      { key: 'numTelefonoSIM', label: 'Nº Teléfono Tarjeta SIM', type: 'Phone', placeholder: '600 000 000' },
      { key: 'ipRemota', label: 'IP remota', type: 'Text', placeholder: '192.168.x.x' },
      { key: 'fotoPegatinaRemota', label: 'Fotografía de la pegatina de la tapa de remota', type: 'Image' },
      { key: 'fotoRemota', label: 'Fotografía Remota', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 11. ENLACES
  // ==========================================
  {
    key: 'enlaces',
    label: 'Enlaces',
    icon: 'Link',
    color: 'text-pink-700',
    fields: [
      { key: 'existenEnlaces', label: '¿Existen enlaces en el centro?', type: 'Enum', options: SI_NO },
      { key: 'numeroEnlaces', label: 'Número de enlaces', type: 'Number', placeholder: '0' },
      // Enlace 1-10
      ...[1,2,3,4,5,6,7,8,9,10].flatMap(i => [
        { key: `numeroVano${i}`, label: `Número de Vano ${i}`, type: 'Text' as FieldType, placeholder: 'Nº vano...' },
        { key: `marcaEquipo${i}`, label: `Marca equipo ${i}`, type: 'Enum' as FieldType, options: MARCA_ENLACE },
        { key: `modeloEquipo${i}`, label: `Modelo equipo ${i}`, type: 'Enum' as FieldType, options: MODELO_ENLACE },
        { key: `fotoEquipamiento${i}`, label: `Fotografía equipamiento ${i}`, type: 'Image' as FieldType },
        { key: `fotoEtiqueta${i}`, label: `Fotografía etiqueta ${i}`, type: 'Image' as FieldType },
      ]),
    ],
    subsections: [],
  },

  // ==========================================
  // 12. AIRE ACONDICIONADO
  // ==========================================
  {
    key: 'aire_acondicionado',
    label: 'Aire Acondicionado',
    icon: 'Thermometer',
    color: 'text-red-700',
    fields: [
      { key: 'disponeAA', label: '¿Dispone de A/A?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'cuantasMaquinasAA', label: '¿Cuántas máquinas de A/A dispone el centro?', type: 'EnumList', options: CANTIDAD_MAQUINAS_AA },
      { key: 'notaManual', label: 'Nota: Existe un manual en el apartado "Manuales" para identificar qué tipo son cada una.', type: 'Show' },
      { key: 'tipoMaquinaPrincipal', label: 'Tipo de máquina (Solo la principal, la más "nueva")', type: 'Enum', options: TIPO_MAQUINA_AA },
      { key: 'notaSellado', label: 'Nota: Revisar sellado de la máquina al techo (subir arriba y comprobar sellado de anclajes para evitar filtraciones de agua).', type: 'Show' },
      { key: 'correctamenteSellado', label: '¿Está correctamente el sellado?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'fotoEstadoGeneral1', label: 'Fotografía general del estado 1', type: 'Image' },
      { key: 'fotoEstadoGeneral2', label: 'Fotografía general del estado 2', type: 'Image' },
      { key: 'fotoEstadoGeneral3', label: 'Fotografía general del estado 3', type: 'Image' },
      // Antes reparación
      { key: 'headerAntesReparacion', label: 'Antes de la reparación', type: 'Show' },
      { key: 'fotoAntesReparacion1', label: 'Fotografía anterior a la reparación 1', type: 'Image' },
      { key: 'fotoAntesReparacion2', label: 'Fotografía anterior a la reparación 2', type: 'Image' },
      { key: 'fotoAntesReparacion3', label: 'Fotografía anterior a la reparación 3', type: 'Image' },
      // Después reparación
      { key: 'headerDespuesReparacion', label: 'Después de la reparación', type: 'Show' },
      { key: 'fotoDespuesReparacion1', label: 'Fotografía después de la reparación 1', type: 'Image' },
      { key: 'fotoDespuesReparacion2', label: 'Fotografía después de la reparación 2', type: 'Image' },
      { key: 'fotoDespuesReparacion3', label: 'Fotografía después de la reparación 3', type: 'Image' },
    ],
    subsections: [
      {
        key: 'maquina_principal',
        label: 'MAQUINA PRINCIPAL',
        fields: [
          { key: 'correctoFuncionamientoAA', label: 'Correcto funcionamiento de A/A', type: 'Enum', options: CORRECTO_DEFICIENTE },
          { key: 'motivoNoCorrectoAA', label: 'Motivo de porqué no es correcto', type: 'LongText', placeholder: 'Describir motivo...' },
          { key: 'marcaAAPrincipalExterior', label: 'Marca A/A principal exterior', type: 'Enum', options: MARCA_AA },
          { key: 'modeloAAPrincipalExterior', label: 'Modelo A/A principal exterior', type: 'Enum', options: MODELO_AA_EXTERIOR },
          { key: 'numSerieAAPrincipalExterior', label: 'Número de Serie A/A principal Exterior', type: 'Text', placeholder: 'Nº de serie...' },
          { key: 'fotoAAExtPrincipalGeneral', label: 'Máquina de aire exterior principal (general)', type: 'Image' },
          { key: 'fotoAAExtPrincipalCaract', label: 'Máquina de aire exterior principal (características)', type: 'Image' },
          { key: 'tipoGasRefrigerante', label: 'Tipo de Gas Refrigerante', type: 'Enum', options: GAS_REFRIGERANTE },
          { key: 'kgGasRefrigerante', label: 'Kg de Gas Refrigerante', type: 'Decimal', placeholder: '0.0' },
          { key: 'modeloAAPrincipalInterior', label: 'Modelo A/A principal interior', type: 'Enum', options: MODELO_AA_INTERIOR },
          { key: 'numSerieAAPrincipalInterior', label: 'Número de Serie A/A principal Interior', type: 'Text', placeholder: 'Nº de serie...' },
          { key: 'fotoAAIntPrincipalGeneral', label: 'Máquina de aire interior principal (general)', type: 'Image' },
          { key: 'fotoAAIntPrincipalCaract', label: 'Máquina de aire interior principal (características)', type: 'Image' },
          { key: 'fotoMandoAA', label: 'Fotografía mando A/A', type: 'Image' },
          { key: 'fotoFiltroAntesAA', label: 'Foto filtro antes (máquina A/A)', type: 'Image' },
          { key: 'fotoFiltroDespuesAA', label: 'Foto filtro después (máquina A/A)', type: 'Image' },
        ],
      },
      {
        key: 'maquina_secundaria',
        label: 'MAQUINA SECUNDARIA',
        fields: [
          { key: 'correctoFuncionamientoAASec', label: '¿Correcto funcionamiento A/A secundario?', type: 'Enum', options: CORRECTO_DEFICIENTE },
          { key: 'motivoNoCorrectoAASec', label: 'Motivo de porqué no es correcto A/A secundario', type: 'LongText', placeholder: 'Describir motivo...' },
          { key: 'marcaAASecundarioExterior', label: 'Marca A/A secundario exterior', type: 'Enum', options: MARCA_AA },
          { key: 'modeloAASecundarioExterior', label: 'Modelo A/A secundario exterior', type: 'Ref' },
          { key: 'numSerieAASecundarioExterior', label: 'Número de Serie A/A Secundario Exterior', type: 'Text', placeholder: 'Nº de serie...' },
          { key: 'fotoAAExtSecGeneral', label: 'Máquina de aire exterior secundaria (general)', type: 'Image' },
          { key: 'fotoAAExtSecCaract', label: 'Máquina de aire exterior secundaria (características)', type: 'Image' },
          { key: 'tipoGasRefrigeranteSec', label: 'Tipo de Gas Refrigerante secundario', type: 'Enum', options: GAS_REFRIGERANTE },
          { key: 'kgGasRefrigeranteSec', label: 'Kg de Gas Refrigerante secundario', type: 'Text', placeholder: '0.0' },
          { key: 'modeloAASecundarioInterior', label: 'Modelo A/A secundario interior', type: 'Ref' },
          { key: 'numSerieAASecundarioInterior', label: 'Número de Serie A/A Secundario Interior', type: 'Text', placeholder: 'Nº de serie...' },
          { key: 'fotoAAIntSecGeneral', label: 'Máquina de aire interior secundaria (general)', type: 'Image' },
          { key: 'fotoAAIntSecCaract', label: 'Máquina de aire interior secundaria (características)', type: 'Image' },
          { key: 'fotoMandoAASec', label: 'Fotografía mando A/A secundario', type: 'Image' },
          { key: 'fotoFiltroAntesAASec', label: 'Fotografía Filtro A/A secundario (Antes)', type: 'Image' },
          { key: 'fotoFiltroDespuesAASec', label: 'Fotografía Filtro A/A secundario (Después)', type: 'Image' },
        ],
      },
      {
        key: 'maquina_contingencia',
        label: 'MAQUINA DE CONTINGENCIA',
        fields: [
          { key: 'aaContingencia', label: 'A/A contingencia', type: 'Enum', options: SI_NO_NSNC },
          { key: 'marcaAAContingencia', label: 'Marca A/A contingencia', type: 'Text', placeholder: 'Marca...' },
          { key: 'fotoAAContExtGeneral', label: 'Fotografía A/A contingencia exterior (general)', type: 'Image' },
          { key: 'fotoAAContExtCaract', label: 'Fotografía A/A contingencia exterior (características)', type: 'Image' },
          { key: 'fotoAAContIntGeneral', label: 'Fotografía A/A contingencia interior (general)', type: 'Image' },
          { key: 'fotoAAContIntCaract', label: 'Fotografía A/A contingencia interior (características)', type: 'Image' },
        ],
      },
      {
        key: 'sondas_temperatura',
        label: 'SONDAS DE TEMPERATURA',
        fields: [
          { key: 'correctaOrientacionSonda', label: '¿Correcta orientación de la sonda? (Cara norte)', type: 'Enum', options: SI_NO_NSNC },
          { key: 'fotoSondaInterior', label: 'Fotografía Sonda Interior (hacer fotografía desde lejos)', type: 'Image' },
          { key: 'fotoSondaExterior', label: 'Fotografía Sonda Exterior (hacer fotografía desde lejos)', type: 'Image' },
        ],
      },
    ],
  },

  // ==========================================
  // 13. EXTRACCIÓN
  // ==========================================
  {
    key: 'extraccion',
    label: 'Extracción',
    icon: 'Wind',
    color: 'text-slate-700',
    fields: [
      { key: 'disponeExtraccion', label: '¿Dispone de extracción?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'tipoExtraccionAire', label: 'Tipo de extracción de aire', type: 'Enum', options: EXTRACCION },
      { key: 'fotoExtractores1', label: 'Fotografía extractores 1', type: 'Image' },
      { key: 'fotoExtractores2', label: 'Fotografía extractores 2', type: 'Image' },
      { key: 'fotoExtractores3', label: 'Fotografía extractores 3', type: 'Image' },
      { key: 'disponeFiltroFC', label: '¿Dispone de filtro FC?', type: 'Enum', options: FILTRO_FC },
      { key: 'fotoFiltroFCAntes', label: 'Foto filtro antes (FC)', type: 'Image' },
      { key: 'fotoFiltroFCDespues', label: 'Foto filtro después (FC)', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 14. SIGFOX
  // ==========================================
  {
    key: 'sigfox',
    label: 'Sigfox',
    icon: 'Radio',
    color: 'text-violet-700',
    fields: [
      { key: 'disponeEquiposSigfox', label: '¿Dispone de equipos Sigfox?', type: 'Enum', options: SI_NO },
      { key: 'modeloSigfox', label: 'Modelo Sigfox', type: 'Enum', options: MODELO_SIGFOX },
      { key: 'fotoEquiposSigfox', label: 'Equipos Sigfox', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 15. FOTOVOLTAICA
  // ==========================================
  {
    key: 'fotovoltaica',
    label: 'Fotovoltaica',
    icon: 'Sun',
    color: 'text-yellow-700',
    fields: [
      { key: 'instalacionFotovoltaica', label: 'Instalación Fotovoltaica', type: 'Enum', options: FOTOVOLTAICA },
      { key: 'fotoGeneralFotovoltaica', label: 'Fotografía General fotovoltaica', type: 'Image' },
      { key: 'fotoCuadroFotovoltaica', label: 'Fotografía cuadro fotovoltaica', type: 'Image' },
      { key: 'fotoConexionIGAFotovoltaica', label: 'Fotografía conexión IGA fotovoltaica', type: 'Image' },
      { key: 'tipoInversor', label: 'Tipo de inversor', type: 'Enum', options: TIPO_INVERSOR },
      { key: 'modeloInversorFotovoltaica', label: 'Modelo inversor Fotovoltaica', type: 'EnumList', options: TIPO_INVERSOR },
      { key: 'modeloEVCCFotovoltaica', label: 'Modelo EVCC Fotovoltaica', type: 'Enum', options: MODELO_EVCC_FV },
      { key: 'fotoValoresConsumoEVCCFV', label: 'Fotografía valores de consumo EVCC fotovoltaica', type: 'Image' },
      { key: 'fotoInversorEVCCFV', label: 'Fotografía Inversor/EVCC fotovoltaica', type: 'Image' },
      { key: 'rectificadoresEVCCFV', label: 'Rectificadores EVCC Fotovoltaica', type: 'Number', placeholder: '0' },
      { key: 'rectificadoresMaximosEVCCFV', label: 'Rectificadores máximos EVCC Fotovoltaica', type: 'Number', placeholder: '0' },
      { key: 'numeroPanelesFV', label: 'Número de paneles instalación fotovoltaica', type: 'Number', placeholder: '0' },
      { key: 'fotoPanelesFV', label: 'Fotografía paneles fotovoltaica', type: 'Image' },
      { key: 'fotoEstructuraFV', label: 'Fotografía estructura fotovoltaica', type: 'Image' },
      { key: 'fotoPATFV', label: 'Fotografía PAT (conexión toma de tierra) fotovoltaica', type: 'Image' },
      { key: 'observacionesFotovoltaica', label: 'Observaciones sobre la Instalación Fotovoltaica', type: 'LongText', placeholder: 'Observaciones...' },
    ],
    subsections: [],
  },

  // ==========================================
  // 16. LIMPIEZA
  // ==========================================
  {
    key: 'limpieza',
    label: 'Limpieza',
    icon: 'Sparkles',
    color: 'text-green-700',
    fields: [
      { key: 'seRealizaLimpieza', label: '¿Se realiza limpieza al centro?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'motivoNoLimpieza', label: 'Motivo de porqué no se realiza la limpieza', type: 'LongText', placeholder: 'Describir motivo...' },
      { key: 'fotoLimpieza1', label: 'Fotografía general limpieza centro 1', type: 'Image' },
      { key: 'fotoLimpieza2', label: 'Fotografía general limpieza centro 2', type: 'Image' },
      { key: 'fotoCartelCellnexInterior', label: 'Fotografía Cartel Cellnex Interior', type: 'Image' },
      { key: 'fotoCasetaInteriorNorte', label: 'Foto caseta interior cara norte', type: 'Image' },
      { key: 'fotoCasetaInteriorSur', label: 'Foto caseta interior cara sur', type: 'Image' },
      { key: 'fotoCasetaInteriorEste', label: 'Foto caseta interior cara este', type: 'Image' },
      { key: 'fotoCasetaInteriorOeste', label: 'Foto caseta interior cara oeste', type: 'Image' },
      { key: 'fotoTechoInterior', label: 'Fotografía Techo interior (intentad hacerla que se vea la mayor cantidad de techo posible, desde abajo)', type: 'Image' },
      { key: 'fotoPasamurosInterior', label: 'Foto pasamuros interior', type: 'Image' },
    ],
    subsections: [],
  },

  // ==========================================
  // 17. OBSERVACIONES
  // ==========================================
  {
    key: 'observaciones',
    label: 'Observaciones',
    icon: 'FileText',
    color: 'text-gray-700',
    fields: [
      { key: 'observaciones', label: 'Observaciones', type: 'LongText', placeholder: 'Observaciones generales...' },
      { key: 'necesitasMasFotos', label: '¿Necesitas añadir más fotografías?', type: 'Enum', options: SI_NO },
      { key: 'fotoVarios1', label: 'Varios 1', type: 'Image' },
      { key: 'fotoVarios2', label: 'Varios 2', type: 'Image' },
      { key: 'fotoVarios3', label: 'Varios 3', type: 'Image' },
      { key: 'fotoVarios4', label: 'Varios 4', type: 'Image' },
      { key: 'fotoVarios5', label: 'Varios 5', type: 'Image' },
      { key: 'fotoVarios6', label: 'Varios 6', type: 'Image' },
      { key: 'fotoVarios7', label: 'Varios 7', type: 'Image' },
      { key: 'fotoVarios8', label: 'Varios 8', type: 'Image' },
      { key: 'fotoVarios9', label: 'Varios 9', type: 'Image' },
      { key: 'fotoVarios10', label: 'Varios 10', type: 'Image' },
      // Categorías
      { key: 'cat_accesos', label: 'Accesos.', type: 'Show' },
      { key: 'cat_cerraduras', label: 'Cerraduras.', type: 'Show' },
      { key: 'cat_luminarias', label: 'Luminarias.', type: 'Show' },
      { key: 'cat_caseta_exterior', label: 'Caseta exterior.', type: 'Show' },
      { key: 'cat_torre', label: 'Torre.', type: 'Show' },
      { key: 'cat_nidos', label: 'Nidos.', type: 'Show' },
      { key: 'cat_vallado', label: 'Vallado.', type: 'Show' },
      { key: 'cat_recinto', label: 'Recinto.', type: 'Show' },
      { key: 'cat_equipos_exteriores', label: 'Equipos exteriores.', type: 'Show' },
      { key: 'cat_cuadro_electrico', label: 'Cuadro eléctrico.', type: 'Show' },
      { key: 'cat_medidas_electricas', label: 'Medidas eléctricas.', type: 'Show' },
      { key: 'cat_contadores', label: 'Contadores.', type: 'Show' },
      { key: 'cat_estacion_continua', label: 'Estación de continua.', type: 'Show' },
      { key: 'cat_baterias', label: 'Baterías.', type: 'Show' },
      { key: 'cat_remota', label: 'Remota.', type: 'Show' },
      { key: 'cat_enlaces', label: 'Enlaces.', type: 'Show' },
      { key: 'cat_aa', label: 'Aire Acondicionado.', type: 'Show' },
      { key: 'cat_aire_principal', label: 'Aire principal.', type: 'Show' },
      { key: 'cat_aire_secundario', label: 'Aire Secundario.', type: 'Show' },
      { key: 'cat_sondas', label: 'Sondas.', type: 'Show' },
      { key: 'cat_extraccion', label: 'Extracción.', type: 'Show' },
      { key: 'cat_filtro_fc', label: 'Filtro FC.', type: 'Show' },
      { key: 'cat_sigfox', label: 'Sigfox.', type: 'Show' },
      { key: 'cat_fotovoltaica', label: 'Fotovoltaica.', type: 'Show' },
      { key: 'cat_limpieza', label: 'Limpieza.', type: 'Show' },
      { key: 'cat_caseta_interior', label: 'Caseta interior.', type: 'Show' },
      { key: 'cat_varios', label: 'Varios.', type: 'Show' },
    ],
    subsections: [],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getAllFieldKeys(section: FormSection): string[] {
  const keys: string[] = [];
  section.fields.forEach(f => keys.push(f.key));
  section.subsections.forEach(sub => sub.fields.forEach(f => keys.push(f.key)));
  return keys;
}

export function countSectionFields(section: FormSection): number {
  let count = section.fields.filter(f => f.type !== 'Show').length;
  section.subsections.forEach(sub => { count += sub.fields.filter(f => f.type !== 'Show').length; });
  return count;
}

export function evaluateCondition(
  condition: VisibilityCondition,
  formValues: Record<string, string>
): boolean {
  const fieldValue = formValues[condition.fieldKey] || '';
  switch (condition.operator) {
    case 'equals': return fieldValue === condition.value;
    case 'not_equals': return fieldValue !== condition.value;
    case 'contains': return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
    case 'not_contains': return !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
    case 'is_empty': return !fieldValue || fieldValue.trim() === '';
    case 'is_not_empty': return !!fieldValue && fieldValue.trim() !== '';
    default: return true;
  }
}

export function isVisible(
  item: { visible?: boolean; conditions?: VisibilityCondition[]; conditionLogic?: 'and' | 'or' },
  formValues: Record<string, string>
): boolean {
  if (item.visible === false) return false;
  if (!item.conditions || item.conditions.length === 0) return true;
  const results = item.conditions.map(c => evaluateCondition(c, formValues));
  if (item.conditionLogic === 'or') return results.some(r => r);
  return results.every(r => r);
}

export function getAllEnumFields(sections: FormSection[]): { key: string; label: string; options?: string[] }[] {
  const fields: { key: string; label: string; options?: string[] }[] = [];
  const addFields = (f: FormField[]) => {
    f.forEach(field => {
      if (field.type === 'Enum' || field.type === 'EnumList') {
        fields.push({ key: field.key, label: field.label, options: field.options });
      }
    });
  };
  sections.forEach(section => {
    addFields(section.fields);
    section.subsections.forEach(sub => addFields(sub.fields));
  });
  return fields;
}

export function cloneSections(sections: FormSection[]): FormSection[] {
  return JSON.parse(JSON.stringify(sections));
}
