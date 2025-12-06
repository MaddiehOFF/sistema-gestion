import { createClient } from '@supabase/supabase-js';

// Usamos import.meta.env para Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env.local o la configuración de Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
