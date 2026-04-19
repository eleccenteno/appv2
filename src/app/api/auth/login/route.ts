import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const employee = await db.employee.findUnique({
      where: { username },
    });

    if (!employee) {
      await logActivity('login_failed', 'auth', null, request, {
        entity: 'employee',
        description: `Intento de login fallido: usuario "${username}" no encontrado`,
        status: 'error',
        statusCode: 401,
        severity: 'warn',
      });
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Compare password using bcrypt
    const passwordMatch = await comparePassword(password, employee.password);
    if (!passwordMatch) {
      await logActivity('login_failed', 'auth', null, request, {
        entity: 'employee',
        entityId: employee.id,
        entityName: employee.username,
        description: `Intento de login fallido: contraseña incorrecta para "${username}"`,
        status: 'error',
        statusCode: 401,
        severity: 'warn',
      });
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const { password: _password, ...safeEmployee } = employee;
    void _password;

    // Generate JWT token
    const token = signToken({
      id: employee.id,
      username: employee.username,
      role: employee.role,
    });

    await logActivity('login', 'auth', { id: employee.id, username: employee.username, role: employee.role }, request, {
      entity: 'employee',
      entityId: employee.id,
      entityName: employee.username,
      description: `Inicio de sesión exitoso: ${employee.username}`,
    });

    return NextResponse.json({
      user: safeEmployee,
      token,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    await logActivity('error', 'auth', null, request, {
      description: 'Error interno del servidor durante login',
      status: 'error',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : String(error),
      severity: 'error',
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
