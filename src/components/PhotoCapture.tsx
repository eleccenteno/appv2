'use client';

import { useRef, useState } from 'react';
import { Camera, X, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoCaptureProps {
  value: string;
  onChange: (base64: string) => void;
  label: string;
  required?: boolean;
}

export default function PhotoCapture({ value, onChange, label, required }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione una imagen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe superar 10MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {value ? (
        <div className="relative">
          <div className="rounded-xl overflow-hidden border-2 border-teal-200 bg-teal-50/50">
            <img
              src={value}
              alt={label}
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 shadow-sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-teal-300 rounded-xl flex flex-col items-center justify-center gap-2 bg-teal-50/30 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer"
        >
          <Camera className="h-8 w-8 text-teal-400" />
          <span className="text-sm font-medium text-teal-600">Capturar Foto</span>
          <span className="text-xs text-teal-400">Toca para usar la cámara o seleccionar archivo</span>
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

interface MultiPhotoCaptureProps {
  fotos: { id: string; fotoBase64: string; descripcion: string }[];
  onAdd: (foto: { id: string; fotoBase64: string; descripcion: string }) => void;
  onRemove: (id: string) => void;
}

export function MultiPhotoCapture({ fotos, onAdd, onRemove }: MultiPhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione una imagen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe superar 10MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      onAdd({
        id: `foto-${Date.now()}`,
        fotoBase64: reader.result as string,
        descripcion: '',
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Fotos adicionales</label>

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative group">
              <div className="rounded-xl overflow-hidden border-2 border-teal-200">
                <img
                  src={foto.fotoBase64}
                  alt="Foto adicional"
                  className="w-full h-28 object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-80 hover:opacity-100 shadow-sm"
                onClick={() => onRemove(foto.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-20 border-2 border-dashed border-teal-300 rounded-xl flex items-center justify-center gap-2 bg-teal-50/30 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer"
      >
        <Upload className="h-5 w-5 text-teal-400" />
        <span className="text-sm font-medium text-teal-600">Añadir Foto</span>
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
