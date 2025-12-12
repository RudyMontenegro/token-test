import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const Login = () => {
  const [error, setError] = useState('')
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  // Si ya está autenticado, redirigir al home
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/home')
    }
  }, [isAuthenticated, loading, navigate])

  const handleMicrosoftLogin = async () => {
    try {
      setError('')
      await login()
      navigate('/home')
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error al iniciar sesión con Microsoft. Por favor, intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading-spinner">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Iniciar Sesión</h1>
          <p>Usa tu cuenta de Microsoft para continuar</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="button" 
          className="microsoft-login-button"
          onClick={handleMicrosoftLogin}
          disabled={loading}
        >
          <svg 
            width="21" 
            height="21" 
            viewBox="0 0 21 21" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="microsoft-icon"
          >
            <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
            <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
          </svg>
          <span>Continuar con Microsoft</span>
        </button>
        
        <div className="login-footer">
          <p className="help-text">
            Al hacer clic en "Continuar con Microsoft", serás redirigido a la página de inicio de sesión de Microsoft.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
