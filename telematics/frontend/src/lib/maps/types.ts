// Interfaces communes à tous les fournisseurs de carte. Les pages manipulent
// uniquement ces types ; le composant <FleetMap> choisit l'implémentation
// (Leaflet / Mapbox / Google) selon VITE_MAP_PROVIDER.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  /** Couleur du marqueur (CSS). */
  color?: string;
  /** Cap en degrés (oriente l'icône si fourni). */
  heading?: number;
  /** Contenu HTML/texte de l'infobulle. */
  popup?: string;
}

export interface MapPolyline {
  id: string;
  points: LatLng[];
  color?: string;
}

export interface FleetMapProps {
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  center?: LatLng;
  zoom?: number;
  height?: string | number;
  className?: string;
  onMarkerClick?: (id: string) => void;
}

export type MapProvider = 'leaflet' | 'mapbox' | 'google';

/** Centre par défaut : Dakar. */
export const DEFAULT_CENTER: LatLng = { lat: 14.7167, lng: -17.4677 };
export const DEFAULT_ZOOM = 12;

export function resolveProvider(): MapProvider {
  const p = import.meta.env.VITE_MAP_PROVIDER;
  if (p === 'mapbox' && import.meta.env.VITE_MAPBOX_TOKEN) return 'mapbox';
  if (p === 'google' && import.meta.env.VITE_GOOGLE_MAPS_KEY) return 'google';
  return 'leaflet';
}
