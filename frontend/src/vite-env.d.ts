/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the backend API.
   * Leave unset in production to use the same-origin `/api` proxy (no CORS);
   * set to a full URL (e.g. https://nis2-api.onrender.com/api/v1) only when
   * the frontend calls the backend cross-origin without a proxy.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
