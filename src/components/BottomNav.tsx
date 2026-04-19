'use client';

import { useAppStore, ViewType } from '@/lib/store';
import { LayoutDashboard, Home, Wrench } from 'lucide-react';

const navItems: { icon: React.ElementType; label: string; view: ViewType }[] = [
  { icon: LayoutDashboard, label: 'Panel', view: 'panel-control' },
  { icon: Home, label: 'Inicio', view: 'inicio' },
  { icon: Wrench, label: 'Servicio', view: 'servicio-tecnico' },
];

export default function BottomNav() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden safe-area-bottom">
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl transition-all duration-300 relative ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-primary/10 shadow-sm' : ''
                }`}>
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-semibold transition-all duration-300 ${
                  isActive ? 'text-primary' : ''
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
