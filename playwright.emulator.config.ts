import { defineConfig } from '@playwright/test'

import baseConfig from './playwright.config.js'

export default defineConfig(baseConfig, {
  outputDir: 'test-results/emulator',
  testDir: './e2e/emulator',
  testIgnore: [],
})
