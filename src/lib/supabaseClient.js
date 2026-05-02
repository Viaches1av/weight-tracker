// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Проверка наличия переменных окружения
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Отсутствуют переменные окружения. Создайте файл .env с REACT_APP_SUPABASE_URL и REACT_APP_SUPABASE_ANON_KEY',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
