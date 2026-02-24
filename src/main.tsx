import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from "@sentry/react"
import App from './App'
import './index.css'
import { ToastProvider } from './components/Toast'
import { ErrorFallback } from './components/ErrorFallback'
import { initSentry } from './sentry'

// Initialize Sentry
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const handleError = (error: Error, info: React.ErrorInfo) => {
  console.error("[ErrorBoundary]", error, info);
  Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
