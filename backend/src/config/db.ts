import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:xaSPYQPLysXv2rbo@db.ngfgwgwofnuwqrbmvtuo.supabase.co:5432/postgres';

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
