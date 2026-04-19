'use client';

import { useAppStore, Employee } from '@/lib/store';
import { Zap, Menu, LogOut, ArrowLeft, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  user: Employee;
}

const viewTitles: Record<string, string> = {
  'inicio': 'Inicio',
  'panel-control': 'Panel de Control',
  'servicio-tecnico': 'Servicio Técnico',
  'cellnex': 'Cellnex',
  'insyte': 'Insyte',
  'centeno': 'Centeno',
  'ontower': 'OnTower',
  'retevision': 'Retevision',
  'axion': 'Axion',
  'gamesystem': 'Gamesystem',
  'preventivos': 'Preventivos',
  'tareas': 'Tareas',
  'tareas-blacklist': 'Tareas Black List',
  'datos-centros': 'Datos Centros',
  'mapa': 'Mapa',
  'mapa-tareas': 'Mapa Tareas Pendientes',
  'manuales': 'Manuales',
  'calendario': 'Calendario',
  'dashboard-cellnex': 'Dashboard Cellnex',
  'temas': 'Temas',
  'visor-preventivos': 'Visor Preventivos',
  'usuarios': 'Usuarios',
};

const viewsWithBack = new Set([
  'cellnex', 'insyte', 'centeno',
  'ontower', 'retevision', 'axion', 'gamesystem',
  'preventivos', 'tareas', 'tareas-blacklist', 'datos-centros',
  'mapa', 'mapa-tareas', 'manuales', 'calendario', 'dashboard-cellnex',
  'temas', 'visor-preventivos', 'usuarios',
]);

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { setSidebarOpen, logout, currentView, goBack, navigationHistory } = useAppStore();

  const showBack = viewsWithBack.has(currentView) && navigationHistory.length > 0;
  const title = viewTitles[currentView] || 'Inicio';

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10"
                onClick={goBack}
              >
                <ArrowLeft className="h-[18px] w-[18px]" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-xl hover:bg-primary/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-[18px] w-[18px]" />
              </Button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground text-sm hidden sm:inline tracking-tight">
                  {title}
                </span>
                <span className="font-bold text-foreground text-sm sm:hidden tracking-tight">
                  {title.length > 16 ? title.substring(0, 14) + '...' : title}
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2.5 h-9 rounded-xl hover:bg-primary/10">
                <Avatar className="h-7 w-7 ring-1 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-border/50">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer rounded-lg mx-1 focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
