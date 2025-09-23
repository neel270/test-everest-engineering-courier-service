import dotenv from 'dotenv';
import connectDB from '../config/database';

// Load environment variables
dotenv.config();

const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

    await connectDB();

    console.log('✅ Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
};

testDatabaseConnection();