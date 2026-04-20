'use client';

import { useAppStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import LoginForm from '@/components/LoginForm';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DashboardHeader from '@/components/DashboardHeader';

// Lazy load all view components to reduce initial bundle size
const InicioView = dynamic(() => import('@/components/InicioView'));
const PanelControl = dynamic(() => import('@/components/PanelControl'));
const PreventivosForm = dynamic(() => import('@/components/PreventivosForm'));
const ServicioTecnico = dynamic(() => import('@/components/ServicioTecnico'));
const CellnexView = dynamic(() => import('@/components/CellnexView'));
const InsyteView = dynamic(() => import('@/components/InsyteView'));
const CentenoView = dynamic(() => import('@/components/CentenoView'));
const OntowerView = dynamic(() => import('@/components/OntowerView'));
const RetevisionView = dynamic(() => import('@/components/RetevisionView'));
const AxionView = dynamic(() => import('@/components/AxionView'));
const GamesystemView = dynamic(() => import('@/components/GamesystemView'));
const PlaceholderView = dynamic(() => import('@/components/PlaceholderView'));
const DatosCentrosView = dynamic(() => import('@/components/DatosCentrosView'));
const UsuariosView = dynamic(() => import('@/components/UsuariosView'));
const FormEditorView = dynamic(() => import('@/components/FormEditorView'));
const CentrosEditorView = dynamic(() => import('@/components/CentrosEditorView'));
const EditorView = dynamic(() => import('@/components/EditorView'));
const VisorPreventivosView = dynamic(() => import('@/components/VisorPreventivosView'));
const TareasView = dynamic(() => import('@/components/TareasView'));
const VisorTareasView = dynamic(() => import('@/components/VisorTareasView'));
const TemasView = dynamic(() => import('@/components/TemasView'));
const BackupView = dynamic(() => import('@/components/BackupView'));
const LogView = dynamic(() => import('@/components/LogView'));
const CentrosSearchView = dynamic(() => import('@/components/CentrosSearchView'));
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

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
        return <MapView />;
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

      // Backup
      case 'backup':
        return <BackupView />;

      // Logs
      case 'logs':
        return <LogView />;

      // Centros Search
      case 'centros-search':
        return <CentrosSearchView />;

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
        <main className={`flex-1 pb-20 lg:pb-6 ${currentView === 'mapa' ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar`}>
          {renderContent()}
        </main>
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
