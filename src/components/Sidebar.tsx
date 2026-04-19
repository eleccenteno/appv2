'use client';

import { useAppStore, ViewType, FontSizeLevel } from '@/lib/store';
import {
  Home,
  LogOut,
  X,
  ChevronRight,
  Radio,
  Building2,
  Factory,
  Zap,
  Users,
  Palette,
  Sun,
  Moon,
  Minus,
  Plus,
  Type,
  LayoutDashboard,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems: { icon: React.ElementType; label: string; view: ViewType; badge?: string }[] = [
  { icon: LayoutDashboard, label: 'Panel de Control', view: 'panel-control' },
  { icon: Home, label: 'Inicio', view: 'inicio' },
  { icon: Wrench, label: 'Servicio Técnico', view: 'servicio-tecnico' },
];

const empresaItems: { icon: React.ElementType; label: string; view: ViewType; color: string }[] = [
  { icon: Radio, label: 'Cellnex', view: 'cellnex', color: 'bg-green-500' },
  { icon: Building2, label: 'Insyte', view: 'insyte', color: 'bg-blue-500' },
  { icon: Factory, label: 'Centeno', view: 'centeno', color: 'bg-red-500' },
];

const fontSizeLabels: Record<FontSizeLevel, string> = {
  normal: 'A',
  large: 'A+',
  xlarge: 'A++',
};

export default function Sidebar() {
  const { currentView, setCurrentView, currentUser, logout, sidebarOpen, setSidebarOpen, currentTheme, setTheme, darkMode, toggleDarkMode, fontSizeLevel, increaseFontSize, decreaseFontSize } = useAppStore();

  // Apply theme on mount
  if (typeof document !== 'undefined' && currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-sidebar border-r border-sidebar-border shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <img src="/logo-company.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" />
              </div>
              <div>
                <h2 className="font-bold text-sidebar-foreground text-sm tracking-tight">Electrónica Centeno</h2>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Mantenimiento Preventivo
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 rounded-lg hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50">
                <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate text-sidebar-foreground">{currentUser.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{currentUser.role}</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent mx-4" />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Navegación
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/50" />}
                </button>
              );
            })}

            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent my-3" />

            <p className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Empresas
            </p>
            {empresaItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-[18px] h-[18px] rounded-md ${item.color} flex items-center justify-center`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    {item.label}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
                </button>
              );
            })}

            {/* OnTower quick access */}
            <button
              onClick={() => {
                setCurrentView('ontower');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                currentView === 'ontower' || currentView === 'preventivos'
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-md bg-sky-500 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                OnTower
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
            </button>

            {/* Admin: Usuarios */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setCurrentView('usuarios');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                  currentView === 'usuarios'
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                }`}
              >
                <Users className={`h-[18px] w-[18px] ${currentView === 'usuarios' ? 'text-sidebar-primary' : ''}`} />
                Usuarios
              </button>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent my-3" />

            {/* Temas */}
            <button
              onClick={() => {
                setCurrentView('temas');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                currentView === 'temas'
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              }`}
            >
              <Palette className={`h-[18px] w-[18px] ${currentView === 'temas' ? 'text-sidebar-primary' : ''}`} />
              Temas
            </button>

            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent my-3" />

            {/* Accesibilidad section */}
            <p className="px-3 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Accesibilidad
            </p>

            {/* Day/Night Toggle */}
            <div className="mx-1 px-3 py-3 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {darkMode ? (
                    <Moon className="h-[18px] w-[18px] text-sidebar-primary" />
                  ) : (
                    <Sun className="h-[18px] w-[18px] text-amber-500" />
                  )}
                  <span className="text-[13px] font-medium text-sidebar-foreground">
                    {darkMode ? 'Modo Noche' : 'Modo Día'}
                  </span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sidebar-primary/50 ${
                    darkMode ? 'bg-sidebar-primary shadow-lg shadow-sidebar-primary/30' : 'bg-sidebar-border'
                  }`}
                  aria-label={darkMode ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${
                      darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {darkMode ? (
                      <Moon className="h-2.5 w-2.5 text-sidebar-primary" />
                    ) : (
                      <Sun className="h-2.5 w-2.5 text-amber-500" />
                    )}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight pl-[26px]">
                {darkMode ? 'Fondo oscuro, menos fatiga visual' : 'Fondo claro estándar'}
              </p>
            </div>

            {/* Font Size Control */}
            <div className="mx-1 mt-1 px-3 py-3 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-[18px] w-[18px] text-sidebar-primary" />
                <span className="text-[13px] font-medium text-sidebar-foreground">
                  Tamaño letra
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSizeLevel === 'normal'}
                  className="flex-1 h-8 rounded-lg border border-sidebar-border/60 flex items-center justify-center hover:bg-sidebar-accent transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  aria-label="Reducir tamaño de letra"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="flex-1 flex items-center justify-center">
                  <span className={`font-bold transition-all duration-200 ${
                    fontSizeLevel === 'normal' ? 'text-xs' : fontSizeLevel === 'large' ? 'text-sm' : 'text-base'
                  } text-sidebar-foreground`}>
                    {fontSizeLabels[fontSizeLevel]}
                  </span>
                </div>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSizeLevel === 'xlarge'}
                  className="flex-1 h-8 rounded-lg border border-sidebar-border/60 flex items-center justify-center hover:bg-sidebar-accent transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  aria-label="Aumentar tamaño de letra"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="p-3 pt-1">
            <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent mb-3" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
