/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public base URL of the telematics backend, e.g. https://sao-telematics.onrender.com
   * The client appends /api/v1. Leave unset in local dev to use the Vite proxy
   * (relative /api/v1). Also used as the Socket.IO origin.
   */
  readonly VITE_API_URL?: string;
  /** Map provider: 'leaflet' (default) | 'mapbox' | 'google'. */
  readonly VITE_MAP_PROVIDER?: 'leaflet' | 'mapbox' | 'google';
  /** Mapbox access token (required when VITE_MAP_PROVIDER=mapbox). */
  readonly VITE_MAPBOX_TOKEN?: string;
  /** Google Maps JavaScript API key (required when VITE_MAP_PROVIDER=google). */
  readonly VITE_GOOGLE_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
