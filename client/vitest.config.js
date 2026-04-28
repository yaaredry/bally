import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // MapLibre GL requires WebGL which is not available in happy-dom.
    // Mock the library so components that import it can still be unit-tested.
    alias: {
      'react-map-gl/maplibre': new URL('./src/test/__mocks__/react-map-gl.jsx', import.meta.url).pathname,
      'maplibre-gl/dist/maplibre-gl.css': new URL('./src/test/__mocks__/empty.js', import.meta.url).pathname,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/lib/**/*.{js,jsx}',
        'src/components/SkillBadge.jsx',
        'src/pages/Login.jsx',
        'src/context/AuthContext.jsx',
      ],
      exclude: ['src/test/**', 'src/lib/avatars.js'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
