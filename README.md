# Electrónica Centeno - App de Gestión

Aplicación web de gestión para **Electrónica Centeno**, empresa de mantenimiento de instalaciones de Cellnex/OnTower.

## 🚀 Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Base de datos**: SQLite con Prisma ORM
- **Estado**: Zustand + TanStack Query

## 📋 Funcionalidades

- **Panel de Control**: Dashboard con estadísticas generales
- **Visor de Tareas**: Gestión de tareas correctivas y preventivas
- **Visor de Preventivos**: Gestión de mantenimientos preventivos
- **Centros**: Catálogo de centros/instalaciones Cellnex/OnTower
- **Empleados**: Gestión de personal técnico
- **Vehículos**: Control de vehículos y asignaciones
- **Datos Centros**: Editor de datos de centros con esquemas dinámicos
- **Formularios**: Sistema de formularios dinámicos para preventivos y tareas
- **Captura de Fotos**: Soporte para captura y almacenamiento de fotografías

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── api/          # API routes (REST)
│   │   ├── auth/     # Autenticación
│   │   ├── centros/  # CRUD centros
│   │   ├── employees/ # CRUD empleados
│   │   ├── empresas/ # CRUD empresas
│   │   ├── preventivos/ # CRUD preventivos + importación
│   │   ├── tareas/   # CRUD tareas + importación
│   │   └── vehiculos/ # CRUD vehículos
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # Componentes shadcn/ui
│   ├── VisorTareasView.tsx
│   ├── VisorPreventivosView.tsx
│   ├── PreventivosForm.tsx
│   ├── TareasView.tsx
│   └── ...
├── hooks/
└── lib/
    ├── db.ts         # Cliente Prisma
    ├── store.ts      # Zustand store
    ├── preventivo-schema.ts
    ├── tarea-schema.ts
    └── centros-schema.ts
prisma/
├── schema.prisma    # Esquema de base de datos
└── seed.ts          # Datos iniciales
```

## 🛠️ Instalación

```bash
# Instalar dependencias
bun install

# Configurar base de datos
cp .env.example .env
bun run db:push

# (Opcional) Cargar datos iniciales
bun run db:seed

# Iniciar en desarrollo
bun run dev
```

## 📦 Scripts

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Construir para producción |
| `bun run lint` | Verificar código con ESLint |
| `bun run db:push` | Sincronizar esquema Prisma con la BD |
| `bun run db:generate` | Generar cliente Prisma |

## 🔧 Configuración

Crear archivo `.env` con:

```
DATABASE_URL=file:./db/custom.db
```

## 📱 Empresas Soportadas

- **Cellnex** - Mantenimiento de instalaciones
- **OnTower** - Gestión de sitios
- **Axion** - Infraestructura de comunicaciones
- **Insyte** - Servicios de instalación
- **Retevision** - Mantenimiento de red
- **Gamesystem** - Sistemas de juego

## 📄 Licencia

Propiedad de Electrónica Centeno. Todos los derechos reservados.
