import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

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
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Compare password using bcrypt
    const passwordMatch = await comparePassword(password, employee.password);
    if (!passwordMatch) {
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

    return NextResponse.json({
      user: safeEmployee,
      token,
      message: 'Inicio de sesión exitoso',
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
