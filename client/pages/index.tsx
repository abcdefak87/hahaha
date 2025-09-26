import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    console.log('[Home] Auth state:', { user: !!user, loading, redirecting })
    
    // Auto redirect logic
    if (!loading && !redirecting) {
      setRedirecting(true)
      
      if (user) {
        // User is logged in, redirect to dashboard or last visited page
        const savedPath = localStorage.getItem('lastVisitedPath')
        console.log('[Home] User logged in, redirecting to:', savedPath || '/dashboard')
        
        if (savedPath && savedPath !== '/login' && savedPath !== '/' && savedPath !== '/register') {
          // Restore last visited page
          router.replace(savedPath).catch(err => {
            console.error('[Home] Redirect error:', err)
            window.location.href = savedPath
          })
        } else {
          // Default to dashboard
          router.replace('/dashboard').catch(err => {
            console.error('[Home] Redirect error:', err)
            window.location.href = '/dashboard'
          })
        }
      } else {
        // No user, redirect to login
        console.log('[Home] No user, redirecting to login')
        // Gunakan setTimeout untuk menghindari race condition
        setTimeout(() => {
          router.replace('/login').catch(err => {
            console.error('[Home] Redirect error:', err)
            window.location.href = '/login'
          })
        }, 100)
      }
    }
  }, [user, loading, router, redirecting])

  // Always show loading screen while checking auth
  // This prevents blank page on refresh
  return <LoadingScreen message={loading ? "Checking authentication..." : "Redirecting..."} />
}

