/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public base URL of the backend API, e.g. https://nis2-api.onrender.com
   * The client appends /api/v1. Leave unset in local dev to use the Vite
   * proxy (relative /api/v1).
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
