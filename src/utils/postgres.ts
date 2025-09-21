import { Pool, Client } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'post-db.local',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'soboco_task',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export { pool };

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

// Helper function to get a client from the pool
export async function getClient() {
  return await pool.connect();
}

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closePool() {
  await pool.end();
  console.log('🔌 PostgreSQL pool closed');
}
