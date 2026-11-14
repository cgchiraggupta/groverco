import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  build: { rollupOptions: { input: {
    main: resolve(import.meta.dirname, 'index.html'),
    admin: resolve(import.meta.dirname, 'admin/index.html'),
    privacy: resolve(import.meta.dirname, 'privacy.html'),
    resources: resolve(import.meta.dirname, 'resources/index.html'),
    businessReadiness: resolve(import.meta.dirname, 'resources/business-readiness.html'),
    creatorReadiness: resolve(import.meta.dirname, 'resources/creator-readiness.html')
  } } }
});
