import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getConnection } from '../src/lib/db';

async function testDbConnection() {
  try {
    console.log('Attempting to connect to the database...');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    const pool = getConnection();
    await pool.query('SELECT 1');
    console.log('✅ Successfully connected to the database!');
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  } finally {
    // Ensure the process exits even if there are pending connections
    process.exit(0);
  }
}

testDbConnection();
