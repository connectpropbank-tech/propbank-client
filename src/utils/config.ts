
// Use the Railway production server URL provided by the user
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://propbank-server-production.up.railway.app').replace(/\/$/, '');

// This will use: https://propbank-server-production.up.railway.app
// Falls back to localhost only if you manually change it back below
// export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002').trim();
