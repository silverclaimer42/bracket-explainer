import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH is the public subpath. The Pages workflow sets
// /bracket-explainer/. Leave it unset for local dev at the site root.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const raw = env.VITE_BASE_PATH?.trim() || '/';
  const base = raw.endsWith('/') ? raw : `${raw}/`;

  return {
    base,
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
  };
});
