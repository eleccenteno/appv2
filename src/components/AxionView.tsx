'use client';

import { useAppStore } from '@/lib/store';
import { ArrowLeft, Building2, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AxionView() {
  const { goBack } = useAppStore();

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-10">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-10 w-10 rounded-xl hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">AXION</h1>
              <p className="text-xs font-medium text-emerald-600">Grupo Cellnex</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25 opacity-80">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-foreground text-lg">Módulo en desarrollo</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
            El módulo de AXION se encuentra en fase de desarrollo. Estará disponible próximamente.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Próximamente
          </div>
        </div>
      </div>
    </div>
  );
}
