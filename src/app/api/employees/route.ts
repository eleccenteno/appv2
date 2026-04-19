import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

// GET /api/employees - Listar empleados con datos cruzados
export async function GET(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('role');
    const tipo = searchParams.get('tipo');
    const activo = searchParams.get('activo');
    const includeStats = searchParams.get('stats') === 'true';

    const where: Record<string, unknown> = {};
    if (rol) where.role = rol;
    if (tipo) where.tipo = tipo;
    if (activo !== null && activo !== undefined) where.activo = activo === 'true';

    // Pagination params
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(200, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          name: true,
          nombreCompleto: true,
          email: true,
          phone: true,
          dni: true,
          foto: true,
          role: true,
          tipo: true,
          vehiculoMarca: true,
          vehiculoModelo: true,
          vehiculoMatricula: true,
          activo: true,
          createdAt: true,
          _count: includeStats
            ? { select: { preventivos: true, tareasAsignadas: true } }
            : false,
          vehiculosAsignados: includeStats
            ? { where: { activa: true }, include: { vehiculo: { select: { marca: true, modelo: true, matricula: true } } }, take: 1 }
            : false,
        },
        orderBy: { name: 'asc' },
      }),
      db.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 });
  }
}

// POST /api/employees - Crear nuevo empleado
export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password, name, nombreCompleto, email, phone, dni, role, tipo, vehiculoMarca, vehiculoModelo, vehiculoMatricula } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password y nombre son requeridos' }, { status: 400 });
    }

    // Hash password with bcrypt before storing
    const hashedPassword = await hashPassword(password);

    const employee = await db.employee.create({
      data: {
        username,
        password: hashedPassword,
        name,
        nombreCompleto: nombreCompleto || null,
        email: email || null,
        phone: phone || null,
        dni: dni || null,
        role: role || 'empleado',
        tipo: tipo || null,
        vehiculoMarca: vehiculoMarca || null,
        vehiculoModelo: vehiculoModelo || null,
        vehiculoMatricula: vehiculoMatricula || null,
      },
      select: {
        id: true, username: true, name: true, nombreCompleto: true, email: true, phone: true, dni: true, role: true, tipo: true,
        vehiculoMarca: true, vehiculoModelo: true, vehiculoMatricula: true, activo: true,
      },
    });

    await logActivity('create', 'empleado', authUser, request, {
      entity: 'employee',
      entityId: employee.id,
      entityName: employee.name,
      description: `Empleado creado: ${employee.name} (${employee.username})`,
    });

    return NextResponse.json({ employee, message: 'Empleado creado exitosamente' }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      await logActivity('create', 'empleado', authUser, request, {
        entity: 'employee',
        description: `Intento de crear empleado duplicado: ${username}`,
        status: 'warning',
        statusCode: 409,
      });
      return NextResponse.json({ error: 'Ya existe un empleado con ese username' }, { status: 409 });
    }
    console.error('Error creating employee:', error);
    await logActivity('create', 'empleado', authUser, request, {
      entity: 'employee',
      description: 'Error al crear el empleado',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al crear el empleado' }, { status: 500 });
  }
}

// PUT /api/employees - Actualizar empleado
const EMPLOYEE_ALLOWED_FIELDS = [
  'username', 'password', 'name', 'nombreCompleto', 'email', 'phone', 'dni',
  'role', 'tipo', 'vehiculoMarca', 'vehiculoModelo', 'vehiculoMatricula', 'activo',
];

export async function PUT(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del empleado es requerido' }, { status: 400 });
    }

    // Build update data from whitelisted fields only (Mass Assignment fix)
    const updateData: Record<string, unknown> = {};
    for (const field of EMPLOYEE_ALLOWED_FIELDS) {
      if (rest[field] !== undefined) {
        updateData[field] = rest[field];
      }
    }

    // Hash password if provided and non-empty
    if (updateData.password && typeof updateData.password === 'string' && (updateData.password as string).trim() !== '') {
      updateData.password = await hashPassword(updateData.password as string);
    } else {
      delete updateData.password;
    }

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true, username: true, name: true, nombreCompleto: true, email: true, phone: true, dni: true, role: true, tipo: true,
        vehiculoMarca: true, vehiculoModelo: true, vehiculoMatricula: true, activo: true,
      },
    });

    await logActivity('update', 'empleado', authUser, request, {
      entity: 'employee',
      entityId: employee.id,
      entityName: employee.name,
      description: `Empleado actualizado: ${employee.name} (${employee.username})`,
    });

    return NextResponse.json({ employee, message: 'Empleado actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating employee:', error);
    await logActivity('update', 'empleado', authUser, request, {
      entity: 'employee',
      entityId: id,
      description: 'Error al actualizar el empleado',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al actualizar el empleado' }, { status: 500 });
  }
}

// DELETE /api/employees - Desactivar empleado (soft delete)
export async function DELETE(request: NextRequest) {
  const authUser = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del empleado es requerido' }, { status: 400 });
    }

    // Check if employee has related records
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        _count: { select: { preventivos: true, tareasAsignadas: true, vehiculosAsignados: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Instead of deleting, just deactivate (soft delete)
    const deactivated = await db.employee.update({
      where: { id },
      data: { activo: false },
      select: { id: true, username: true, name: true, activo: true },
    });

    await logActivity('delete', 'empleado', authUser, request, {
      entity: 'employee',
      entityId: deactivated.id,
      entityName: deactivated.name,
      description: `Empleado desactivado (soft delete): ${deactivated.name} (${deactivated.username})`,
    });

    return NextResponse.json({ employee: deactivated, message: 'Empleado desactivado exitosamente' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    await logActivity('delete', 'empleado', authUser, request, {
      entity: 'employee',
      description: 'Error al desactivar el empleado',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al desactivar el empleado' }, { status: 500 });
  }
}
