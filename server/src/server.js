import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
let dbReady = false;

const connectWithRetry = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB(process.env.MONGO_URI);
    dbReady = true;
    console.log('Database status: connected');
  } catch (error) {
    dbReady = false;
    console.error('Database connection failed:', error.message);
    console.error('Retrying DB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

const startServer = async () => {
  app.set('dbReady', () => dbReady);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    connectWithRetry();
  });
};

startServer();
