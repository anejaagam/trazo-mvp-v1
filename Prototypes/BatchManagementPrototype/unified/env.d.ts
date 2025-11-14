/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DOMAIN_TYPE?: 'cannabis' | 'produce';
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
