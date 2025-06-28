import { db } from '../src/db/config';
import { sql } from 'drizzle-orm';

export async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Disable foreign key checks temporarily
    await db.execute(sql`SET session_replication_role = 'replica';`);
    
    // Get all table names from the current schema
    const result = await db.execute(
      sql`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `
    );

    const tables = result.rows.map((row: any) => row.tablename);
    
    if (tables.length === 0) {
      console.log('No tables found in the database.');
      return;
    }

    console.log(`Found ${tables.length} tables to drop.`);
    
    // Drop all tables
    for (const table of tables) {
      try {
        console.log(`Dropping table: ${table}`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
      } catch (error) {
        console.error(`Error dropping table ${table}:`, error);
      }
    }
    
    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin';`);
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  } finally {
    // Close the database connection
    await db.execute(sql`SET session_replication_role = 'origin';`);
    process.exit(0);
  }
}

