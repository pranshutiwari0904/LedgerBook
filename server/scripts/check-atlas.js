import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI is missing in /Users/pranshutiwari/LedgerBook/server/.env');
  process.exit(1);
}

if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error('MONGO_URI must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

if (uri.includes('<username>') || uri.includes('<cluster-url>')) {
  console.error('MONGO_URI has placeholders. Replace with your real Atlas connection string.');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const dbName = mongoose.connection.name;
    console.log(`MongoDB connection successful. Database: ${dbName}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection failed.');
    console.error(`Reason: ${error.message}`);
    console.error('Check Atlas URI, DB user/password, and Network Access IP allowlist.');
    process.exit(1);
  }
};

run();
