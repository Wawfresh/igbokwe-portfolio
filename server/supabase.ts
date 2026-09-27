import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : null;

if (pool) {
  pool.on('connect', () => {
    console.log('Successfully connected to Supabase PostgreSQL database.');
  });
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
}
