// Centros Data Schema - converted from sections_config.json
// Uses the same FormSection/FormField types as preventivo-schema for editor compatibility

import { FormSection, FormField, FieldType, cloneSections } from '@/lib/preventivo-schema';

// ============================================================
// COMMON ENUM OPTIONS FOR CENTROS
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
const COMERCIALIZADORA = ['Iberdrola', 'Endesa', 'Naturgy', 'Repsol', 'TotalEnergies', 'Otros'];
const TIPO_LINEA_ACOMETIDA = ['Aérea', 'Subterránea', 'Mixta', 'NS/NC'];
const TIPO_LINEA_CENTRO = ['AT', 'MT', 'BT', 'NS/NC'];
const ESTADO_ACOMETIDA = ['Correcto', 'Deficiente', 'Pendiente revisión', 'Sin acometida'];
const PROPIETARIO_GRUPO = ['Cellnex', 'Propietario', 'Compartido', 'Otro'];
const REMOTA_OPTIONS = ['Sí - OnTower', 'Sí - Movistar', 'Sí - Otros', 'No'];
const TARJETA_SIM = ['M2M Movistar', 'M2M Vodafone', 'M2M Orange', 'M2M Otros', 'No dispone'];
const EVCC_OPTIONS = ['Sí - Eltek', 'Sí - Huawei', 'Sí - ZTE', 'Sí - Otros', 'No'];
const LIMITACION_CARGA = ['Sin limitación', 'Limitado 10A', 'Limitado 15A', 'Limitado 20A', 'Otro'];
const MARCA_BATERIAS = ['Yuasa', 'Exide', 'Hoppecke', 'Fiamm', 'C&D', 'Enersys', 'Cegasa', 'Otro'];
const ESTADO_BATERIAS = ['Buen estado', 'Deficiente', 'Sin baterías', 'Pendiente revisión'];
const CANTIDAD_MAQUINAS_AA = ['1', '2', '3', '4', '5+'];
const TIPO_MAQUINA_AA = ['Split', 'Consola', 'Cassette', 'Techo', 'Conducto', 'Otro'];
const MARCA_AA = ['Daikin', 'Mitsubishi', 'Fujitsu', 'Samsung', 'LG', 'Toshiba', 'Carrier', 'Hisense', 'Haier', 'Otro'];
const MODELO_AA_EXTERIOR = ['Unidad exterior', 'Condensadora', 'Split exterior', 'Otro'];
const MODELO_AA_INTERIOR = ['Unidad interior', 'Evaporadora', 'Split interior', 'Otro'];
const GAS_REFRIGERANTE = ['R32', 'R410A', 'R22', 'R407C', 'R290', 'R134a', 'Otro'];
const CORRECTO_DEFICIENTE = ['Correcto', 'Deficiente', 'NS/NC'];
const ALTURA_TORRE = ['15m', '20m', '25m', '30m', '35m', '40m', '45m', '50m', '60m', '75m', '90m', '100m+', 'Otro'];
const TIPO_ESCALERAS = ['Fijas', 'De gato', 'Sin escaleras', 'Marina', 'Vertical'];
const TIPO_LINEA_VIDA = ['Cable', 'Rail', 'No dispone', 'NS/NC'];
const ESTADO_LINEA_VIDA = ['Vigente', 'Caducada', 'Pendiente revisión', 'Sin línea de vida'];
const ESTADO_PINTURA = ['Buen estado', 'Regular', 'Necesita pintura', 'N/A'];
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
const EXTRACCION = ['Extractor axial', 'Extractor centrífugo', 'Ventilador', 'Otro', 'No dispone'];
const FILTRO_FC = ['Sí', 'No', 'NS/NC'];
const TIPO_CERRADURA = ['Cerradura llave', 'Cerradura embutida', 'Bombín', 'Otro'];
const MODELO_SIGFOX = ['NKE Watteco', 'Sensing Labs', 'ATIM', 'Adeunis', 'Otro'];
const FOTOVOLTAICA = ['Sí', 'No', 'En proyecto'];
const TIPO_INVERSOR = ['Fronius', 'SMA', 'Huawei', 'Sungrow', 'SolarEdge', 'GoodWe', 'Otro'];
const MODELO_EVCC_FV = ['CE+T', 'Eltek', 'Huawei', 'ZTE', 'Otro'];
const ORIENTACION_SONDA = ['Sí', 'No', 'NS/NC'];

