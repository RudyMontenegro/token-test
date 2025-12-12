# Proyecto con Microsoft SSO

Proyecto React + .NET con autenticación Microsoft SSO (Single Sign-On) que incluye:
- Autenticación con Microsoft Azure AD
- Backend .NET 8.0 con Entity Framework Core
- Base de datos MySQL
- Frontend React con MSAL (Microsoft Authentication Library)

## Características

- ✅ Login con Microsoft SSO
- ✅ Integración con Azure AD
- ✅ Base de datos MySQL para almacenar usuarios
- ✅ Protección de rutas privadas
- ✅ Persistencia de sesión
- ✅ Diseño moderno y responsive

## Requisitos Previos

1. **MySQL** instalado y ejecutándose en `127.0.0.1:3306`
   - Usuario: `root`
   - Contraseña: `root`
   - Base de datos: `tms_db` (se creará automáticamente)

2. **.NET 8.0 SDK** instalado

3. **Node.js** y **npm** instalados

## Configuración de la Base de Datos

La base de datos se creará automáticamente al iniciar el backend. Asegúrate de que MySQL esté ejecutándose con la siguiente configuración:

```
Server: 127.0.0.1
Port: 3306
User: root
Password: root
Database: tms_db (se crea automáticamente)
```

## Instalación

### Backend

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Restaura los paquetes NuGet:
```bash
dotnet restore
```

3. La base de datos se creará automáticamente al ejecutar la aplicación.

### Frontend

1. Instala las dependencias:
```bash
npm install
```

## Ejecutar el proyecto

### Backend

Desde la carpeta `backend`:
```bash
dotnet run
```

El backend estará disponible en `http://localhost:5000` (o el puerto configurado en `launchSettings.json`)

### Frontend

Desde la raíz del proyecto:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## Estructura del proyecto

```
├── backend/
│   ├── Data/
│   │   └── ApplicationDbContext.cs    # Contexto de Entity Framework
│   ├── Models/
│   │   └── User.cs                    # Modelo de Usuario
│   ├── Program.cs                     # Configuración del backend
│   ├── appsettings.json               # Configuración (producción)
│   └── appsettings.Development.json  # Configuración (desarrollo)
├── src/
│   ├── config/
│   │   └── msalConfig.js              # Configuración de MSAL
│   ├── context/
│   │   └── AuthContext.jsx            # Contexto de autenticación
│   ├── pages/
│   │   ├── Login.jsx                  # Componente de login con Microsoft
│   │   ├── Login.css
│   │   ├── Home.jsx                   # Componente home
│   │   └── Home.css
│   ├── App.jsx                        # Componente principal con routing
│   └── main.jsx                       # Punto de entrada
└── package.json
```

## Configuración de Azure AD

La aplicación ya está configurada con:
- **TenantId**: `8f137cf4-3c51-4772-9858-75e8fbd0ae28`
- **ClientId**: `158c554f-3aba-4200-893d-32af2df35abd`

**Nota**: Asegúrate de que en Azure Portal:
1. La aplicación esté registrada como "Single-page application (SPA)"
2. Las URLs de redirección incluyan `http://localhost:5173`
3. Los permisos API incluyan `User.Read`, `openid`, `profile`, `email`

## Endpoints del Backend

- `GET /api/me` - Obtiene información del usuario autenticado (requiere autenticación)
- `POST /api/auth/validate` - Valida el token del usuario (requiere autenticación)
- `GET /api/protected` - Endpoint de ejemplo protegido (requiere autenticación)
- `GET /weatherforecast` - Endpoint público de ejemplo

## Flujo de Autenticación

1. El usuario hace clic en "Continuar con Microsoft" en el frontend
2. Se abre una ventana emergente de Microsoft para autenticación
3. El usuario se autentica con su cuenta de Microsoft
4. Microsoft devuelve un token JWT al frontend
5. El frontend envía el token al backend en el header `Authorization: Bearer {token}`
6. El backend valida el token con Azure AD
7. El backend busca o crea el usuario en la base de datos MySQL
8. El usuario puede acceder a las rutas protegidas

## Notas

- La sesión se guarda en `sessionStorage` del navegador
- Los tokens se renuevan automáticamente cuando es necesario
- La base de datos se crea automáticamente con la tabla `Users` al iniciar el backend
- El backend usa CORS para permitir peticiones desde el frontend
