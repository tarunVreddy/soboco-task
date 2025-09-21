import { config } from '../config';

export function getDatabaseUrl(): string {
  // Use DATABASE_URL if it's provided
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Build from individual components
  const { host, port, name, user, password } = config.database;
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

export function isPostgreSQLConfigured(): boolean {
  return !!(config.database.host && config.database.user && config.database.password);
}