'use client';

import { useEffect } from 'react';
import { useAppStore, ThemeName } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Palette, Sparkles, Flame, TreePine, Moon, Waves } from 'lucide-react';

interface ThemeOption {
  id: ThemeName;
  name: string;
  description: string;
  icon: React.ElementType;
  colors: { bg: string; primary: string; accent: string; text: string; name: string }[];
  tags: string[];
}

const themes: ThemeOption[] = [
  {
    id: 'oceano',
    name: 'Océano',
    description: 'Azul profundo con acentos teal. Profesional y sereno como el mar, perfecto para entornos de trabajo que requieren concentración y claridad visual. La paleta azul transmite confianza y estabilidad.',
    icon: Waves,
    colors: [
      { bg: '#f0f4ff', primary: '#2563eb', accent: '#0d9488', text: '#1e293b', name: 'Fondo' },
      { bg: '#2563eb', primary: '#ffffff', accent: '#0d9488', text: '#ffffff', name: 'Primario' },
      { bg: '#0d9488', primary: '#ffffff', accent: '#f0f4ff', text: '#ffffff', name: 'Acento' },
      { bg: '#e8f0fe', primary: '#2563eb', accent: '#0d9488', text: '#1e293b', name: 'Sidebar' },
    ],
    tags: ['Profesional', 'Sereno', 'Corporativo'],
  },
  {
    id: 'volcan',
    name: 'Volcán',
    description: 'Rojo fuego con acentos naranja. Energía pura y pasión, ideal para equipos dinámicos que necesitan sentir la urgencia y la importancia de cada preventivo. La paleta cálida impulsa la acción.',
    icon: Flame,
    colors: [
      { bg: '#fef2f2', primary: '#dc2626', accent: '#ea580c', text: '#1c1917', name: 'Fondo' },
      { bg: '#dc2626', primary: '#ffffff', accent: '#ea580c', text: '#ffffff', name: 'Primario' },
      { bg: '#ea580c', primary: '#ffffff', accent: '#fef2f2', text: '#ffffff', name: 'Acento' },
      { bg: '#fee2e2', primary: '#dc2626', accent: '#ea580c', text: '#1c1917', name: 'Sidebar' },
    ],
    tags: ['Energía', 'Pasión', 'Acción'],
  },
  {
    id: 'bosque',
    name: 'Bosque',
    description: 'Verde natural con acentos tierra. Naturaleza, calma y estabilidad. Un tema que conecta con lo orgánico y lo sostenible, perfecto para trabajo de campo y mantenimiento donde la naturaleza es el entorno.',
    icon: TreePine,
    colors: [
      { bg: '#f0fdf4', primary: '#16a34a', accent: '#a16207', text: '#14532d', name: 'Fondo' },
      { bg: '#16a34a', primary: '#ffffff', accent: '#a16207', text: '#ffffff', name: 'Primario' },
      { bg: '#a16207', primary: '#ffffff', accent: '#f0fdf4', text: '#ffffff', name: 'Acento' },
      { bg: '#dcfce7', primary: '#16a34a', accent: '#a16207', text: '#14532d', name: 'Sidebar' },
    ],
    tags: ['Natural', 'Tranquilo', 'Sostenible'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Púrpura mágico con acentos rosa. Creatividad, innovación y elegancia. Un tema que inspira a pensar fuera de lo convencional, ideal para empresas tecnológicas que quieren destacar su lado innovador.',
    icon: Sparkles,
    colors: [
      { bg: '#faf5ff', primary: '#9333ea', accent: '#ec4899', text: '#3b0764', name: 'Fondo' },
      { bg: '#9333ea', primary: '#ffffff', accent: '#ec4899', text: '#ffffff', name: 'Primario' },
      { bg: '#ec4899', primary: '#ffffff', accent: '#faf5ff', text: '#ffffff', name: 'Acento' },
      { bg: '#f3e8ff', primary: '#9333ea', accent: '#ec4899', text: '#3b0764', name: 'Sidebar' },
    ],
    tags: ['Creativo', 'Innovador', 'Elegante'],
  },
  {
    id: 'carbon',
    name: 'Carbón',
    description: 'Dark mode elegante con acentos cyan neón. Profesional nocturno, moderno y sofisticado. Reduce la fatiga visual en trabajos prolongados y da un aspecto premium y tecnológico a la aplicación.',
    icon: Moon,
    colors: [
      { bg: '#1a1a2e', primary: '#22d3ee', accent: '#fbbf24', text: '#e2e8f0', name: 'Fondo' },
      { bg: '#22d3ee', primary: '#1a1a2e', accent: '#fbbf24', text: '#1a1a2e', name: 'Primario' },
      { bg: '#fbbf24', primary: '#1a1a2e', accent: '#22d3ee', text: '#1a1a2e', name: 'Acento' },
      { bg: '#16213e', primary: '#22d3ee', accent: '#fbbf24', text: '#e2e8f0', name: 'Sidebar' },
    ],
    tags: ['Dark Mode', 'Moderno', 'Premium'],
  },
];

export default function TemasView() {
  const { goBack, currentTheme, setTheme } = useAppStore();

  const handleSelectTheme = (themeId: ThemeName) => {
    setTheme(themeId);
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  // Apply current theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={goBack} className="h-10 w-10 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Temas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personaliza el aspecto visual de tu aplicación
          </p>
        </div>
      </div>

      {/* Themes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isActive = currentTheme === theme.id;

          return (
            <Card
              key={theme.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isActive
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:ring-1 hover:ring-border'
              }`}
              onClick={() => handleSelectTheme(theme.id)}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-primary text-primary-foreground shadow-md">
                    <Check className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>
              )}

              <CardContent className="p-5">
                {/* Theme header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.colors[1].bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: theme.colors[1].primary }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{theme.name}</h3>
                    <div className="flex gap-1.5 mt-0.5">
                      {theme.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color palette preview */}
                <div className="flex gap-2 mb-3">
                  {theme.colors.map((color, idx) => (
                    <div key={idx} className="flex-1">
                      <div
                        className="h-12 rounded-lg border border-border/50 shadow-inner"
                        style={{ backgroundColor: color.bg }}
                      />
                      <p className="text-[9px] text-center text-muted-foreground mt-1">{color.name}</p>
                    </div>
                  ))}
                </div>

                {/* Mini UI preview */}
                <div
                  className="rounded-lg p-3 border border-border/30"
                  style={{ backgroundColor: theme.colors[0].bg }}
                >
                  {/* Mini sidebar + content */}
                  <div className="flex gap-2 h-20">
                    {/* Mini sidebar */}
                    <div
                      className="w-8 rounded-md flex flex-col gap-1 p-1"
                      style={{ backgroundColor: theme.colors[3].bg }}
                    >
                      <div className="w-full h-1.5 rounded-full opacity-40" style={{ backgroundColor: theme.colors[3].primary }} />
                      <div className="w-full h-1.5 rounded-full opacity-20" style={{ backgroundColor: theme.colors[3].text }} />
                      <div className="w-full h-1.5 rounded-full opacity-20" style={{ backgroundColor: theme.colors[3].text }} />
                      <div className="w-full h-1.5 rounded-full opacity-30" style={{ backgroundColor: theme.colors[3].accent }} />
                      <div className="w-full h-1.5 rounded-full opacity-20" style={{ backgroundColor: theme.colors[3].text }} />
                    </div>
                    {/* Mini content */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div
                        className="h-2 rounded-full w-3/4"
                        style={{ backgroundColor: theme.colors[0].text, opacity: 0.15 }}
                      />
                      <div className="flex gap-1">
                        <div
                          className="h-4 flex-1 rounded"
                          style={{ backgroundColor: '#fff', opacity: 0.6, border: `1px solid ${theme.colors[0].text}15` }}
                        />
                        <div
                          className="h-4 flex-1 rounded"
                          style={{ backgroundColor: '#fff', opacity: 0.6, border: `1px solid ${theme.colors[0].text}15` }}
                        />
                      </div>
                      <div className="flex gap-1 mt-auto">
                        <div
                          className="h-3 w-12 rounded"
                          style={{ backgroundColor: theme.colors[1].bg, opacity: 0.8 }}
                        />
                        <div
                          className="h-3 w-10 rounded"
                          style={{ backgroundColor: theme.colors[2].bg, opacity: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                  {theme.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Apply button for mobile */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          El tema se aplica al instante. Tu preferencia se guarda automáticamente.
        </p>
      </div>
    </div>
  );
}
