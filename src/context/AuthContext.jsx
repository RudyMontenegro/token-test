import { createContext, useContext, useState, useEffect } from 'react'
import { msalInstance, loginRequest } from '../config/msalConfig'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Verificar si hay una cuenta activa en MSAL
      const accounts = msalInstance.getAllAccounts()
      
      if (accounts.length > 0) {
        // Intentar obtener un token silenciosamente
        try {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          })
          
          // Usar idToken si está disponible, sino accessToken
          const token = response.idToken || response.accessToken
          if (response && token) {
            setToken(token)
            await validateTokenAndGetUser(token)
          }
        } catch (error) {
          console.error('Error al obtener token:', error)
          // Si falla, intentar login interactivo
          if (error.errorCode === 'interaction_required') {
            await login()
          } else {
            setLoading(false)
          }
        }
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error)
      setLoading(false)
    }
  }

  const validateTokenAndGetUser = async (accessToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
        localStorage.setItem('isAuthenticated', 'true')
      } else {
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem('isAuthenticated')
      }
    } catch (error) {
      console.error('Error al validar token:', error)
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem('isAuthenticated')
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    try {
      setLoading(true)
      
      // Iniciar el flujo de login de Microsoft
      const response = await msalInstance.loginPopup(loginRequest)
      
      // Usar idToken si está disponible, sino accessToken
      const token = response.idToken || response.accessToken
      if (response && token) {
        setToken(token)
        await validateTokenAndGetUser(token)
      }
    } catch (error) {
      console.error('Error en login:', error)
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        await msalInstance.logoutPopup({
          account: accounts[0],
        })
      }
      
      setIsAuthenticated(false)
      setUser(null)
      setToken(null)
      localStorage.removeItem('isAuthenticated')
    } catch (error) {
      console.error('Error en logout:', error)
    }
  }

  const getAccessToken = async () => {
    try {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        // Retornar idToken o accessToken
        return response.idToken || response.accessToken
      }
      return null
    } catch (error) {
      console.error('Error al obtener token:', error)
      return null
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user,
        loading,
        token,
        login, 
        logout,
        getAccessToken,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}
