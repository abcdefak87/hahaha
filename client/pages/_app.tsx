import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../contexts/AuthContext'
import { RealtimeProvider } from '../contexts/RealtimeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { suppressRouterErrors } from '../lib/routerErrorSuppression'
import { preloadCriticalComponents } from '../lib/dynamicComponents'
import { useState, useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  }))

  // Global error suppressor for Next.js router errors
  useEffect(() => {
    suppressRouterErrors()
  }, [])

  // Preload critical components for better performance
  useEffect(() => {
    preloadCriticalComponents()
  }, [])

  // Handle redirect logic for refresh scenarios
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Save current path to localStorage (except for auth pages)
      if (url !== '/login' && url !== '/' && url !== '/register' && url !== '/forgot-password') {
        localStorage.setItem('lastVisitedPath', url)
      }
    }
    
    // Save initial path
    const currentPath = window.location.pathname
    if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register' && currentPath !== '/forgot-password') {
      localStorage.setItem('lastVisitedPath', currentPath)
    }
    
    // Listen to route changes
    const { events } = require('next/router').default
    events.on('routeChangeComplete', handleRouteChange)
    
    return () => {
      events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <Component {...pageProps} />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
