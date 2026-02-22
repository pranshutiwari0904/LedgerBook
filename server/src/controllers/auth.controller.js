import asyncHandler from '../middleware/async.middleware.js';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  groupCode: user.groupCode
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, groupCode } = req.body;

  if (!name || !email || !password || !role || !groupCode) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be buyer or seller' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedGroupCode = groupCode.toUpperCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
    groupCode: normalizedGroupCode
  });

  const token = signToken({ userId: user._id });

  return res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signToken({ userId: user._id });

  return res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user)
  });
});
