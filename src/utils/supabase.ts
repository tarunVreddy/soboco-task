import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Create Supabase client for database operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

// Create Supabase client for client-side operations (with anon key)
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Helper function to get Supabase project ID from URL
export function getSupabaseProjectId(): string | null {
  const url = config.supabase.url;
  if (!url) return null;
  
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(config.supabase.url && config.supabase.serviceRoleKey);
}
