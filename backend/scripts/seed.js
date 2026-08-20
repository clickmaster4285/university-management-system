import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

export const seedDefaultAdmin = async () => {
  try {
    const firstName = process.env.ADMIN_FIRST_NAME;
    const lastName = process.env.ADMIN_LAST_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!firstName || !lastName || !email || !password) {
      throw new Error('ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured');
    }

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
    });

    console.log(`✅ Admin user seeded: ${email}`);
  } catch (error) {
    console.error('❌ Failed to seed default admin:', error);
    throw error;
  }
};
