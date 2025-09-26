import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from '../components/LoadingScreen'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[Home] Auth state:', { user: !!user, loading })
    
    // Jika masih loading, tunggu
    if (loading) {
      return
    }
    
    // Redirect berdasarkan status auth
    if (user) {
      // User sudah login, redirect ke dashboard
      const savedPath = localStorage.getItem('lastVisitedPath')
      console.log('[Home] User logged in, redirecting to:', savedPath || '/dashboard')
      
      if (savedPath && savedPath !== '/login' && savedPath !== '/' && savedPath !== '/register') {
        // Gunakan window.location untuk redirect yang lebih reliable
        window.location.href = savedPath
      } else {
        window.location.href = '/dashboard'
      }
    } else {
      // User belum login, redirect ke login
      console.log('[Home] No user, redirecting to login')
      window.location.href = '/login'
    }
  }, [user, loading])

  // Tampilkan loading screen
  return <LoadingScreen message={loading ? "Memeriksa autentikasi..." : "Mengalihkan..."} />
}

