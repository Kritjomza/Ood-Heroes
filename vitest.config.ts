import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'packages/game-core/src/**/*.ts',
        'apps/client/src/ui/**/*.{ts,tsx}',
        'apps/client/src/game/bridge.ts',
      ],
    },
  },
});
