import vue from '@vitejs/plugin-vue';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const globals: Record<string, string> = {
  jquery: '$',
  lodash: '_',
  toastr: 'toastr',
};

const package_json = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')) as {
  version?: string;
};
const package_version = String(package_json.version ?? '1.0.0');

export default defineConfig(({ mode }) => ({
  define: {
    __NOVEL_ST_VERSION__: JSON.stringify(package_version),
  },

  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  build: {
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].chunk.js',
        assetFileNames: '[name].[ext]',
        globals,
      },
      external: (id) => id in globals,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'production' ? false : 'inline',
    minify: mode === 'production',
    target: 'esnext',
  },
}));
