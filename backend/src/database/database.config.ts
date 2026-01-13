import { createPool, Pool, PoolOptions } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME || 'gameuser',
  password: process.env.DB_PASSWORD || 'gamepassword',
  database: process.env.DB_DATABASE || 'hypercasual_game',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool: Pool;

export const getDatabasePool = (): Pool => {
  if (!pool) {
    pool = createPool(poolConfig);
  }
  return pool;
};

export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
  }
};
