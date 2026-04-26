import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
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
