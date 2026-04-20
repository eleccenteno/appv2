'use client';

import { useAppStore } from '@/lib/store';
import { ArrowLeft, Construction, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaceholderViewProps {
  title: string;
  subtitle?: string;
  color?: string;
  gradient?: string;
  icon?: React.ElementType;
}

export default function PlaceholderView({
  title,
  subtitle,
  color = 'from-primary to-primary/70',
  gradient,
  icon: CustomIcon,
}: PlaceholderViewProps) {
  const { goBack } = useAppStore();
  const gradientClass = gradient || color;

  return (
    <div className="min-h-[calc(100vh-10rem)] p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="h-10 w-10 rounded-xl hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Construction Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-center">
          {/* Gradient accent top */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradientClass}`} />

          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mx-auto mb-4 shadow-lg opacity-80`}>
            {CustomIcon ? (
              <CustomIcon className="h-8 w-8 text-white" />
            ) : (
              <Lock className="h-8 w-8 text-white" />
            )}
          </div>

          <h3 className="font-bold text-foreground text-lg">Módulo en desarrollo</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
            Este módulo se encuentra actualmente en fase de desarrollo. Estará disponible próximamente en futuras actualizaciones.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Próximamente
          </div>
        </div>
      </div>
    </div>
  );
}
