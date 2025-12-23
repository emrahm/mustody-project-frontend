import { useState, useEffect, useCallback } from 'react'
import { authAPI } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  avatar_url?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    // Skip auth check on verify-email page with email parameter
    if (window.location.pathname === '/verify-email' && new URLSearchParams(window.location.search).get('email')) {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.me()
      setUser(response.data.user)
      setError(null)
    } catch (err: any) {
      setUser(null)
      setError(err)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      setUser(null)
      window.location.href = '/login'
    }
  }, [])

  const refresh = useCallback(() => {
    return fetchUser()
  }, [fetchUser])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    refresh,
  }
}
