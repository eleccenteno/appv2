'use client';

import { useAppStore, ViewType } from '@/lib/store';
import {
  Shield,
  ClipboardList,
  Ban,
  Database,
  LayoutDashboard,
  Wrench,
  Map,
  MapPin,
  BookOpen,
  Gamepad2,
  CalendarDays,
  BarChart3,
  Users,
  Eye,
  Zap,
  Lock,
  Search,
} from 'lucide-react';

const funciones = [
  {
    id: 'preventivos' as ViewType,
    nombre: 'Preventivos',
    descripcion: 'Formulario de inspecciones',
    icon: Shield,
    gradient: 'from-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-500/20',
    funcional: true,
  },
  {
    id: 'visor-preventivos' as ViewType,
    nombre: 'Visor Preventivos',
    descripcion: 'Consulta y seguimiento',
    icon: Eye,
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/20',
    funcional: true,
  },
  {
    id: 'datos-centros' as ViewType,
    nombre: 'Datos Centros',
    descripcion: 'Base de datos de centros',
    icon: Database,
    gradient: 'from-cyan-500 to-sky-600',
    shadowColor: 'shadow-cyan-500/20',
    funcional: true,
  },
  {
    id: 'centros-search' as ViewType,
    nombre: 'Búsqueda Avanzada',
    descripcion: 'Filtrado multifiltro y exportación',
    icon: Search,
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    funcional: true,
  },
  {
    id: 'usuarios' as ViewType,
    nombre: 'Usuarios',
    descripcion: 'Gestión de personal',
    icon: Users,
    gradient: 'from-purple-500 to-violet-600',
    shadowColor: 'shadow-purple-500/20',
    funcional: true,
  },
  {
    id: 'tareas' as ViewType,
    nombre: 'Tareas',
    descripcion: 'Gestión de tareas',
    icon: ClipboardList,
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/20',
    funcional: true,
  },
  {
    id: 'visor-tareas' as ViewType,
    nombre: 'Visor Tareas',
    descripcion: 'Consulta y seguimiento',
    icon: Eye,
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    funcional: true,
  },
  {
    id: 'tareas-blacklist' as ViewType,
    nombre: 'Black List',
    descripcion: 'Tareas en lista negra',
    icon: Ban,
    gradient: 'from-gray-500 to-slate-600',
    shadowColor: 'shadow-gray-500/20',
    funcional: false,
  },
  {
    id: 'panel-control' as ViewType,
    nombre: 'Panel Control',
    descripcion: 'Dashboard general',
    icon: LayoutDashboard,
    gradient: 'from-sky-500 to-blue-600',
    shadowColor: 'shadow-sky-500/20',
    funcional: false,
  },
  {
    id: 'servicio-tecnico' as ViewType,
    nombre: 'Servicio Técnico',
    descripcion: 'Soporte y reparaciones',
    icon: Wrench,
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    funcional: false,
  },
  {
    id: 'mapa' as ViewType,
    nombre: 'Mapa',
    descripcion: 'Vista geográfica',
    icon: Map,
    gradient: 'from-emerald-500 to-green-600',
    shadowColor: 'shadow-emerald-500/20',
    funcional: false,
  },
  {
    id: 'mapa-tareas' as ViewType,
    nombre: 'Mapa Tareas',
    descripcion: 'Tareas pendientes en mapa',
    icon: MapPin,
    gradient: 'from-amber-500 to-yellow-600',
    shadowColor: 'shadow-amber-500/20',
    funcional: false,
  },
  {
    id: 'manuales' as ViewType,
    nombre: 'Manuales',
    descripcion: 'Documentación técnica',
    icon: BookOpen,
    gradient: 'from-indigo-500 to-purple-600',
    shadowColor: 'shadow-indigo-500/20',
    funcional: false,
  },
  {
    id: 'gamesystem' as ViewType,
    nombre: 'GameSystem',
    descripcion: 'Sistemas de entretenimiento',
    icon: Gamepad2,
    gradient: 'from-orange-500 to-red-600',
    shadowColor: 'shadow-orange-500/20',
    funcional: false,
  },
  {
    id: 'calendario' as ViewType,
    nombre: 'Calendario',
    descripcion: 'Planificación temporal',
    icon: CalendarDays,
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    funcional: false,
  },
  {
    id: 'dashboard-cellnex' as ViewType,
    nombre: 'Dashboard',
    descripcion: 'Estadísticas Cellnex',
    icon: BarChart3,
    gradient: 'from-orange-500 to-amber-600',
    shadowColor: 'shadow-orange-500/20',
    funcional: false,
  },
];

export default function OntowerView() {
  const { setCurrentView, goBack } = useAppStore();

  const handleClick = (funcion: typeof funciones[0]) => {
    if (funcion.funcional) {
      setCurrentView(funcion.id);
    }
  };

  const activos = funciones.filter(f => f.funcional);
  const inactivos = funciones.filter(f => !f.funcional);

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">OnTower</h1>
              <p className="text-xs font-medium text-sky-600">Cellnex Infrastructure</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Seleccione un módulo para acceder a sus funciones
          </p>
        </div>

        {/* Active modules */}
        {activos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Módulos Activos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activos.map((funcion) => {
                const Icon = funcion.icon;
                return (
                  <button
                    key={funcion.id}
                    onClick={() => handleClick(funcion)}
                    className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 text-center transition-all duration-300 hover:shadow-xl ${funcion.shadowColor} hover:-translate-y-1 hover:border-border cursor-pointer`}
                  >
                    {/* Gradient accent top */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${funcion.gradient} group-hover:h-1.5 transition-all duration-300`} />

                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${funcion.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg ${funcion.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground leading-tight">
                      {funcion.nombre}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                      {funcion.descripcion}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Inactive modules */}
        {inactivos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
              <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Próximamente</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inactivos.map((funcion) => {
                const Icon = funcion.icon;
                return (
                  <div
                    key={funcion.id}
                    className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-4 text-center opacity-40"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${funcion.gradient} flex items-center justify-center mx-auto mb-2 opacity-60`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-xs text-muted-foreground leading-tight">
                      {funcion.nombre}
                    </h3>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                      {funcion.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
