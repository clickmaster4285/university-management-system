import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/constants.js';
import { handle } from '../utils/asyncHandler.js';

import { University, User } from '../models/index.js';
const buildUser = (user) => ({
  _id: user._id.toString(),
  name: `${user.firstName} ${user.lastName}`,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber || '',
  universityId: user.universityId || null,
});

export const login = handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: { $ne: true },
    status: 'Active',
  });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(200).json({ success: true, data: { user: buildUser(user), token } });
});

// Public registration is Student-only. Roles are never accepted from the client.
export const register = handle(async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, message: 'First name, last name, email, and password are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Link the student to the single university if one exists
  const university = await University.findOne({ isDeleted: { $ne: true } });

  const user = new User({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
    phoneNumber: phoneNumber || '',
    role: 'Student',
    universityId: university?._id || null,
    status: 'Active',
  });
  await user.save();

  const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(201).json({ success: true, data: { user: buildUser(user), token } });
});

export const logout = handle(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getProfile = handle(async (req, res) => {
  res.status(200).json({ success: true, data: buildUser(req.user) });
});

export const updateProfile = handle(async (req, res) => {
  const { firstName, lastName, name, phoneNumber } = req.body;

  const updates = {};
  if (name !== undefined) {
    const parts = name.trim().split(/\s+/);
    updates.firstName = parts[0] || '';
    updates.lastName = parts.slice(1).join(' ') || '';
  } else {
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
  }
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

  const updated = await User.findOneAndUpdate(
    { _id: req.user._id, isDeleted: { $ne: true } },
    updates,
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, data: buildUser(updated) });
});

export const changePassword = handle(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  }

  const user = await User.findOne({ _id: req.user._id, isDeleted: { $ne: true } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});