// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

// These values should be set in your Vite environment variables (.env or .env.production)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);