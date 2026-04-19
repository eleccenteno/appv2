'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  Search,
  X,
  MapPin,
  Navigation,
  Layers,
  ChevronDown,
  Zap,
  Thermometer,
  Building2,
  Wifi,
  TreePine,
  Link2,
  Radio,
  Sun,
  Database,
  List,
  Map,
  Satellite,
  Mountain,
  LocateFixed,
  SlidersHorizontal,
  Crosshair,
} from 'lucide-react';

import dynamic from 'next/dynamic';

// ─── Types ──────────────────────────────────────────────────────

interface CentroData {
  [sectionKey: string]: Record<string, string> | string;
  nombre: string;
  codigo: string;
  provincia: string;
  prioridad: string;
  proyecto: string;
  tipo_centro: string;
  localizacion: string;
}

interface SectionConfig {
  key: string;
  label: string;
  columns: ColumnConfig[];
}

interface ColumnConfig {
  index: number;
  key: string;
  label: string;
  type: string;
}

// ─── Constants ──────────────────────────────────────────────────

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  P1: { color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Prioridad 1' },
  P2: { color: '#f97316', bg: 'bg-orange-500/15', border: 'border-orange-500/30', label: 'Prioridad 2' },
  P3: { color: '#eab308', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', label: 'Prioridad 3' },
  'P3 AIRE': { color: '#3b82f6', bg: 'bg-blue-500/15', border: 'border-blue-500/30', label: 'P3 Aire' },
};

const TIPO_CENTRO_COLORS: Record<string, string> = {
  INDOOR: '#10b981',
  OUTDOOR: '#8b5cf6',
};

const MAP_CENTER: [number, number] = [39.22, -6.16];
const MAP_ZOOM = 7;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  general: <Database className="h-3.5 w-3.5" />,
  suministro_electrico: <Zap className="h-3.5 w-3.5" />,
  remota: <Wifi className="h-3.5 w-3.5" />,
  evcc: <Navigation className="h-3.5 w-3.5" />,
  aa: <Thermometer className="h-3.5 w-3.5" />,
  torre: <Building2 className="h-3.5 w-3.5" />,
  gamesystem: <Layers className="h-3.5 w-3.5" />,
  nidos: <TreePine className="h-3.5 w-3.5" />,
  infraestructura: <MapPin className="h-3.5 w-3.5" />,
  coubicados: <Crosshair className="h-3.5 w-3.5" />,
  cuadro_electrico: <Zap className="h-3.5 w-3.5" />,
  enlaces: <Link2 className="h-3.5 w-3.5" />,
  sigfox: <Radio className="h-3.5 w-3.5" />,
  fotovoltaica: <Sun className="h-3.5 w-3.5" />,
};

// ─── Dynamic Map Import ─────────────────────────────────────────

let leafletModule: any = null;

const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster').then(mod => mod.default),
  { ssr: false }
);

