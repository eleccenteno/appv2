import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ============================================================
  // SEGURIDAD: Solo ejecutar si la DB está vacía
  // ============================================================
  const existingEmployees = await db.employee.count();
  if (existingEmployees > 0) {
    console.log('⚠️  La base de datos ya contiene datos. Saltando seed para preservar datos existentes.');
    console.log('   Si necesitas resetear, usa: bun run prisma/hash-passwords.ts');
    console.log('   Si necesitas un seed completo, borra la DB manualmente primero:');
    console.log('   rm db/custom.db && bun run db:push && bun run prisma/seed.ts');
    return;
  }

  // ============================================================
  // EMPRESAS
  // ============================================================
  console.log('🏢 Creando empresas...');
  const cellnex = await db.empresa.create({
    data: {
      nombre: 'Cellnex',
      slug: 'cellnex',
      descripcion: 'Driving telecom connectivity',
      activa: true,
    },
  });

  const insyte = await db.empresa.create({
    data: {
      nombre: 'Insyte',
      slug: 'insyte',
      descripcion: 'Instalaciones',
      activa: true,
    },
  });

  const centeno = await db.empresa.create({
    data: {
      nombre: 'Electrónica Centeno',
      slug: 'centeno',
      descripcion: 'ELECTRÓNICA CENTENO',
      activa: true,
    },
  });

  // ============================================================
  // SUB-EMPRESAS (Grupo Cellnex)
  // ============================================================
  console.log('🏗️ Creando sub-empresas...');
  const ontower = await db.subEmpresa.create({
    data: {
      nombre: 'OnTower',
      slug: 'ontower',
      descripcion: 'Infraestructura de telecomunicaciones',
      empresaId: cellnex.id,
    },
  });

  const retevision = await db.subEmpresa.create({
    data: {
      nombre: 'Retevision',
      slug: 'retevision',
      descripcion: 'Red de telecomunicaciones',
      empresaId: cellnex.id,
    },
  });

  const axion = await db.subEmpresa.create({
    data: {
      nombre: 'Axion',
      slug: 'axion',
      descripcion: 'Servicios de telecomunicación',
      empresaId: cellnex.id,
    },
  });

  const gamesystem = await db.subEmpresa.create({
    data: {
      nombre: 'GameSystem',
      slug: 'gamesystem',
      descripcion: 'Sistemas de entretenimiento',
      empresaId: cellnex.id,
    },
  });

  // ============================================================
  // EMPLEADOS (26 usuarios reales)
  // ============================================================
  console.log('👷 Creando empleados...');
  const toni = await db.employee.create({
    data: {
      username: 'toni',
      password: await bcrypt.hash('123', 10),
      name: 'Toni',
      nombreCompleto: 'Antonio Jose Sanchez Vargas',
      email: 'antonio.sanchez@electronicacenteno.es',
      phone: '660010275',
      dni: '08884701P',
      role: 'admin',
      tipo: 'Administrador',
      vehiculoMarca: 'Nissan',
      vehiculoModelo: 'X-Trail',
      vehiculoMatricula: '6498JLZ',
      activo: true,
    },
  });

  const curro = await db.employee.create({
    data: {
      username: 'curro',
      password: await bcrypt.hash('Fjavierl007', 10),
      name: 'Curro',
      nombreCompleto: 'Francisco Javier Burrero Lopez',
      email: 'fran.burrero@electronicacenteno.es',
      phone: '633281721',
      dni: '07254678H',
      role: 'encargado',
      tipo: 'Encargado',
      vehiculoMarca: 'Volkswagen',
      vehiculoModelo: 'Transporter',
      vehiculoMatricula: '0045JJJ',
      activo: true,
    },
  });

  const erika = await db.employee.create({
    data: {
      username: 'erika',
      password: await bcrypt.hash('By_eriika01', 10),
      name: 'Erika',
      nombreCompleto: 'Erica Serrat Calderon',
      email: 'erica@electronicacenteno.es',
      phone: '633016699',
      dni: '20537268Q',
      role: 'admin',
      tipo: 'Administrador',
      vehiculoMarca: 'Dacia',
      vehiculoModelo: 'Duster',
      vehiculoMatricula: '8477JSJ',
      activo: true,
    },
  });

  const moises = await db.employee.create({
    data: {
      username: 'moises',
      password: await bcrypt.hash('Ecenteno4', 10),
      name: 'Moises',
      nombreCompleto: 'Moises Santiago Andrades',
      email: 'moises@electronicacenteno.es',
      phone: '622664485',
      dni: '45876233L',
      role: 'encargado',
      tipo: 'Encargado',
      vehiculoMarca: 'Nissan',
      vehiculoModelo: 'X-Trail',
      vehiculoMatricula: '5459JST',
      activo: true,
    },
  });

  const miguel = await db.employee.create({
    data: {
      username: 'miguel_merideno',
      password: await bcrypt.hash('Ecenteno5', 10),
      name: 'Miguel',
      nombreCompleto: 'Miguel Angel Merideño Nevado',
      email: 'miguel.merideno@electronicacenteno.es',
      phone: '622954087',
      dni: '76042410V',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Dacia',
      vehiculoModelo: 'Duster',
      vehiculoMatricula: '9625KVZ',
      activo: true,
    },
  });

  const paco = await db.employee.create({
    data: {
      username: 'paco',
      password: await bcrypt.hash('Ecenteno6', 10),
      name: 'Paco',
      nombreCompleto: 'Francisco Gonzalez Centeno',
      email: 'paco@electronicacenteno.es',
      phone: '679164112',
      dni: '08789139B',
      role: 'admin',
      tipo: 'Administrador',
      vehiculoMarca: 'Skoda',
      vehiculoModelo: 'Kodiaq',
      vehiculoMatricula: '7731LBR',
      activo: true,
    },
  });

  const fran = await db.employee.create({
    data: {
      username: 'fran_hernandez',
      password: await bcrypt.hash('Lolotronco99', 10),
      name: 'Fran',
      nombreCompleto: 'Francisco Hernandez Fernandez',
      email: 'fran.hernandez@electronicacenteno.es',
      phone: '633375298',
      dni: '08893882N',
      role: 'encargado',
      tipo: 'Encargado',
      vehiculoMarca: 'Volkswagen',
      vehiculoModelo: 'Caddy',
      vehiculoMatricula: '1197KKB',
      activo: true,
    },
  });

  const fede = await db.employee.create({
    data: {
      username: 'fede',
      password: await bcrypt.hash('Ecenteno8', 10),
      name: 'Fede',
      nombreCompleto: 'Federico Garcia Urbano',
      email: 'fede@electronicacenteno.es',
      phone: '629492100',
      dni: '34774018L',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Mercedes',
      vehiculoModelo: 'Benz',
      vehiculoMatricula: '2509DVT',
      activo: true,
    },
  });

  const ian = await db.employee.create({
    data: {
      username: 'ian_vazquez',
      password: await bcrypt.hash('Ecenteno9', 10),
      name: 'Ian',
      nombreCompleto: 'Ian Vazquez Garcia',
      email: 'ian.vazquez@electronicacenteno.es',
      phone: '622664487',
      dni: '20966297A',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      vehiculoMarca: 'Renault',
      vehiculoModelo: 'Traffic',
      vehiculoMatricula: '4168HBG',
      activo: true,
    },
  });

  const lolo = await db.employee.create({
    data: {
      username: 'manuel_rivera',
      password: await bcrypt.hash('Ecenteno10', 10),
      name: 'Lolo',
      nombreCompleto: 'Manuel Rivera Flores',
      email: 'manuel.rivera@electronicacenteno.es',
      phone: '613404773',
      dni: '80063149B',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Volkswagen',
      vehiculoModelo: 'Caddy',
      vehiculoMatricula: '8733JLH',
      activo: true,
    },
  });

  const joseangel = await db.employee.create({
    data: {
      username: 'joseangel',
      password: await bcrypt.hash('Atw01difusion', 10),
      name: 'Jose Angel',
      nombreCompleto: 'Jose Angel Gonzalez Montaño',
      email: 'joseangel@electronicacenteno.es',
      phone: '679164113',
      dni: '34775998K',
      role: 'admin',
      tipo: 'Administrador',
      vehiculoMarca: 'Jeep',
      vehiculoModelo: 'Cherokee',
      vehiculoMatricula: '8680FJP',
      activo: true,
    },
  });

  const enrique = await db.employee.create({
    data: {
      username: 'pedro_lavado',
      password: await bcrypt.hash('Ecenteno12', 10),
      name: 'Enrique',
      nombreCompleto: 'Enrique Perez Gil',
      email: 'pedro.lavado@electronicacenteno.es',
      phone: '669968684',
      dni: '07268829R',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Volkswagen',
      vehiculoModelo: 'Caddy',
      vehiculoMatricula: '8733JLH',
      activo: true,
    },
  });

  const ramses = await db.employee.create({
    data: {
      username: 'ramses',
      password: await bcrypt.hash('Ecenteno13', 10),
      name: 'Ramses',
      nombreCompleto: 'Ramses Gonzalez Lagos',
      email: 'ramses@electronicacenteno.es',
      phone: '643857336',
      dni: '08898673L',
      role: 'empleado',
      tipo: 'Empleado',
      activo: true,
    },
  });

  const gonzalo = await db.employee.create({
    data: {
      username: 'gonzalo',
      password: await bcrypt.hash('Ecenteno14', 10),
      name: 'Gonzalo',
      nombreCompleto: 'Gonzalo Acosta Colmenar',
      email: 'gonzalo@electronicacenteno.es',
      phone: '683414507',
      dni: '20539115T',
      role: 'empleado',
      tipo: 'Empleado',
      activo: true,
    },
  });

  const carrillo = await db.employee.create({
    data: {
      username: 'centenoblanca2',
      password: await bcrypt.hash('Ecenteno15', 10),
      name: 'Carrillo',
      nombreCompleto: 'Jose Antonio Carrillo Ventura',
      email: 'centenoblanca2@gmail.com',
      phone: '669407778',
      dni: '34781561H',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      vehiculoMarca: 'Renault',
      vehiculoModelo: 'Traffic',
      vehiculoMatricula: '1382KBM',
      activo: true,
    },
  });

  const juancarlos = await db.employee.create({
    data: {
      username: 'juancarlos',
      password: await bcrypt.hash('Ecenteno16', 10),
      name: 'Juan Carlos',
      nombreCompleto: 'Juan Carlos Ramirez Mas',
      email: 'juancarlos@electronicacenteno.es',
      phone: '619314075',
      dni: '80042999D',
      role: 'empleado',
      tipo: 'Empleado',
      activo: true,
    },
  });

  const borrallo = await db.employee.create({
    data: {
      username: 'antonio_borrallo',
      password: await bcrypt.hash('Ecenteno17', 10),
      name: 'Antonio Borrallo',
      nombreCompleto: 'Antonio Borrallo Pereira',
      email: 'antonio.borrallo@electronicacenteno.es',
      phone: '666746317',
      dni: '08368623G',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Mitsubishi',
      vehiculoModelo: 'L200',
      vehiculoMatricula: '3157GTF',
      activo: true,
    },
  });

  const valentin = await db.employee.create({
    data: {
      username: 'centenoblanca1',
      password: await bcrypt.hash('Ecenteno18', 10),
      name: 'Valentin',
      nombreCompleto: 'Valentin Montaño Garcia',
      email: 'centenoblanca1@gmail.com',
      phone: '669410658',
      dni: '33974197T',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      vehiculoMarca: 'Renault',
      vehiculoModelo: 'Traffic',
      vehiculoMatricula: '4946LYG',
      activo: true,
    },
  });

  const fernando = await db.employee.create({
    data: {
      username: 'fernandoecenteno',
      password: await bcrypt.hash('Ecenteno19', 10),
      name: 'Fernando',
      nombreCompleto: 'Fernando Garcia Marquez',
      email: 'fernandoecenteno@gmail.com',
      phone: '627523544',
      dni: '0883981R',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      vehiculoMarca: 'Volkswagen',
      vehiculoModelo: 'Transporter',
      vehiculoMatricula: '8264JGT',
      activo: true,
    },
  });

  const josemanuel = await db.employee.create({
    data: {
      username: 'tramitacion',
      password: await bcrypt.hash('taller', 10),
      name: 'Jose Manuel',
      nombreCompleto: 'Jose Manuel Gordillo Pereira',
      email: 'tramitacion@electronicacenteno.es',
      phone: '629431888',
      dni: '45878395L',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      vehiculoMarca: 'Nissan',
      vehiculoModelo: 'X-Trail',
      vehiculoMatricula: '7670JVM',
      activo: true,
    },
  });

  const mecanico = await db.employee.create({
    data: {
      username: 'mecanico',
      password: await bcrypt.hash('Mecanico', 10),
      name: 'Mecanico',
      nombreCompleto: 'Mecanico',
      email: 'mecanico@electronicacenteno.es',
      phone: '123456789',
      dni: '00000000Z',
      role: 'mecanico',
      tipo: 'Mecanico',
      vehiculoMarca: 'Mitsubishi',
      vehiculoModelo: 'L200',
      vehiculoMatricula: '0252KVG',
      activo: true,
    },
  });

  const sara = await db.employee.create({
    data: {
      username: 'sara',
      password: await bcrypt.hash('taller', 10),
      name: 'Sara',
      nombreCompleto: 'Sara Mejias',
      email: 'sara@electronicaceneno.es',
      phone: '608641334',
      role: 'admin',
      tipo: 'Administrador',
      activo: true,
    },
  });

  const luzma = await db.employee.create({
    data: {
      username: 'luz',
      password: await bcrypt.hash('taller', 10),
      name: 'Luzma',
      nombreCompleto: 'Luz Marina Gonzalez Montaño',
      email: 'luz@electronicaceneno.es',
      phone: '659613270',
      role: 'empleado',
      tipo: 'Servicio Tecnico',
      activo: true,
    },
  });

  const israel = await db.employee.create({
    data: {
      username: 'israel',
      password: await bcrypt.hash('Ecenteno22', 10),
      name: 'Israel',
      nombreCompleto: 'Israel Marquez Gonzalez',
      email: 'israel@electronicacenteno.es',
      role: 'empleado',
      tipo: 'Empleado',
      activo: true,
    },
  });

  const angel = await db.employee.create({
    data: {
      username: 'angel_gutierrez',
      password: await bcrypt.hash('escorpion', 10),
      name: 'Angel',
      nombreCompleto: 'Angel Gutierrez Amaya',
      email: 'angel.gutierrez@electronicacenteno.es',
      phone: '642152253',
      dni: '20537732C',
      role: 'empleado',
      tipo: 'Empleado',
      vehiculoMarca: 'Renault',
      vehiculoModelo: 'Kangoo',
      vehiculoMatricula: '7030KLZ',
      activo: true,
    },
  });

  const david = await db.employee.create({
    data: {
      username: 'david_Delgado',
      password: await bcrypt.hash('Ecenteno26', 10),
      name: 'David',
      nombreCompleto: 'David Delgado Romero',
      email: 'david.Delgado@electronicacenteno.es',
      role: 'empleado',
      tipo: 'Empleado',
      activo: true,
    },
  });

  // ============================================================
  // CENTROS
  // ============================================================
  console.log('📍 Creando centros...');
  const centrosData = [
    { codigo: 'OT-ZAFRA-001', nombre: 'ZAFRA POLIGONO ATW', direccion: 'Polígono ATW, Zafra', ciudad: 'Zafra', provincia: 'Badajoz', codigoPostal: '06300', latitud: 38.4175, longitud: -6.4225, tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'OT-BADAJOZ-001', nombre: 'Centro Badajoz Norte', direccion: 'Calle Menacho 25', ciudad: 'Badajoz', provincia: 'Badajoz', codigoPostal: '06001', latitud: 38.8786, longitud: -6.9703, tipoSuministro: 'Monofásico', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'OT-MERIDA-001', nombre: 'Centro Mérida Sur', direccion: 'Avda. de la Libertad 12', ciudad: 'Mérida', provincia: 'Badajoz', codigoPostal: '06800', latitud: 38.9161, longitud: -6.3438, tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'OT-CACERES-001', nombre: 'Centro Cáceres Centro', direccion: 'Plaza Mayor 3', ciudad: 'Cáceres', provincia: 'Cáceres', codigoPostal: '10001', latitud: 39.4752, longitud: -6.3723, tipoSuministro: 'Trifásico con neutro', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'OT-PLASENCIA-001', nombre: 'Centro Plasencia', direccion: 'Calle Vidre 8', ciudad: 'Plasencia', provincia: 'Cáceres', codigoPostal: '10600', latitud: 40.0297, longitud: -6.0867, tipoSuministro: 'Monofásico', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'OT-NAVALMORAL-001', nombre: 'Centro Navalmoral', direccion: 'Avda. de España 15', ciudad: 'Navalmoral de la Mata', provincia: 'Cáceres', codigoPostal: '10300', latitud: 39.8947, longitud: -5.5386, tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: ontower.id },
    { codigo: 'RV-BADAJOZ-001', nombre: 'Centro Retevision Badajoz', direccion: 'Calle San Juan 10', ciudad: 'Badajoz', provincia: 'Badajoz', codigoPostal: '06002', latitud: 38.8800, longitud: -6.9750, tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: retevision.id },
    { codigo: 'RV-MERIDA-001', nombre: 'Centro Retevision Mérida', direccion: 'Calle Santa Eulalia 5', ciudad: 'Mérida', provincia: 'Badajoz', codigoPostal: '06801', latitud: 38.9180, longitud: -6.3400, tipoSuministro: 'Monofásico con neutro', empresaId: cellnex.id, subEmpresaId: retevision.id },
    { codigo: 'AX-CACERES-001', nombre: 'Centro Axion Cáceres', direccion: 'Ronda de San Francisco 7', ciudad: 'Cáceres', provincia: 'Cáceres', codigoPostal: '10002', latitud: 39.4780, longitud: -6.3700, tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: axion.id },
    { codigo: 'AX-ZAFRA-001', nombre: 'Centro Axion Zafra', direccion: 'Calle de la Fuente 22', ciudad: 'Zafra', provincia: 'Badajoz', codigoPostal: '06301', latitud: 38.4200, longitud: -6.4150, tipoSuministro: 'Monofásico', empresaId: cellnex.id, subEmpresaId: axion.id },
    { codigo: 'GS-BADAJOZ-001', nombre: 'Centro GameSystem Badajoz', direccion: 'Paseo de San Francisco 18', ciudad: 'Badajoz', provincia: 'Badajoz', codigoPostal: '06003', tipoSuministro: 'Trifásico', empresaId: cellnex.id, subEmpresaId: gamesystem.id },
    { codigo: 'IN-BADAJOZ-001', nombre: 'Centro Insyte Badajoz', direccion: 'Avda. de Elvas s/n', ciudad: 'Badajoz', provincia: 'Badajoz', codigoPostal: '06006', tipoSuministro: 'Trifásico', empresaId: insyte.id },
    { codigo: 'IN-CACERES-001', nombre: 'Centro Insyte Cáceres', direccion: 'Calle Moret 30', ciudad: 'Cáceres', provincia: 'Cáceres', codigoPostal: '10003', tipoSuministro: 'Monofásico', empresaId: insyte.id },
    { codigo: 'CE-ZAFRA-001', nombre: 'Centro Centeno Zafra', direccion: 'Polígono Industrial ATW', ciudad: 'Zafra', provincia: 'Badajoz', codigoPostal: '06300', latitud: 38.4180, longitud: -6.4200, tipoSuministro: 'Trifásico', empresaId: centeno.id },
    { codigo: 'CE-BADAJOZ-001', nombre: 'Centro Centeno Badajoz', direccion: 'Calle San Roque 14', ciudad: 'Badajoz', provincia: 'Badajoz', codigoPostal: '06004', tipoSuministro: 'Monofásico', empresaId: centeno.id },
  ];

  const centros: { id: string; codigo: string; nombre: string }[] = [];
  for (const c of centrosData) {
    const centro = await db.centro.create({ data: c });
    centros.push({ id: centro.id, codigo: centro.codigo, nombre: centro.nombre });
  }

  // ============================================================
  // VEHÍCULOS
  // ============================================================
  console.log('🚗 Creando vehículos...');
  const vehiculo1 = await db.vehiculo.create({
    data: {
      marca: 'Nissan',
      modelo: 'X-Trail',
      matricula: '6498JLZ',
      anio: 2020,
      color: 'Blanco',
      kilometraje: 45200,
      empresaId: centeno.id,
    },
  });

  const vehiculo2 = await db.vehiculo.create({
    data: {
      marca: 'Renault',
      modelo: 'Kangoo',
      matricula: '2345ABC',
      anio: 2021,
      color: 'Gris',
      kilometraje: 32100,
      empresaId: centeno.id,
    },
  });

  const vehiculo3 = await db.vehiculo.create({
    data: {
      marca: 'Peugeot',
      modelo: 'Partner',
      matricula: '5678DEF',
      anio: 2019,
      color: 'Azul',
      kilometraje: 67800,
      empresaId: cellnex.id,
    },
  });

  await db.vehiculoAsignacion.createMany({
    data: [
      { vehiculoId: vehiculo1.id, empleadoId: toni.id, fechaInicio: new Date('2024-01-01') },
      { vehiculoId: vehiculo2.id, empleadoId: curro.id, fechaInicio: new Date('2024-01-15') },
      { vehiculoId: vehiculo3.id, empleadoId: moises.id, fechaInicio: new Date('2024-02-01') },
    ],
  });

  await db.mantenimientoVehiculo.createMany({
    data: [
      { vehiculoId: vehiculo1.id, tipo: 'preventivo', descripcion: 'Cambio de aceite y filtros', fecha: new Date('2024-03-15'), kilometraje: 40000, costo: 250, taller: 'AutoTaller Zafra', estado: 'completado' },
      { vehiculoId: vehiculo1.id, tipo: 'itv', descripcion: 'Inspección Técnica de Vehículos', fecha: new Date('2024-06-20'), estado: 'completado' },
      { vehiculoId: vehiculo2.id, tipo: 'correctivo', descripcion: 'Reparación frenos delanteros', fecha: new Date('2024-04-10'), costo: 380, taller: 'Taller Mérida', estado: 'completado' },
      { vehiculoId: vehiculo3.id, tipo: 'preventivo', descripcion: 'Revisión general 60.000km', fecha: new Date('2024-05-01'), kilometraje: 60000, estado: 'pendiente' },
    ],
  });

  // ============================================================
  // PREVENTIVOS (ejemplo)
  // ============================================================
  console.log('📋 Creando preventivos de ejemplo...');
  const centroZafra = centros.find(c => c.codigo === 'OT-ZAFRA-001');
  const centroBadajoz = centros.find(c => c.codigo === 'OT-BADAJOZ-001');
  const centroMerida = centros.find(c => c.codigo === 'OT-MERIDA-001');

  if (centroZafra) {
    await db.preventivo.create({
      data: {
        procedimiento: 'Inspección Eléctrica',
        fecha: new Date('2026-04-10'),
        tipoSuministro: 'Trifásico',
        parcelaEdificio: 'Nave 3',
        observaciones: 'Revisión trimestral completada sin incidencias',
        latitud: 38.4175,
        longitud: -6.4225,
        estado: 'completado',
        tecnicoId: toni.id,
        centroId: centroZafra.id,
      },
    });
  }

  if (centroBadajoz) {
    await db.preventivo.create({
      data: {
        procedimiento: 'Revisión General',
        fecha: new Date('2026-04-15'),
        tipoSuministro: 'Monofásico',
        observaciones: 'Pendiente de revisión de contador',
        estado: 'en_progreso',
        tecnicoId: curro.id,
        centroId: centroBadajoz.id,
      },
    });
  }

  if (centroMerida) {
    await db.preventivo.create({
      data: {
        procedimiento: 'Verificación de Contadores',
        fecha: new Date('2026-04-18'),
        tipoSuministro: 'Trifásico',
        estado: 'pendiente',
        tecnicoId: erika.id,
        centroId: centroMerida.id,
      },
    });
  }

  // ============================================================
  // TAREAS (ejemplo)
  // ============================================================
  console.log('📝 Creando tareas de ejemplo...');
  if (centroZafra) {
    await db.tarea.create({
      data: {
        titulo: 'Reparación suministro eléctrico',
        descripcion: 'El suministro eléctrico del centro presenta cortes intermitentes. Revisar conexión principal.',
        tipo: 'correctivo',
        prioridad: 'alta',
        estado: 'en_progreso',
        fechaLimite: new Date('2026-04-25'),
        fechaInicio: new Date('2026-04-16'),
        centroId: centroZafra.id,
        asignadoA: toni.id,
      },
    });

    await db.tarea.create({
      data: {
        titulo: 'Sustitución contador dañado',
        descripcion: 'El contador de la vista general está oxidado y necesita sustitución.',
        tipo: 'reparacion',
        prioridad: 'media',
        estado: 'pendiente',
        fechaLimite: new Date('2026-05-01'),
        centroId: centroZafra.id,
        asignadoA: curro.id,
      },
    });
  }

  if (centroBadajoz) {
    await db.tarea.create({
      data: {
        titulo: 'Instalación nuevo punto de medición',
        descripcion: 'Se requiere instalar un nuevo punto de medición en la planta superior del edificio.',
        tipo: 'instalacion',
        prioridad: 'baja',
        estado: 'pendiente',
        fechaLimite: new Date('2026-05-15'),
        centroId: centroBadajoz.id,
        asignadoA: moises.id,
      },
    });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log(`   - Empresas: 3`);
  console.log(`   - Sub-empresas: 4`);
  console.log(`   - Empleados: 26`);
  console.log(`   - Centros: ${centros.length}`);
  console.log(`   - Vehículos: 3`);
  console.log(`   - Preventivos: 3`);
  console.log(`   - Tareas: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
