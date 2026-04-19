'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  latitud: number | null;
  longitud: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitud, longitud, onLocationChange }: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en este navegador');
      return;
    }

    setIsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(position.coords.latitude, position.coords.longitude);
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado. Habilite el acceso a la ubicación en la configuración del navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Información de ubicación no disponible.');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado al obtener la ubicación.');
            break;
          default:
            setError('Error al obtener la ubicación.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="h-4 w-4 text-teal-500" />
        Ubicación GPS
      </label>

      {latitud !== null && longitud !== null ? (
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-800">
                Lat: {latitud.toFixed(6)}
              </p>
              <p className="text-sm font-medium text-teal-800">
                Lng: {longitud.toFixed(6)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-teal-600" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-sm text-muted-foreground">Ubicación no obtenida</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={getLocation}
        disabled={isLoading}
        className="w-full border-teal-200 hover:bg-teal-50 hover:border-teal-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Obteniendo ubicación...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Obtener ubicación
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">{error}</p>
      )}
    </div>
  );
}
