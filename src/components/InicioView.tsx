'use client';

import { useAppStore, ViewType } from '@/lib/store';
import { ArrowRight, Radio, Building2, Factory, Sparkles, ChevronRight } from 'lucide-react';

const empresas = [
  {
    id: 'cellnex' as ViewType,
    nombre: 'CELLNEX',
    subtexto: 'Driving Telecom Connectivity',
    icon: Radio,
    gradient: 'from-green-500 to-emerald-600',
    shadowColor: 'shadow-green-500/25',
    bgPattern: 'bg-green-500/5',
    accent: 'text-green-600',
    description: 'Infraestructura de telecomunicaciones',
    stat: '4 sub-empresas',
  },
  {
    id: 'insyte' as ViewType,
    nombre: 'INSYTE',
    subtexto: 'Instalaciones Integradas',
    icon: Building2,
    gradient: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/25',
    bgPattern: 'bg-blue-500/5',
    accent: 'text-blue-600',
    description: 'Instalaciones técnicas profesionales',
    stat: 'Próximamente',
  },
  {
    id: 'centeno' as ViewType,
    nombre: 'CENTENO',
    subtexto: 'Electrónica Centeno',
    icon: Factory,
    gradient: 'from-red-500 to-rose-600',
    shadowColor: 'shadow-red-500/25',
    bgPattern: 'bg-red-500/5',
    accent: 'text-red-600',
    description: 'Servicios electrónicos especializados',
    stat: 'Próximamente',
  },
];

export default function InicioView() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6 flex flex-col">
      {/* Hero Section */}
      <div className="text-center mb-8 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Sistema de Gestión
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">
          Bienvenido
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Seleccione una empresa para acceder a sus servicios y módulos de gestión
        </p>
      </div>

      {/* Company Cards */}
      <div className="w-full max-w-3xl mx-auto flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {empresas.map((empresa) => {
            const Icon = empresa.icon;
            return (
              <button
                key={empresa.id}
                onClick={() => setCurrentView(empresa.id)}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-left transition-all duration-300 hover:shadow-xl ${empresa.shadowColor} hover:-translate-y-1 hover:border-border`}
              >
                {/* Gradient accent top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${empresa.gradient} transition-all duration-300 group-hover:h-1.5`} />

                {/* Background pattern */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${empresa.bgPattern} group-hover:scale-150 transition-transform duration-500`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${empresa.gradient} flex items-center justify-center mb-4 shadow-lg ${empresa.shadowColor} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Name */}
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight mb-0.5">
                    {empresa.nombre}
                  </h3>

                  {/* Subtitle */}
                  <p className={`text-xs font-medium ${empresa.accent} mb-2`}>
                    {empresa.subtexto}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                    {empresa.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      {empresa.stat}
                    </span>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${empresa.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 shadow-md ${empresa.shadowColor}`}>
                      <ChevronRight className="h-3.5 w-3.5 text-white" />
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
