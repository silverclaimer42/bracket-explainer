import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Subpath hosting (GitHub Pages and similar) needs the owner's OK and is not
// set up here. VITE_BASE_PATH only makes `base` configurable when that happens.
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
