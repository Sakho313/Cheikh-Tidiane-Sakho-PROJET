/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_MAP_PROVIDER?: 'leaflet' | 'mapbox' | 'google';
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