// ============================================================
// CENTROS SECTIONS (converted from sections_config.json)
// ============================================================
export const CENTROS_SECTIONS: FormSection[] = [
  // 1. General
  {
    key: 'general',
    label: 'General',
    icon: 'FileText',
    color: 'text-blue-700',
    fields: [
      { key: 'col_0', label: 'Nombre del centro', type: 'Text' },
      { key: 'col_1', label: 'Codigo info', type: 'Text' },
      { key: 'col_2', label: 'Provincia', type: 'Enum', options: PROVINCIA },
      { key: 'col_3', label: 'Prioridad', type: 'Enum', options: PRIORIDAD },
      { key: 'col_4', label: 'Proyecto', type: 'Enum', options: PROYECTO },
      { key: 'col_5', label: 'Tipo centro', type: 'Enum', options: TIPO_CENTRO },
      { key: 'col_6', label: 'Localizacion centro', type: 'LatLong' },
    ],
    subsections: [],
  },

  // 2. Suministro Eléctrico
  {
    key: 'suministro_electrico',
    label: 'Suministro Eléctrico',
    icon: 'Zap',
    color: 'text-amber-700',
    fields: [
      { key: 'col_7', label: 'DATOS INTERES SUMINISTRO ELECTRICO', type: 'Show' },
      { key: 'col_8', label: 'Tipo de suministro electrico', type: 'Enum', options: TIPO_SUMINISTRO },
      { key: 'col_9', label: 'De donde cogemos el suministro?', type: 'LongText' },
      { key: 'col_10', label: 'Comercializadora', type: 'Enum', options: COMERCIALIZADORA },
      { key: 'col_11', label: 'CUPS', type: 'LongText' },
      { key: 'col_12', label: 'Telefono comercializadora/responsable', type: 'Phone' },
      { key: 'col_13', label: 'Contacto comercializadora/responsable', type: 'Text' },
      { key: 'col_14', label: 'CIF ONTOWER/RETEVISION', type: 'LongText' },
      { key: 'col_15', label: 'Localizacion contador', type: 'LatLong' },
      { key: 'col_16', label: 'Tipo de linea del centro', type: 'Enum', options: TIPO_LINEA_CENTRO },
      { key: 'col_17', label: 'Tipo de linea de acometida', type: 'Enum', options: TIPO_LINEA_ACOMETIDA },
      { key: 'col_18', label: 'Estado de acometida', type: 'Enum', options: ESTADO_ACOMETIDA },
      { key: 'col_19', label: 'Motivo deficiencia acometida', type: 'LongText' },
      { key: 'col_20', label: 'Propietario grupo', type: 'Enum', options: PROPIETARIO_GRUPO },
    ],
    subsections: [],
  },

  // 3. Remota
  {
    key: 'remota',
    label: 'Remota',
    icon: 'Wifi',
    color: 'text-sky-700',
    fields: [
      { key: 'col_21', label: 'DATOS INTERES REMOTA', type: 'Show' },
      { key: 'col_22', label: 'Remota', type: 'Enum', options: REMOTA_OPTIONS },
      { key: 'col_23', label: 'Tarjeta SIM', type: 'Enum', options: TARJETA_SIM },
      { key: 'col_24', label: 'Nº Telefono Tarjeta SIM', type: 'Phone' },
      { key: 'col_25', label: 'IP remota', type: 'Text' },
    ],
    subsections: [],
  },

  // 4. EVCC
  {
    key: 'evcc',
    label: 'EVCC',
    icon: 'Battery',
    color: 'text-lime-700',
    fields: [
      { key: 'col_26', label: 'DATOS INTERES EVCC', type: 'Show' },
      { key: 'col_27', label: 'EVCC', type: 'Enum', options: EVCC_OPTIONS },
      { key: 'col_28', label: 'Rectificadores', type: 'Number' },
      { key: 'col_29', label: 'Rectificadores maximos', type: 'Number' },
      { key: 'col_30', label: 'Limitacion de carga EVCC', type: 'Enum', options: LIMITACION_CARGA },
      { key: 'col_31', label: 'Existen baterias?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_32', label: 'Marca Baterias', type: 'Enum', options: MARCA_BATERIAS },
      { key: 'col_33', label: 'Bancadas', type: 'Number' },
      { key: 'col_34', label: 'Numero Baterias', type: 'Number' },
      { key: 'col_35', label: 'Fecha instalacion baterias', type: 'Date' },
      { key: 'col_36', label: 'Estado de las baterias', type: 'Enum', options: ESTADO_BATERIAS },
    ],
    subsections: [],
  },

  // 5. Aire Acondicionado
  {
    key: 'aa',
    label: 'Aire Acondicionado',
    icon: 'Thermometer',
    color: 'text-red-700',
    fields: [
      { key: 'col_37', label: 'DATOS INTERES A.A', type: 'Show' },
      { key: 'col_38', label: 'Dispone de A/A?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_39', label: 'Cuantas maquinas de A/A dispone el centro?', type: 'EnumList', options: CANTIDAD_MAQUINAS_AA },
      { key: 'col_40', label: 'Tipo de maquina (Solo la principal, la mas "nueva")', type: 'Enum', options: TIPO_MAQUINA_AA },
      { key: 'col_41', label: 'MAQUINA PRINCIPAL', type: 'Show' },
      { key: 'col_42', label: 'Marca A/A principal exterior', type: 'Enum', options: MARCA_AA },
      { key: 'col_43', label: 'Modelo A/A principal exterior', type: 'Enum', options: MODELO_AA_EXTERIOR },
      { key: 'col_44', label: 'Numero de Serie A/A principal Exterior', type: 'Text' },
      { key: 'col_45', label: 'Tipo de Gas Refrigerante', type: 'Enum', options: GAS_REFRIGERANTE },
      { key: 'col_46', label: 'Kg de Gas Refrigerante', type: 'Decimal' },
      { key: 'col_47', label: 'Esta correctamente el sellado?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_48', label: 'Modelo A/A principal interior', type: 'Enum', options: MODELO_AA_INTERIOR },
      { key: 'col_49', label: 'Numero de Serie A/A principal Interior', type: 'Text' },
      { key: 'col_50', label: 'Correcto funcionamiento de A/A', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'col_51', label: 'Motivo de por que no es correcto.', type: 'LongText' },
      { key: 'col_52', label: 'MAQUINA SECUNDARIA', type: 'Show' },
      { key: 'col_53', label: '¿Correcto funcionamiento A/A secundario?', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'col_54', label: 'Motivo de por que no es correcto A/A secundario.', type: 'LongText' },
      { key: 'col_55', label: 'Marca A/A secundario exterior', type: 'Enum', options: MARCA_AA },
      { key: 'col_56', label: 'Modelo A/A secundario exterior', type: 'Enum', options: MODELO_AA_EXTERIOR },
      { key: 'col_57', label: 'Numero de Serie A/A Secundario Exterior', type: 'Text' },
      { key: 'col_58', label: 'Tipo de Gas Refrigerante secundario', type: 'Enum', options: GAS_REFRIGERANTE },
      { key: 'col_59', label: 'Kg de Gas Refrigerante secundario', type: 'Decimal' },
      { key: 'col_60', label: 'Modelo A/A secundario interior', type: 'Enum', options: MODELO_AA_INTERIOR },
      { key: 'col_61', label: 'Numero de Serie A/A Secundario Interior', type: 'Text' },
      { key: 'col_62', label: 'MAQUINA DE CONTINGENCIA', type: 'Show' },
      { key: 'col_63', label: 'A/A contingencia', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_64', label: 'Marca A/A contingencia', type: 'Enum', options: MARCA_AA },
      { key: 'col_65', label: 'SONDAS DE TEMPERATURA', type: 'Show' },
      { key: 'col_66', label: '¿Correcta orientacion de la sonda? (Cara norte)', type: 'Enum', options: ORIENTACION_SONDA },
      { key: 'col_67', label: 'Titulo Extraccion', type: 'Show' },
      { key: 'col_68', label: 'Dispone de extraccion?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_69', label: 'Tipo de extraccion de aire', type: 'Enum', options: EXTRACCION },
      { key: 'col_70', label: 'Dispone de filtro FC?', type: 'Enum', options: FILTRO_FC },
    ],
    subsections: [],
  },

  // 6. Torre
  {
    key: 'torre',
    label: 'Torre',
    icon: 'Radio',
    color: 'text-indigo-700',
    fields: [
      { key: 'col_71', label: 'DATOS INTERES TORRE', type: 'Show' },
      { key: 'col_72', label: 'Altura torre', type: 'Enum', options: ALTURA_TORRE },
      { key: 'col_73', label: 'Tipo de escaleras', type: 'Enum', options: TIPO_ESCALERAS },
      { key: 'col_74', label: 'Estado pintura de la torre', type: 'Enum', options: ESTADO_PINTURA },
      { key: 'col_75', label: 'Tiene pararrayos?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_76', label: 'Consta de 5 puntas?', type: 'Enum', options: SI_NO_NSNC },
    ],
    subsections: [],
  },

  // 7. GameSystem
  {
    key: 'gamesystem',
    label: 'GameSystem',
    icon: 'Gamepad2',
    color: 'text-green-700',
    fields: [
      { key: 'col_77', label: 'GAMESYSTEM', type: 'Show' },
      { key: 'col_78', label: 'Tipo de linea de vida', type: 'Enum', options: TIPO_LINEA_VIDA },
      { key: 'col_79', label: 'Estado linea de vida', type: 'Enum', options: ESTADO_LINEA_VIDA },
      { key: 'col_80', label: 'Proxima revision linea de vida', type: 'Text' },
    ],
    subsections: [],
  },

  // 8. Nidos
  {
    key: 'nidos',
    label: 'Nidos',
    icon: 'Bird',
    color: 'text-orange-700',
    fields: [
      { key: 'col_81', label: 'NIDOS', type: 'Show' },
      { key: 'col_82', label: '¿Hay nidos de cigueña en la torre?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_83', label: 'Numero de nidos', type: 'Number' },
      { key: 'col_84', label: 'Existe cesta para los nidos?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_85', label: 'Hay nidos en el interior de la cesta?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_86', label: 'Observaciones sobre los nidos', type: 'LongText' },
    ],
    subsections: [],
  },

  // 9. Infraestructura
  {
    key: 'infraestructura',
    label: 'Infraestructura',
    icon: 'Building2',
    color: 'text-cyan-700',
    fields: [
      { key: 'col_87', label: 'DATOS INTERES INFRAESTRUCTURA', type: 'Show' },
      { key: 'col_88', label: 'Parcela o edificio', type: 'Enum', options: PARCELA_EDIFICIO },
      { key: 'col_89', label: '¿Existe Candado para la cancilla de acceso al camino?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_90', label: 'Tipo de candado para la cancilla de acceso al camino', type: 'Enum', options: TIPO_CANDADO },
      { key: 'col_91', label: 'Acceso Restringido', type: 'Enum', options: ACCESO_RESTRINGIDO },
      { key: 'col_92', label: '4x4', type: 'Enum', options: VEHICULO_4X4 },
      { key: 'col_93', label: '¿Dispone de cilindro Locken?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_94', label: '¿Existe Candado para la cancilla de acceso al recinto?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_95', label: 'Tipo de Candado para la cancilla de acceso al recinto', type: 'Enum', options: TIPO_CANDADO },
      { key: 'col_96', label: 'Estado de puerta de acceso al centro', type: 'Enum', options: ESTADO_PUERTA },
      { key: 'col_97', label: '¿Dispone de barra antivandalica?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_98', label: 'Tipo candado barra antivandalica', type: 'Enum', options: TIPO_CANDADO },
      { key: 'col_99', label: '¿Existe cerradura para el acceso al centro?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_100', label: 'Estado cerradura de acceso al centro', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'col_101', label: 'Tipo de cerradura para el acceso al centro', type: 'Enum', options: TIPO_CERRADURA },
      { key: 'col_102', label: 'Funciona Correctamente el Sensor de puerta?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_103', label: 'Estado general del vallado', type: 'Enum', options: ESTADO_VALLADO },
      { key: 'col_104', label: 'Se repara vallado en la realizacion del preventivo?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_105', label: 'Tipo de terreno recinto centro.', type: 'Enum', options: TIPO_TERRENO },
      { key: 'col_106', label: '¿Necesita desbroce?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_107', label: 'Se ha desbrozado?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_108', label: 'Aplicacion de herbicida', type: 'Enum', options: APLICACION_HERBICIDA },
      { key: 'col_109', label: 'Tipo de herbicida utilizado.', type: 'Enum', options: TIPO_HERBICIDA },
      { key: 'col_110', label: 'Vegetacion que requiera otros procedimientos', type: 'EnumList', options: VEGETACION_OTROS },
      { key: 'col_111', label: 'Chatarra en el centro', type: 'Enum', options: CHATARRA },
    ],
    subsections: [],
  },

  // 10. Coubicados
  {
    key: 'coubicados',
    label: 'Coubicados',
    icon: 'Users',
    color: 'text-purple-700',
    fields: [
      { key: 'col_112', label: 'DATOS INTERES COUBICADOS', type: 'Show' },
      { key: 'col_113', label: 'EQUIPOS EXTERIORES', type: 'Show' },
      { key: 'col_114', label: '¿Dispone de equipos de compañias exteriores?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_115', label: 'Compañias coubicada en el exterior', type: 'EnumList', options: COMPANIAS },
      { key: 'col_116', label: 'EQUIPOS INTERIORES', type: 'Show' },
      { key: 'col_117', label: '¿Dispone de equipos de compañias interiores?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_118', label: 'Compañias coubicada en el interior', type: 'EnumList', options: COMPANIAS },
      { key: 'col_119', label: 'Nombre de la compañia interior', type: 'Enum', options: COMPANIAS },
    ],
    subsections: [],
  },

  // 11. Cuadro Eléctrico
  {
    key: 'cuadro_electrico',
    label: 'Cuadro Eléctrico',
    icon: 'Zap',
    color: 'text-yellow-700',
    fields: [
      { key: 'col_120', label: 'DATOS INTERES CUADRO ELECTRICO', type: 'Show' },
      { key: 'col_121', label: 'Esta bien realizado el reparto de cargas en el cuadro electrico?', type: 'Enum', options: CORRECTO_DEFICIENTE },
      { key: 'col_122', label: 'Total CV-MINI Cuadro electrico.', type: 'Number' },
      { key: 'col_123', label: 'Tipo de alimentacion Movistar Exterior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_124', label: 'Tipo de alimentacion Orange Exterior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_125', label: 'Tipo de alimentacion Vodafone Exterior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_126', label: 'Tipo de alimentacion Yoigo Exterior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_127', label: 'Tipo de alimentacion Otros Exterior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_128', label: 'Tipo de alimentacion Movistar Interior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_129', label: 'Tipo de alimentacion Orange Interior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_130', label: 'Tipo de alimentacion Vodafone Interior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_131', label: 'Tipo de alimentacion Yoigo Interior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_132', label: 'Tipo de alimentacion Otros Interior.', type: 'Enum', options: TIPO_ALIMENTACION },
      { key: 'col_133', label: 'Diodo colocado', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_134', label: 'Se ha cableado/instalado sensor en la puerta del cuadro electrico?', type: 'Enum', options: SI_NO_NSNC },
    ],
    subsections: [],
  },

  // 12. Enlaces
  {
    key: 'enlaces',
    label: 'Enlaces',
    icon: 'Link',
    color: 'text-pink-700',
    fields: [
      { key: 'col_135', label: 'DATOS INTERES ENLACES', type: 'Show' },
      { key: 'col_136', label: 'Existen enlaces en el centro?', type: 'Enum', options: SI_NO },
      { key: 'col_137', label: 'Numero de enlaces', type: 'Number' },
      { key: 'col_138', label: 'Numero de Vano 1', type: 'Text' },
      { key: 'col_139', label: 'Marca equipo 1', type: 'Text' },
      { key: 'col_140', label: 'Modelo equipo 1', type: 'Text' },
      { key: 'col_141', label: 'Numero de Vano 2', type: 'Text' },
      { key: 'col_142', label: 'Marca equipo 2', type: 'Text' },
      { key: 'col_143', label: 'Modelo equipo 2', type: 'Text' },
      { key: 'col_144', label: 'Numero de Vano 3', type: 'Text' },
      { key: 'col_145', label: 'Marca equipo 3', type: 'Text' },
      { key: 'col_146', label: 'Modelo equipo 3', type: 'Text' },
      { key: 'col_147', label: 'Numero de Vano 4', type: 'Text' },
      { key: 'col_148', label: 'Marca equipo 4', type: 'Text' },
      { key: 'col_149', label: 'Modelo equipo 4', type: 'Text' },
      { key: 'col_150', label: 'Numero de Vano 5', type: 'Text' },
      { key: 'col_151', label: 'Marca equipo 5', type: 'Text' },
      { key: 'col_152', label: 'Modelo equipo 5', type: 'Text' },
      { key: 'col_153', label: 'Numero de Vano 6', type: 'Text' },
      { key: 'col_154', label: 'Marca equipo 6', type: 'Text' },
      { key: 'col_155', label: 'Modelo equipo 6', type: 'Text' },
      { key: 'col_156', label: 'Numero de Vano 7', type: 'Text' },
      { key: 'col_157', label: 'Marca equipo 7', type: 'Text' },
      { key: 'col_158', label: 'Modelo equipo 7', type: 'Text' },
      { key: 'col_159', label: 'Numero de Vano 8', type: 'Text' },
      { key: 'col_160', label: 'Marca equipo 8', type: 'Text' },
      { key: 'col_161', label: 'Modelo equipo 8', type: 'Text' },
      { key: 'col_162', label: 'Numero de Vano 9', type: 'Text' },
      { key: 'col_163', label: 'Marca equipo 9', type: 'Text' },
      { key: 'col_164', label: 'Modelo equipo 9', type: 'Text' },
      { key: 'col_165', label: 'Numero de Vano 10', type: 'Text' },
      { key: 'col_166', label: 'Marca equipo 10', type: 'Text' },
      { key: 'col_167', label: 'Modelo equipo 10', type: 'Text' },
    ],
    subsections: [],
  },

  // 13. Sigfox
  {
    key: 'sigfox',
    label: 'Sigfox',
    icon: 'Radio',
    color: 'text-teal-700',
    fields: [
      { key: 'col_168', label: 'DATOS INTERES SIGFOX', type: 'Show' },
      { key: 'col_169', label: 'Dispone de equipos Sigfox?', type: 'Enum', options: SI_NO_NSNC },
      { key: 'col_170', label: 'Modelo Sigfox', type: 'Enum', options: MODELO_SIGFOX },
    ],
    subsections: [],
  },

  // 14. Fotovoltaica
  {
    key: 'fotovoltaica',
    label: 'Fotovoltaica',
    icon: 'Sun',
    color: 'text-amber-700',
    fields: [
      { key: 'col_171', label: 'DATOS INTERES FOTOVOLTAICA', type: 'Show' },
      { key: 'col_172', label: 'Instalacion Fotovoltaica', type: 'Enum', options: FOTOVOLTAICA },
      { key: 'col_173', label: 'Tipo de inversor', type: 'Enum', options: TIPO_INVERSOR },
      { key: 'col_174', label: 'Modelo inversor Fotovoltaica', type: 'Enum', options: TIPO_INVERSOR },
      { key: 'col_175', label: 'Modelo EVCC Fotovoltaica', type: 'Enum', options: MODELO_EVCC_FV },
      { key: 'col_176', label: 'Rectificadores EVCC Fotovoltaica', type: 'Number' },
      { key: 'col_177', label: 'Rectificadores maximos EVCC Fotovoltaica', type: 'Number' },
      { key: 'col_178', label: 'Numero de paneles instalacion fotovoltaica', type: 'Number' },
      { key: 'col_179', label: 'Observaciones sobre la Instalacion Fotovoltaica', type: 'LongText' },
    ],
    subsections: [],
  },
];

// Re-export cloneSections and helper functions for convenience
export { cloneSections };

// Helper: get all Enum/EnumList fields across all sections (for condition editor)
export function getAllEnumFields(sections: FormSection[]): { key: string; label: string; options?: string[]; sectionKey: string }[] {
  const result: { key: string; label: string; options?: string[]; sectionKey: string }[] = [];
  sections.forEach(section => {
    section.fields.forEach(f => {
      if (f.type === 'Enum' || f.type === 'EnumList') {
        result.push({ key: f.key, label: f.label, options: f.options, sectionKey: section.key });
      }
    });
    section.subsections.forEach(sub => {
      sub.fields.forEach(f => {
        if (f.type === 'Enum' || f.type === 'EnumList') {
          result.push({ key: f.key, label: f.label, options: f.options, sectionKey: section.key });
        }
      });
    });
  });
  return result;
}
