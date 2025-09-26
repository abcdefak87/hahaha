import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Auto redirect logic
    if (!loading) {
      if (user) {
        // User is logged in, redirect to dashboard or last visited page
        const savedPath = localStorage.getItem('lastVisitedPath')
        
        if (savedPath && savedPath !== '/login' && savedPath !== '/' && savedPath !== '/register') {
          // Restore last visited page
          router.replace(savedPath)
        } else {
          // Default to dashboard
          router.replace('/dashboard')
        }
      } else {
        // No user, redirect to login
        router.replace('/login')
      }
    }
  }, [user, loading, router])

  // Always show loading screen while checking auth
  // This prevents blank page on refresh
  return <LoadingScreen message={loading ? "Checking authentication..." : "Redirecting..."} />
}

