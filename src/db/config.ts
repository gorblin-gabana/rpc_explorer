import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config as appConfig } from '../config';
import * as schema from './schema';

// Type assertion for config to include database properties
const config = {
  ...appConfig,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/gor_indexer',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create the drizzle instance with schema types
export const db = drizzle(pool, { schema });

export const closeConnection = async () => {
  await pool.end();
};

export type Database = typeof db;
