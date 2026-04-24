
// Use the Railway production server URL provided by the user
const getApiBaseUrl = () => {
  let url = (import.meta.env.VITE_API_BASE_URL || 'https://propbank-server-production.up.railway.app').trim();
  
  // If the URL doesn't start with http:// or https://, prepend https://
  // This prevents the browser from treating it as a relative path
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  return url.replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

// This will use: https://propbank-server-production.up.railway.app
// Falls back to localhost only if you manually change it back below
// export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002').trim();
