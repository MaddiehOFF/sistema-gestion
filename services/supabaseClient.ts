import { createClient } from '@supabase/supabase-js';

// --- CLAVE PARA GUARDAR CONFIGURACIÓN ---
const DB_CONFIG_KEY = 'sushiblack_db_config';

// Flag para saber si estamos en el navegador (y evitar errores en build/SSR)
const isBrowser =
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// --- FUNCIONES NECESARIAS PARA EL LOGIN (¡NO BORRAR!) ---

export const saveDbConfig = (url: string, key: string) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify({ url, key }));
    window.location.reload();
  } catch (error) {
    console.error('Error guardando config de DB:', error);
  }
};

export const clearDbConfig = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(DB_CONFIG_KEY);
    window.location.reload();
  } catch (error) {
    console.error('Error limpiando config de DB:', error);
  }
};

export const getDbConfig = (): { url: string; key: string } | null => {
  if (!isBrowser) return null;

  const stored = localStorage.getItem(DB_CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parseando config de DB:', e);
    return null;
  }
};

// --- CONEXIÓN CON SUPABASE ---

const localConfig = getDbConfig();

// Usamos la configuración guardada o las variables de Vercel (.env)
const supabaseUrl = localConfig?.url || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  localConfig?.key || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL o ANON KEY no configuradas. Revisa tu archivo .env o la pantalla de login.'
  );
}

// Creamos el cliente de base de datos
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
