/**
 * Script para hashear contraseñas de empleados que estén en texto plano.
 * NO borra ningún dato existente. Solo actualiza las contraseñas que no tengan hash bcrypt.
 * 
 * Uso: bun run prisma/hash-passwords.ts
 */
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';

// Contraseñas conocidas por usuario (las mismas del seed original)
const KNOWN_PASSWORDS: Record<string, string> = {
  'toni': '123',
  'curro': 'Fjavierl007',
  'erika': 'By_eriika01',
  'moises': 'Ecenteno4',
  'miguel_merideno': 'Ecenteno5',
  'paco': 'Ecenteno6',
  'fran_hernandez': 'Lolotronco99',
  'fede': 'Ecenteno8',
  'ian_vazquez': 'Ecenteno9',
  'manuel_rivera': 'Ecenteno10',
  'joseangel': 'Atw01difusion',
  'pedro_lavado': 'Ecenteno12',
  'ramses': 'Ecenteno13',
  'gonzalo': 'Ecenteno14',
  'centenoblanca2': 'Ecenteno15',
  'juancarlos': 'Ecenteno16',
  'antonio_borrallo': 'Ecenteno17',
  'centenoblanca1': 'Ecenteno18',
  'fernandoecenteno': 'Ecenteno19',
  'tramitacion': 'taller',
  'mecanico': 'Mecanico',
  'sara': 'taller',
  'luz': 'taller',
  'israel': 'Ecenteno22',
  'angel_gutierrez': 'escorpion',
  'david_Delgado': 'Ecenteno26',
};

async function main() {
  console.log('🔐 Verificando contraseñas de empleados...');

  const employees = await db.employee.findMany({
    select: { id: true, username: true, password: true },
  });

  let hashed = 0;
  let skipped = 0;

  for (const emp of employees) {
    // Si la contraseña ya empieza con $2b$, ya está hasheada
    if (emp.password.startsWith('$2b$') || emp.password.startsWith('$2a$')) {
      console.log(`  ✅ ${emp.username}: ya tiene hash bcrypt`);
      skipped++;
      continue;
    }

    // Buscar la contraseña conocida para este usuario
    const plainPassword = KNOWN_PASSWORDS[emp.username];
    if (!plainPassword) {
      console.log(`  ⚠️  ${emp.username}: contraseña desconocida ("${emp.password}"). Hasheando con valor actual.`);
      // Hashear la contraseña actual (texto plano) como si fuera la contraseña
      const hash = await bcrypt.hash(emp.password, 10);
      await db.employee.update({
        where: { id: emp.id },
        data: { password: hash },
      });
      console.log(`  🔒 ${emp.username}: contraseña hasheada`);
      hashed++;
      continue;
    }

    // Hashear la contraseña conocida
    const hash = await bcrypt.hash(plainPassword, 10);
    await db.employee.update({
      where: { id: emp.id },
      data: { password: hash },
    });
    console.log(`  🔒 ${emp.username}: contraseña hasheada`);
    hashed++;
  }

  console.log(`\n📊 Resultado: ${hashed} contraseñas hasheadas, ${skipped} ya tenían hash`);

  if (hashed > 0) {
    console.log('✅ Las contraseñas ahora son seguras con bcrypt');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
