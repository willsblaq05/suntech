/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute backend URL; leave unset for same-origin API routing. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
