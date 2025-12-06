import { createClient } from '@supabase/supabase-js';

// Clave para guardar en el navegador (si el usuario quiere cambiar la BD manualmente)
const DB_CONFIG_KEY = 'sushiblack_db_config';

// --- FUNCIONES QUE FALTABAN (Para que Login.tsx no falle) ---

export const saveDbConfig = (url: string, key: string) => {
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify({ url, key }));
  // Recargar la página para aplicar cambios
  window.location.reload();
};

export const clearDbConfig = () => {
  localStorage.removeItem(DB_CONFIG_KEY);
  window.location.reload();
};

export const getDbConfig = () => {
  const stored = localStorage.getItem(DB_CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// --- INICIALIZACIÓN DEL CLIENTE ---

// 1. Intentamos leer configuración manual
const localConfig = getDbConfig();

// 2. Si no hay manual, usamos las variables de entorno de Vercel
const supabaseUrl = localConfig?.url || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = localConfig?.key || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan las credenciales de Supabase. Revisa las variables de entorno en Vercel.');
}

// Creamos el cliente (evitamos error si las strings están vacías para que compile)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
