import { PublicClientApplication } from '@azure/msal-browser';

// Configuración de MSAL
export const msalConfig = {
  auth: {
    clientId: '158c554f-3aba-4200-893d-32af2df35abd', // ClientId de Azure AD
    authority: 'https://login.microsoftonline.com/8f137cf4-3c51-4772-9858-75e8fbd0ae28', // TenantId
    redirectUri: window.location.origin, // URL de redirección después del login
  },
  cache: {
    cacheLocation: 'sessionStorage', // Guarda el token en sessionStorage
    storeAuthStateInCookie: false, // No usar cookies
  },
};

// Scopes que se solicitan al usuario
// Para una API backend, necesitamos el scope de la API o usar openid para obtener un token de ID
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

// Crear instancia de MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Inicializar MSAL
msalInstance.initialize().then(() => {
  // Manejar redirecciones después del login
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      // El usuario se autenticó correctamente
      console.log('Usuario autenticado:', response);
    }
  });
});



