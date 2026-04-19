'use client';

import { useAppStore, ViewType } from '@/lib/store';
import { Users, Car, BarChart3, Edit, Shield, ChevronRight, Sparkles, Zap, Eye, Database, HardDrive } from 'lucide-react';

const menuCards: { icon: React.ElementType; label: string; view: ViewType; gradient: string; shadowColor: string; description: string; badge?: string; badgeGradient?: string }[] = [
  {
    icon: Shield,
    label: 'Preventivos',
    view: 'preventivos',
    gradient: 'from-teal-500 to-cyan-600',
    shadowColor: 'shadow-teal-500/20',
    description: 'Formulario de inspecciones preventivas',
    badge: 'Activo',
    badgeGradient: 'from-teal-500 to-cyan-600',
  },
  {
    icon: Eye,
    label: 'Visor Preventivos',
    view: 'visor-preventivos',
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/20',
    description: 'Consulta y seguimiento de preventivos',
    badge: 'Activo',
    badgeGradient: 'from-indigo-500 to-blue-600',
  },
  {
    icon: Database,
    label: 'Datos Centros',
    view: 'datos-centros',
    gradient: 'from-cyan-500 to-sky-600',
    shadowColor: 'shadow-cyan-500/20',
    description: 'Base de datos de centros',
    badge: 'Activo',
    badgeGradient: 'from-cyan-500 to-sky-600',
  },
  {
    icon: Users,
    label: 'Usuarios',
    view: 'usuarios',
    gradient: 'from-purple-500 to-violet-600',
    shadowColor: 'shadow-purple-500/20',
    description: 'Gestión de usuarios del sistema',
  },
  {
    icon: Car,
    label: 'Mant. Vehículos',
    view: 'panel-control',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    description: 'Mantenimiento de vehículos',
  },
  {
    icon: BarChart3,
    label: 'Estadísticas',
    view: 'panel-control',
    gradient: 'from-emerald-500 to-green-600',
    shadowColor: 'shadow-emerald-500/20',
    description: 'Estadísticas y reportes',
  },
  {
    icon: Edit,
    label: 'Editor',
    view: 'editor',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    description: 'Editores de formularios y plantillas',
  },
  {
    icon: HardDrive,
    label: 'Copias de Seguridad',
    view: 'backup',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    description: 'Crear y restaurar copias de seguridad',
    badge: 'Nuevo',
    badgeGradient: 'from-emerald-500 to-teal-600',
  },
];

export default function PanelControl() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Panel de Control</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Centro de administración del sistema</p>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => setCurrentView(card.view)}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 text-left transition-all duration-300 hover:shadow-xl ${card.shadowColor} hover:-translate-y-1 hover:border-border cursor-pointer`}
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} group-hover:h-1.5 transition-all duration-300`} />

                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadowColor} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="font-bold text-sm text-foreground">{card.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{card.description}</p>

                {card.badge && (
                  <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${card.badgeGradient} text-white text-[9px] font-bold uppercase tracking-wider shadow-sm`}>
                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    {card.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
