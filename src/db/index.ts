import { supabase } from '../utils/supabase';
import { DatabaseService } from '../services/database/DatabaseService';

export const databaseService = new DatabaseService();

export async function connectDatabase() {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Database connected successfully');
    await databaseService.initializeDatabase();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Make sure your Supabase tables are created. Check SUPABASE_SETUP.md for instructions.');
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  console.log('🔌 Database disconnected');
}
