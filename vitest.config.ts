import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    pool: 'threads',
    fileParallelism: false,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'packages/game-core/src/**/*.ts',
        'packages/network-protocol/src/**/*.ts',
        'apps/game-server/src/{lobby,simulation,validation}/**/*.ts',
        'apps/client/src/game/multiplayer/**/*.ts',
        'apps/client/src/ui/**/*.{ts,tsx}',
        'apps/client/src/game/bridge.ts',
      ],
    },
  },
});
