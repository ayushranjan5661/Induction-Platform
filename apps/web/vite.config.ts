import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * One code base, two web apps:
 * - staff (default):          `vite`                  -> http://localhost:5173
 * - candidate (`--mode candidate`): `vite --mode candidate` -> http://localhost:5174
 * The mode decides which pages exist (see src/lib/portal.ts).
 */
export default defineConfig(({ mode }) => {
  const candidate = mode === 'candidate';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Consume the shared package from source so the web app needs no prebuild.
        '@induction/shared': fileURLToPath(
          new URL('../../packages/shared/src/index.ts', import.meta.url),
        ),
      },
    },
    build: { outDir: candidate ? 'dist-candidate' : 'dist' },
    server: {
      port: candidate ? 5174 : 5173,
      strictPort: true,
      proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
    },
    preview: { port: candidate ? 4174 : 4173 },
  };
});
