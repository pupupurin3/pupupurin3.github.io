/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the portfolio API, e.g. https://portfolio-api.example.workers.dev. Unset: API features hide. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
