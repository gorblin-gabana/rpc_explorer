import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  HTTPS_RPC: process.env.HTTPS_RPC || 'https://rpc.Gorbchain.com',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/Gorbchain_indexer',
  
  // Cache TTL in milliseconds (default: 5 minutes)
  CACHE_TTL_MS: parseInt(process.env.CACHE_TTL_MS || '300000', 10),
  
  // Batch sizes for fetching data
  BATCH_SIZE: {
    TOKEN_HOLDERS: parseInt(process.env.BATCH_SIZE_TOKEN_HOLDERS || '100', 10),
    ACCOUNTS: parseInt(process.env.BATCH_SIZE_ACCOUNTS || '50', 10),
    TRANSACTIONS: parseInt(process.env.BATCH_SIZE_TRANSACTIONS || '50', 10),
  },
};

export type Config = typeof config;
