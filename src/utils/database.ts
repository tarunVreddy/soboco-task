import { config } from '../config';

export function getDatabaseUrl(): string {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('${SUPABASE_DB_PASSWORD}')) {
    return process.env.DATABASE_URL;
  }

  // If Supabase is configured, generate the connection string
  if (config.supabase.url && process.env.SUPABASE_DB_PASSWORD) {
    const projectId = getSupabaseProjectId();
    if (projectId) {
      return `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectId}.supabase.co:5432/postgres`;
    }
  }

  // Fallback to default
  return config.database.url;
}

export function getSupabaseProjectId(): string | null {
  const url = config.supabase.url;
  if (!url) return null;
  
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

export function isSupabaseConfigured(): boolean {
  return !!(config.supabase.url && config.supabase.serviceRoleKey && process.env.SUPABASE_DB_PASSWORD);
}
