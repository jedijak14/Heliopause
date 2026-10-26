import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  plugins: [viteSingleFile()],
  server: {host: '0.0.0.0', allowedHosts: ['.e2b.app'], fs: { allow: ['..'] }},
  build: {outDir: 'build', target: 'es2022', assetsInlineLimit: 12000000, chunkSizeWarningLimit: 2000},
});
