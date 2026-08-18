import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

export const seedDefaultAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await User.findOne({ email: 'admin@scholaros.edu' });
    if (existingAdmin) {
      console.log('✅ Default admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('demo1234', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@scholaros.edu',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    console.log('✅ Default admin user seeded: admin@scholaros.edu / demo1234');
  } catch (error) {
    console.error('❌ Failed to seed default admin:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  seedDefaultAdmin().then(() => process.exit(0)).catch(() => process.exit(1));
}
