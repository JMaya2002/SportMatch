// server/vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.js'],
    fileParallel: false,  // los tests comparten DB, mejor en serie
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    testTimeout: 20000,   // Neon puede tardar en arrancar conexiones frías
  },
})
