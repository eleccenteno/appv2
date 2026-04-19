'use client';

import { useAppStore } from '@/lib/store';
import LoginForm from '@/components/LoginForm';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DashboardHeader from '@/components/DashboardHeader';
import InicioView from '@/components/InicioView';
import PanelControl from '@/components/PanelControl';
import PreventivosForm from '@/components/PreventivosForm';
import ServicioTecnico from '@/components/ServicioTecnico';
import CellnexView from '@/components/CellnexView';
import InsyteView from '@/components/InsyteView';
import CentenoView from '@/components/CentenoView';
import OntowerView from '@/components/OntowerView';
import RetevisionView from '@/components/RetevisionView';
import AxionView from '@/components/AxionView';
import GamesystemView from '@/components/GamesystemView';
import PlaceholderView from '@/components/PlaceholderView';
import DatosCentrosView from '@/components/DatosCentrosView';
import UsuariosView from '@/components/UsuariosView';
import FormEditorView from '@/components/FormEditorView';
import CentrosEditorView from '@/components/CentrosEditorView';
import EditorView from '@/components/EditorView';
import VisorPreventivosView from '@/components/VisorPreventivosView';
import TareasView from '@/components/TareasView';
import VisorTareasView from '@/components/VisorTareasView';
import TemasView from '@/components/TemasView';

export default function Home() {
  const { isLoggedIn, currentUser, currentView } = useAppStore();

  // Show login if not authenticated
  if (!isLoggedIn || !currentUser) {
    return <LoginForm />;
  }

  // Determine which main content to show
  const renderContent = () => {
    switch (currentView) {
      case 'inicio':
        return <InicioView />;
      case 'panel-control':
        return <PanelControl />;
      case 'servicio-tecnico':
        return <ServicioTecnico />;

      // Company menus
      case 'cellnex':
        return <CellnexView />;
      case 'insyte':
        return <InsyteView />;
      case 'centeno':
        return <CentenoView />;

      // Cellnex sub-companies
      case 'ontower':
        return <OntowerView />;
      case 'retevision':
        return <RetevisionView />;
      case 'axion':
        return <AxionView />;
      case 'gamesystem':
        return <GamesystemView />;

      // Ontower functions
      case 'preventivos':
        return <PreventivosForm />;
      case 'tareas':
        return <TareasView />;
      case 'tareas-blacklist':
        return <PlaceholderView title="Tareas Black List" subtitle="OnTower" color="text-gray-700" />;
      case 'datos-centros':
        return <DatosCentrosView />;
      case 'mapa':
        return <PlaceholderView title="Mapa" subtitle="OnTower" color="text-emerald-700" />;
      case 'mapa-tareas':
        return <PlaceholderView title="Mapa Tareas Pendientes" subtitle="OnTower" color="text-amber-700" />;
      case 'manuales':
        return <PlaceholderView title="Manuales" subtitle="OnTower" color="text-indigo-700" />;
      case 'calendario':
        return <PlaceholderView title="Calendario" subtitle="OnTower" color="text-violet-700" />;
      case 'dashboard-cellnex':
        return <PlaceholderView title="Dashboard Cellnex" subtitle="OnTower" color="text-orange-700" />;

      // Users management
      case 'usuarios':
        return <UsuariosView />;

      // Editor submenu
      case 'editor':
        return <EditorView />;

      // Form editor
      case 'form-editor':
        return <FormEditorView />;

      // Centros editor
      case 'centros-editor':
        return <CentrosEditorView />;

      // Visor preventivos
      case 'visor-preventivos':
        return <VisorPreventivosView />;

      // Visor tareas
      case 'visor-tareas':
        return <VisorTareasView />;

      // Temas
      case 'temas':
        return <TemasView />;

      default:
        return <InicioView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <DashboardHeader user={currentUser} />
        <main className="flex-1 pb-20 lg:pb-6 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
