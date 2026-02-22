import mongoose from 'mongoose';

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in environment variables.');
  }

  if (mongoUri.includes('<username>') || mongoUri.includes('<cluster-url>')) {
    throw new Error('MONGO_URI still has placeholder values. Replace with your Atlas URI.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('MongoDB connected');
};

export default connectDB;
