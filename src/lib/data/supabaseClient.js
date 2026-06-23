// src/lib/data/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Importamos las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validamos que existan las credenciales para evitar errores silenciosos
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las credenciales de Supabase en el archivo .env.local');
}

// Creamos y exportamos una única instancia del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);