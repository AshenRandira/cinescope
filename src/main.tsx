import '@fontsource-variable/manrope/wght.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/App'
import { queryClient } from './app/queryClient'
import './styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Unable to find the root application element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)