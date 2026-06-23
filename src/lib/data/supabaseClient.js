// src/lib/data/supabaseClient.js
//
// Solo lo sigue usando el login (ver TODO en UsuarioRepository.js — no
// funcional contra el esquema real todavía). Si esto lanzara al importarse,
// rompería toda la app (App.jsx importa LoginPage de forma estática, así que
// el módulo se evalúa sin importar si terminas en la vista desktop o mobile).
// Por eso solo se advierte en consola; quien intente loguearse real recibirá
// el error claro en UsuarioRepository.autenticar.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY — el login (no funcional, ver TODO) fallará si se usa.');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;