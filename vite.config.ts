import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/tmdb': {
        changeOrigin: true,
        rewrite: (path) =>
          `/demo-cinescope/asia-east1/tmdbApi${path}`,
        target: 'http://127.0.0.1:5001',
      },
    },
  },
  test: {
    coverage: {
      include: [
        'src/features/library/data/library.ts',
        'src/features/discovery/data/archiveRecommendations.ts',
        'src/features/auth/data/auth.ts',
        'src/lib/tmdb/client.ts',
        'src/features/auth/components/RequireAuth.tsx',
        'src/features/library/components/LibraryControls.tsx',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
