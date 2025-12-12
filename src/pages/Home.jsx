import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const Home = () => {
  const { logout, user, loading } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <div>
          <h1>Bienvenido</h1>
          {user && (
            <p className="user-info">
              {user.name} ({user.email})
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>
      <div className="home-content">
        <div className="welcome-card">
          <h2>Has iniciado sesión exitosamente con Microsoft SSO</h2>
          {user && (
            <div className="user-details">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Nombre:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {user.lastLoginAt && (
                <p><strong>Último acceso:</strong> {new Date(user.lastLoginAt).toLocaleString()}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home

