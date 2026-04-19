'use client';

import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ServicioTecnico() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-800">Servicio Técnico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión de servicios técnicos y correctivos
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Wrench className="h-6 w-6 text-sky-500" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-500">Sección en desarrollo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El módulo de Servicio Técnico estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
