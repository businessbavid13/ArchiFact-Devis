interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly VITE_AUTH_REDIRECT_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