// ─── MapMarkers component ───────────────────────────────────────
function MapMarkers({ centros, onMarkerClick }: { centros: CentroData[]; onMarkerClick: (c: CentroData) => void }) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [components, setComponents] = useState<{ Marker: any; Popup: any; Tooltip: any } | null>(null);

  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([leafletMod, rlMod]) => {
      const leaflet = leafletMod.default;
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setL(leaflet);
      setComponents({
        Marker: rlMod.Marker,
        Popup: rlMod.Popup,
        Tooltip: rlMod.Tooltip,
      });
    });
  }, []);

  if (!L || !components) return null;

  const { Marker, Tooltip } = components;

  // ─── Beautiful SVG pin marker ─────────────────────────────────
  const getIcon = (prioridad: string, tipo: string) => {
    const config = PRIORIDAD_CONFIG[prioridad] || PRIORIDAD_CONFIG.P3;
    const isIndoor = tipo === 'INDOOR';
    const pinW = isIndoor ? 26 : 30;
    const pinH = isIndoor ? 34 : 40;
    const label = prioridad.replace('P3 AIRE', 'A³').replace('P', '');
    const uid = `p${prioridad.replace(' ', '-')}-${isIndoor ? 'i' : 'o'}`;

    return L.divIcon({
      html: `
        <svg width="${pinW}" height="${pinH}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25))">
          <defs>
            <linearGradient id="${uid}" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stop-color="${config.color}" />
              <stop offset="100%" stop-color="${config.color}" stop-opacity="0.75" />
            </linearGradient>
          </defs>
          <ellipse cx="15" cy="38" rx="5" ry="2" fill="rgba(0,0,0,0.12)"/>
          <path d="M15 37 C15 37 4 23 4 14.5 C4 7.6 8.9 3 15 3 C21.1 3 26 7.6 26 14.5 C26 23 15 37 15 37Z"
                fill="url(#${uid})" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          ${isIndoor
            ? '<circle cx="15" cy="14" r="6" fill="white" fill-opacity="0.3"/>'
            : '<rect x="10" y="9" width="10" height="10" rx="2" fill="white" fill-opacity="0.2"/>'}
          <text x="15" y="17.5" text-anchor="middle" dominant-baseline="central"
                fill="white" font-size="9" font-weight="800"
                font-family="system-ui,-apple-system,sans-serif"
                style="text-shadow:0 1px 2px rgba(0,0,0,0.25)">${label}</text>
        </svg>
      `,
      className: 'custom-marker',
      iconSize: [pinW, pinH],
      iconAnchor: [pinW / 2, pinH],
      popupAnchor: [0, -pinH - 2],
    });
  };

  return (
    <>
      {centros.map((centro) => {
        const parts = centro.localizacion?.split(',').map(s => parseFloat(s.trim()));
        if (!parts || parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

        return (
          <Marker
            key={`${centro.codigo}`}
            position={[parts[0], parts[1]]}
            icon={getIcon(centro.prioridad, centro.tipo_centro)}
            eventHandlers={{
              click: () => onMarkerClick(centro),
            }}
          >
            <Tooltip direction="top" offset={[0, -14]} className="font-sans">
              <div className="text-xs">
                <span className="font-bold">{centro.nombre}</span>
                <span className="text-gray-500 ml-1">({centro.codigo})</span>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

// Fly-to-center component
function FlyToCenter({ center }: { center: [number, number] | null }) {
  const [useMap, setUseMap] = useState<any>(null);

  useEffect(() => {
    import('react-leaflet').then(mod => setUseMap(() => mod.useMap));
  }, []);

  if (!useMap) return null;
  return <FlyToCenterInner center={center} useMap={useMap} />;
}

function FlyToCenterInner({ center, useMap }: { center: [number, number] | null; useMap: any }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Fit bounds component
function FitBounds({ centros, triggerReset }: { centros: CentroData[]; triggerReset: number }) {
  const [useMap, setUseMap] = useState<any>(null);

  useEffect(() => {
    import('react-leaflet').then(mod => setUseMap(() => mod.useMap));
  }, []);

  if (!useMap) return null;
  return <FitBoundsInner centros={centros} useMap={useMap} triggerReset={triggerReset} />;
}

function FitBoundsInner({ centros, useMap, triggerReset }: { centros: CentroData[]; useMap: any; triggerReset: number }) {
  const map = useMap();

  useEffect(() => {
    if (centros.length > 0) {
      const bounds = centros
        .map(c => {
          const parts = c.localizacion?.split(',').map(s => parseFloat(s.trim()));
          if (parts && parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return [parts[0], parts[1]] as [number, number];
          }
          return null;
        })
        .filter(Boolean) as [number, number][];

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [centros, map, triggerReset]);

  return null;
}

// ─── Main Component ─────────────────────────────────────────────

export default function MapView() {
  const { setCurrentView } = useAppStore();
  const { toast } = useToast();

  // Data
  const [centros, setCentros] = useState<CentroData[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterProvincia, setFilterProvincia] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // UI — only ONE sheet open at a time
  const [activeSheet, setActiveSheet] = useState<'filter' | 'list' | 'detail' | null>(null);
  const [detailCentro, setDetailCentro] = useState<CentroData | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'topo'>('street');
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

  // Derived booleans for sheets
  const filterSheetOpen = activeSheet === 'filter';
  const listSheetOpen = activeSheet === 'list';
  const detailOpen = activeSheet === 'detail';

  // ─── Sheet helpers (mutual exclusion) ─────────────────────────

  const openSheet = useCallback((sheet: 'filter' | 'list' | 'detail') => {
    setActiveSheet(sheet);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  // ─── Load Data ────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    import('leaflet').then(mod => { leafletModule = mod.default; });

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    async function loadData() {
      try {
        const [centrosRes, sectionsRes] = await Promise.all([
          fetch('/datos_centros_atw.json'),
          fetch('/sections_config.json'),
        ]);
        const centrosData = await centrosRes.json();
        const sectionsData = await sectionsRes.json();
        setCentros(centrosData.centros || []);
        setSections(sectionsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  // ─── Filtered centros ─────────────────────────────────────────

  const filteredCentros = useMemo(() => {
    let result = [...centros];

    if (searchText.trim()) {
      const terms = searchText.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(c => {
        const allValues: string[] = [c.nombre, c.codigo, c.provincia, c.prioridad, c.proyecto, c.tipo_centro]
          .filter(Boolean)
          .map(v => v.toLowerCase());
        return terms.every(term => allValues.some(v => v.includes(term)));
      });
    }

    if (filterProvincia !== 'all') result = result.filter(c => c.provincia === filterProvincia);
    if (filterPrioridad !== 'all') result = result.filter(c => c.prioridad === filterPrioridad);
    if (filterTipo !== 'all') result = result.filter(c => c.tipo_centro === filterTipo);

    return result;
  }, [centros, searchText, filterProvincia, filterPrioridad, filterTipo]);

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const byProvincia: Record<string, number> = {};
    const byPrioridad: Record<string, number> = {};
    const byTipo: Record<string, number> = {};
    filteredCentros.forEach(c => {
      byProvincia[c.provincia || 'N/A'] = (byProvincia[c.provincia || 'N/A'] || 0) + 1;
      byPrioridad[c.prioridad || 'N/A'] = (byPrioridad[c.prioridad || 'N/A'] || 0) + 1;
      byTipo[c.tipo_centro || 'N/A'] = (byTipo[c.tipo_centro || 'N/A'] || 0) + 1;
    });
    return { byProvincia, byPrioridad, byTipo, total: filteredCentros.length };
  }, [filteredCentros]);

  // ─── Filter options ───────────────────────────────────────────

  const provincias = useMemo(() => [...new Set(centros.map(c => c.provincia).filter(Boolean))].sort(), [centros]);
  const prioridades = useMemo(() => [...new Set(centros.map(c => c.prioridad).filter(Boolean))].sort(), [centros]);
  const tipos = useMemo(() => [...new Set(centros.map(c => c.tipo_centro).filter(Boolean))].sort(), [centros]);

  // ─── Active filters count ─────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterProvincia !== 'all') count++;
    if (filterPrioridad !== 'all') count++;
    if (filterTipo !== 'all') count++;
    if (searchText.trim()) count++;
    return count;
  }, [filterProvincia, filterPrioridad, filterTipo, searchText]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleMarkerClick = useCallback((centro: CentroData) => {
    setDetailCentro(centro);
    openSheet('detail');
  }, [openSheet]);

  const handleFlyToCentro = useCallback((centro: CentroData) => {
    const parts = centro.localizacion?.split(',').map(s => parseFloat(s.trim()));
    if (parts && parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setFlyTo([parts[0], parts[1]]);
      setTimeout(() => setFlyTo(null), 1500);
    }
    setDetailCentro(centro);
    openSheet('detail');
  }, [openSheet]);

  const clearFilters = useCallback(() => {
    setSearchText('');
    setFilterProvincia('all');
    setFilterPrioridad('all');
    setFilterTipo('all');
  }, []);

  // ─── Tile URL ─────────────────────────────────────────────────

  const tileUrl = useMemo(() => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [mapStyle]);

  const tileAttribution = useMemo(() => {
    switch (mapStyle) {
      case 'satellite':
        return '&copy; Esri';
      case 'topo':
        return '&copy; OpenTopoMap';
      default:
        return '&copy; OpenStreetMap';
    }
  }, [mapStyle]);

  // ─── Loading ──────────────────────────────────────────────────

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando mapa de centros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════
          MAP - Full screen, always visible
          ═══════════════════════════════════════════════════════════ */}
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url={tileUrl}
          attribution={tileAttribution}
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={(cluster: any) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 42 : count < 50 ? 52 : 62;
            const markers = cluster.getAllChildMarkers();
            let hasP1 = false;
            markers.forEach((m: any) => { if (m.options?.icon?.options?.html?.includes('#ef4444')) hasP1 = true; });

            const color1 = hasP1 ? '#ef4444' : '#6366f1';
            const color2 = hasP1 ? '#dc2626' : '#4f46e5';
            const fontSize = size < 45 ? 13 : 15;
            if (!leafletModule) return null;
            return leafletModule.divIcon({
              html: `
                <div style="position:relative;width:${size}px;height:${size}px;">
                  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
                    <defs>
                      <radialGradient id="cg${count}${hasP1?1:0}">
                        <stop offset="0%" stop-color="${color1}"/>
                        <stop offset="100%" stop-color="${color2}" stop-opacity="0.85"/>
                      </radialGradient>
                    </defs>
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" fill="url(#cg${count}${hasP1?1:0})" stroke="white" stroke-width="2.5"/>
                  </svg>
                  <span style="
                    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                    color:white;font-weight:800;font-size:${fontSize}px;
                    text-shadow:0 1px 2px rgba(0,0,0,0.3);line-height:1;
                    font-family:system-ui,-apple-system,sans-serif;
                  ">${count}</span>
                </div>
              `,
              className: 'custom-cluster',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            });
          }}
        >
          <MapMarkers centros={filteredCentros} onMarkerClick={handleMarkerClick} />
        </MarkerClusterGroup>

        <FlyToCenter center={flyTo} />
        <FitBounds centros={filteredCentros} triggerReset={fitBoundsTrigger} />
      </MapContainer>

      {/* ═══════════════════════════════════════════════════════════
          TOP OVERLAY - Back button + Search
          ═══════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 left-3 right-14 z-[1000] flex items-center gap-2">
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 flex-shrink-0 shadow-lg bg-background text-foreground hover:bg-muted border border-border rounded-xl"
          onClick={() => setCurrentView('ontower')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar centro..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-10 text-sm bg-background/95 backdrop-blur-sm border-border shadow-lg rounded-xl pr-10"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchText('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT OVERLAY - Map controls
          ═══════════════════════════════════════════════════════════ */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Filter button */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 shadow-lg bg-background text-foreground hover:bg-muted border border-border rounded-xl relative"
          onClick={() => openSheet('filter')}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Map style toggle */}
        <div className="flex flex-col bg-background rounded-xl border border-border shadow-lg overflow-hidden">
          <Button
            variant={mapStyle === 'street' ? 'default' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setMapStyle('street')}
          >
            <Map className="h-4 w-4" />
          </Button>
          <Separator />
          <Button
            variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setMapStyle('satellite')}
          >
            <Satellite className="h-4 w-4" />
          </Button>
          <Separator />
          <Button
            variant={mapStyle === 'topo' ? 'default' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setMapStyle('topo')}
          >
            <Mountain className="h-4 w-4" />
          </Button>
        </div>

        {/* Locate all button */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 shadow-lg bg-background text-foreground hover:bg-muted border border-border rounded-xl"
          onClick={() => setFitBoundsTrigger(prev => prev + 1)}
        >
          <LocateFixed className="h-5 w-5" />
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM OVERLAY - Centros count + List button
          ═══════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-3 right-3 z-[1000] flex items-end justify-between gap-2 pointer-events-none">
        {/* Left: Info + Legend */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">{filteredCentros.length}</span>
              <span className="text-xs text-muted-foreground">
                de {centros.length} centros
              </span>
            </div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {Object.entries(stats.byPrioridad).sort().map(([key, val]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORIDAD_CONFIG[key]?.color || '#888' }} />
                  <span className="text-[10px] text-muted-foreground">{key}: {val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              {Object.entries(stats.byTipo).sort().map(([key, val]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPO_CENTRO_COLORS[key] || '#888' }} />
                  <span className="text-[10px] text-muted-foreground">{key}: {val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active filters badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1 max-w-[250px]">
              {filterProvincia !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 pr-1 bg-background/95 backdrop-blur-sm shadow-sm">
                  {filterProvincia}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setFilterProvincia('all')} />
                </Badge>
              )}
              {filterPrioridad !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 pr-1 bg-background/95 backdrop-blur-sm shadow-sm">
                  {filterPrioridad}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setFilterPrioridad('all')} />
                </Badge>
              )}
              {filterTipo !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 pr-1 bg-background/95 backdrop-blur-sm shadow-sm">
                  {filterTipo}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setFilterTipo('all')} />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right: List button */}
        <div className="pointer-events-auto">
          <Button
            variant="default"
            className="h-11 shadow-lg bg-background text-foreground hover:bg-muted border border-border rounded-xl gap-2 px-4"
            onClick={() => openSheet('list')}
          >
            <List className="h-5 w-5" />
            <span className="font-semibold text-sm">Lista</span>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {filteredCentros.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FILTER SHEET - Slide-up filter panel
          ═══════════════════════════════════════════════════════════ */}
      <Sheet open={filterSheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filtros del Mapa
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-y-auto h-[calc(70vh-5rem)] pb-6 custom-scrollbar">
            {/* Provincia filter */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Provincia</label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={filterProvincia === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFilterProvincia('all')}
                >
                  Todas
                </Button>
                {provincias.map(p => (
                  <Button
                    key={p}
                    variant={filterProvincia === p ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setFilterProvincia(filterProvincia === p ? 'all' : p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prioridad filter */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Prioridad</label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={filterPrioridad === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFilterPrioridad('all')}
                >
                  Todas
                </Button>
                {prioridades.map(p => (
                  <Button
                    key={p}
                    variant={filterPrioridad === p ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs ${filterPrioridad === p ? PRIORIDAD_CONFIG[p]?.bg || '' : ''}`}
                    onClick={() => setFilterPrioridad(filterPrioridad === p ? 'all' : p)}
                  >
                    <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: PRIORIDAD_CONFIG[p]?.color || '#888' }} />
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tipo filter */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Tipo de Centro</label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={filterTipo === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setFilterTipo('all')}
                >
                  Todos
                </Button>
                {tipos.map(t => (
                  <Button
                    key={t}
                    variant={filterTipo === t ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setFilterTipo(filterTipo === t ? 'all' : t)}
                  >
                    <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: TIPO_CENTRO_COLORS[t] || '#888' }} />
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar todos los filtros ({activeFilterCount})
              </Button>
            )}

            <Separator />

            {/* Legend */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Leyenda</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRIORIDAD_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: cfg.color }} />
                    <div>
                      <p className="text-xs font-medium">{key}</p>
                      <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: TIPO_CENTRO_COLORS.INDOOR }} />
                  <div>
                    <p className="text-xs font-medium">Indoor</p>
                    <p className="text-[10px] text-muted-foreground">Interior</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <div className="w-4 h-4 rounded-md ring-2 ring-white dark:ring-gray-800" style={{ backgroundColor: TIPO_CENTRO_COLORS.OUTDOOR, transform: 'rotate(45deg)', width: 12, height: 12 }} />
                  <div>
                    <p className="text-xs font-medium">Outdoor</p>
                    <p className="text-[10px] text-muted-foreground">Exterior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════
          LIST SHEET - Slide-up centros list
          ═══════════════════════════════════════════════════════════ */}
      <Sheet open={listSheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              Centros en Vista
              <Badge variant="secondary" className="ml-1">{filteredCentros.length}</Badge>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(75vh-5rem)] mt-2">
            <div className="space-y-1 pb-6">
              {filteredCentros.map(centro => {
                const pConfig = PRIORIDAD_CONFIG[centro.prioridad];

                return (
                  <button
                    key={centro.codigo}
                    className="w-full text-left p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-150 cursor-pointer"
                    onClick={() => handleFlyToCentro(centro)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex-shrink-0 w-3.5 h-3.5 rounded-full mt-1 ring-2 ring-white dark:ring-gray-800"
                        style={{ backgroundColor: pConfig?.color || '#888' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{centro.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{centro.codigo}</span>
                          {centro.provincia && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />{centro.provincia}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[8px] h-4 px-1 ${pConfig?.bg || ''} ${pConfig?.border || ''}`}
                          >
                            {centro.prioridad}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[8px] h-4 px-1"
                            style={{
                              color: TIPO_CENTRO_COLORS[centro.tipo_centro],
                              borderColor: `${TIPO_CENTRO_COLORS[centro.tipo_centro]}40`,
                            }}
                          >
                            {centro.tipo_centro}
                          </Badge>
                        </div>
                      </div>
                      <Navigation className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                );
              })}
              {filteredCentros.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay centros con los filtros actuales</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════
          DETAIL SHEET - Centro details
          ═══════════════════════════════════════════════════════════ */}
      <Sheet open={detailOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {detailCentro?.nombre || 'Detalle'}
            </SheetTitle>
          </SheetHeader>
          {detailCentro && (
            <div className="mt-6 space-y-4">
              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Código</p>
                  <p className="font-semibold text-sm">{detailCentro.codigo}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Provincia</p>
                  <p className="font-semibold text-sm">{detailCentro.provincia}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Prioridad</p>
                  <Badge variant="outline" className={`${PRIORIDAD_CONFIG[detailCentro.prioridad]?.bg || ''} ${PRIORIDAD_CONFIG[detailCentro.prioridad]?.border || ''}`}>
                    {detailCentro.prioridad}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Tipo</p>
                  <Badge variant="outline" style={{ color: TIPO_CENTRO_COLORS[detailCentro.tipo_centro], borderColor: `${TIPO_CENTRO_COLORS[detailCentro.tipo_centro]}40` }}>
                    {detailCentro.tipo_centro}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Coordenadas</p>
                  <p className="font-mono text-xs">{detailCentro.localizacion}</p>
                </div>
              </div>

              <Separator />

              {/* Navigate button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const parts = detailCentro.localizacion?.split(',').map(s => s.trim());
                  if (parts && parts.length === 2) {
                    window.open(`https://www.google.com/maps?q=${parts[0]},${parts[1]}`, '_blank');
                  }
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Abrir en Google Maps
              </Button>

              <Separator />

              {/* Sections */}
              {sections.map(section => {
                const sectionData = detailCentro[section.key];
                if (!sectionData || typeof sectionData !== 'object') return null;
                const entries = Object.entries(sectionData as Record<string, string>).filter(([_, v]) => v);
                if (entries.length === 0) return null;

                return (
                  <Collapsible key={section.key} defaultOpen={section.key === 'general'}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-primary transition-colors border-b">
                      <span className="flex items-center gap-2 font-semibold text-sm">
                        {SECTION_ICONS[section.key] || <Database className="h-4 w-4" />}
                        {section.label}
                        <Badge variant="secondary" className="text-[10px]">{entries.length}</Badge>
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 gap-2 py-2">
                        {section.columns.map(col => {
                          const val = (sectionData as Record<string, string>)[col.key];
                          if (!val) return null;
                          return (
                            <div key={col.key} className="p-2 rounded bg-muted/30">
                              <p className="text-[10px] text-muted-foreground">{col.label}</p>
                              <p className="text-xs font-medium">{val}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
