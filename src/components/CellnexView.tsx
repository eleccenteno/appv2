'use client';

import { useAppStore, ViewType } from '@/lib/store';
import { ArrowRight, Radio, Building2, Gamepad2, Zap, ChevronRight } from 'lucide-react';

const subEmpresas = [
  {
    id: 'ontower' as ViewType,
    nombre: 'OnTower',
    descripcion: 'Gestión de preventivos y centros',
    icon: Zap,
    gradient: 'from-sky-500 to-blue-600',
    shadowColor: 'shadow-sky-500/25',
    funcional: true,
    stats: '14 módulos',
  },
  {
    id: 'retevision' as ViewType,
    nombre: 'Retevision',
    descripcion: 'Servicios de telecomunicaciones',
    icon: Radio,
    gradient: 'from-purple-500 to-violet-600',
    shadowColor: 'shadow-purple-500/25',
    funcional: false,
    stats: 'Próximamente',
  },
  {
    id: 'axion' as ViewType,
    nombre: 'Axion',
    descripcion: 'Infraestructura de redes',
    icon: Building2,
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/25',
    funcional: false,
    stats: 'Próximamente',
  },
  {
    id: 'gamesystem' as ViewType,
    nombre: 'GameSystem',
    descripcion: 'Sistemas de entretenimiento',
    icon: Gamepad2,
    gradient: 'from-orange-500 to-amber-600',
    shadowColor: 'shadow-orange-500/25',
    funcional: false,
    stats: 'Próximamente',
  },
];

export default function CellnexView() {
  const { setCurrentView, goBack } = useAppStore();

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Radio className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">CELLNEX</h1>
              <p className="text-xs font-medium text-green-600">Driving Telecom Connectivity</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Seleccione una empresa del grupo Cellnex para acceder a sus módulos
          </p>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subEmpresas.map((empresa) => {
            const Icon = empresa.icon;
            return (
              <button
                key={empresa.id}
                onClick={() => empresa.funcional ? setCurrentView(empresa.id) : undefined}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 text-left transition-all duration-300 ${
                  empresa.funcional
                    ? `hover:shadow-xl ${empresa.shadowColor} hover:-translate-y-1 hover:border-border cursor-pointer`
                    : 'opacity-50 cursor-default'
                }`}
              >
                {/* Gradient accent top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${empresa.gradient} ${empresa.funcional ? 'group-hover:h-1.5' : ''} transition-all duration-300`} />

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${empresa.gradient} flex items-center justify-center shrink-0 shadow-lg ${empresa.shadowColor} ${empresa.funcional ? 'group-hover:scale-105' : ''} transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-base tracking-tight">
                      {empresa.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {empresa.descripcion}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${empresa.funcional ? 'text-green-600' : 'text-muted-foreground/50'}`}>
                        {empresa.stats}
                      </span>
                      {empresa.funcional && (
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${empresa.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
