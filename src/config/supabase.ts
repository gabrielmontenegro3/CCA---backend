import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Garante que as variáveis de ambiente estão carregadas
dotenv.config();

// Validação das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique se SUPABASE_URL e SUPABASE_ANON_KEY estão definidas no arquivo .env'
  );
}

// Cliente Supabase padrão (usando anon key - para operações do usuário)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase com service role (para operações administrativas)
// Use com cuidado, pois bypassa as políticas RLS (Row Level Security)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export default supabase;

