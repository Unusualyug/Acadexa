import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { autoIndex: !env.isProd });
  console.log('[db] MongoDB connected:', mongoose.connection.name);
  return mongoose.connection;
}
