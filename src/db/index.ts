import { testConnection } from '../utils/postgres';
import { DatabaseService } from '../services/database/DatabaseService';

export const databaseService = new DatabaseService();

export async function connectDatabase() {
  try {
    // Test the PostgreSQL connection
    await testConnection();
    console.log('✅ Database connected successfully');
    await databaseService.initializeDatabase();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Make sure your PostgreSQL database is running on post-db.local and the database "soboco_task" exists.');
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  console.log('🔌 Database disconnected');
}
