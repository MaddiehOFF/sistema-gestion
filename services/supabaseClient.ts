import { createClient } from '@supabase/supabase-js';

// --- CLAVE PARA GUARDAR CONFIGURACIÓN ---
const DB_CONFIG_KEY = 'sushiblack_db_config';

// --- FUNCIONES NECESARIAS PARA EL LOGIN (¡NO BORRAR!) ---

export const saveDbConfig = (url: string, key: string) => {
  localStorage.setItem(DB_CONFIG_KEY, JSON.stringify({ url, key }));
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

// --- CONEXIÓN CON SUPABASE ---

const localConfig = getDbConfig();

// Usamos la configuración guardada o las variables de Vercel
const supabaseUrl = localConfig?.url || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = localConfig?.key || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Creamos el cliente de base de datos
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
