import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['test/emulators/**/*.test.ts'],
    maxWorkers: 1,
  },
})
