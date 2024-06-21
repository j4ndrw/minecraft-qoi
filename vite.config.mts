import { defineConfig } from 'vite';
import path from 'node:path';
import babel from 'vite-plugin-babel';

export default defineConfig({
  plugins: [babel()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'index',
      formats: ['cjs'],
      fileName: `index.js`,
    },
  },
});
