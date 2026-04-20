'use client';

import { useAppStore, ViewType } from '@/lib/store';
import { ArrowLeft, FileText, Truck, Wrench, ClipboardList, ChevronRight, Settings, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EditorItem {
  id: ViewType;
  nombre: string;
  descripcion: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  iconBg: string;
  funcional: boolean;
  badge?: string;
}

const editores: EditorItem[] = [
  {
    id: 'form-editor',
    nombre: 'Formulario Preventivos',
    descripcion: 'Editar secciones, campos, opciones y visibilidad condicional del formulario de preventivos',
    icon: FileText,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    iconBg: 'bg-teal-100',
    funcional: true,
    badge: 'Activo',
  },
  {
    id: 'centros-editor',
    nombre: 'Datos Centros',
    descripcion: 'Editar secciones, campos, opciones y visibilidad condicional de los datos de centros',
    icon: Database,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    funcional: true,
    badge: 'Activo',
  },
  {
    id: 'panel-control',
    nombre: 'Vehículos',
    descripcion: 'Editor de formularios de mantenimiento de vehículos',
    icon: Truck,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    funcional: false,
  },
  {
    id: 'panel-control',
    nombre: 'Tareas',
    descripcion: 'Editor de formularios de tareas y correctivos',
    icon: ClipboardList,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    funcional: false,
  },
  {
    id: 'panel-control',
    nombre: 'Servicio Técnico',
    descripcion: 'Editor de formularios de servicio técnico',
    icon: Wrench,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    funcional: false,
  },
];

export default function EditorView() {
  const { setCurrentView, goBack } = useAppStore();

  const handleClick = (editor: EditorItem) => {
    if (editor.funcional) {
      setCurrentView(editor.id);
    }
  };

  const activeCount = editores.filter(e => e.funcional).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={goBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-violet-800 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personaliza los formularios y plantillas del sistema
          </p>
        </div>
        <Badge variant="secondary" className="bg-violet-100 text-violet-700">
          {activeCount}/{editores.length} activos
        </Badge>
      </div>

      {/* Info banner */}
      <div className="mb-5 bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-start gap-2">
        <Settings className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-violet-700 font-medium">Editor de formularios</p>
          <p className="text-xs text-violet-600 mt-0.5">
            Desde aquí puedes personalizar la estructura de los formularios del sistema: añadir o eliminar campos,
            cambiar tipos, configurar visibilidad condicional y gestionar opciones de selectores.
          </p>
        </div>
      </div>

      {/* Editor cards */}
      <div className="space-y-3">
        {editores.map((editor) => {
          const Icon = editor.icon;
          return (
            <Card
              key={editor.nombre}
              className={`transition-all duration-200 border-0 shadow-sm ${
                editor.funcional
                  ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                  : 'cursor-default opacity-50'
              }`}
              onClick={() => handleClick(editor)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${editor.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${editor.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${editor.funcional ? editor.color : 'text-muted-foreground'}`}>
                        {editor.nombre}
                      </h3>
                      {editor.funcional && editor.badge && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-teal-100 text-teal-700 border-teal-200">
                          {editor.badge}
                        </Badge>
                      )}
                      {!editor.funcional && (
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-gray-100 text-gray-500 border-gray-200">
                          Próximamente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {editor.descripcion}
                    </p>
                  </div>
                  {editor.funcional && (
                    <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
