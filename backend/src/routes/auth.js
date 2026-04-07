const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // Create profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      full_name,
      phone: phone || null,
      role: 'user',
    });

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    const token = signToken(userId);
    res.status(201).json({ token, user: { id: userId, email, full_name, role: 'user' } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('id', data.user.id)
      .single();

    const token = signToken(data.user.id);
    res.json({
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name,
        role: profile?.role || 'user',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req, res) => {
  const { full_name, phone } = req.body;
  const updates = {};
  if (full_name) updates.full_name = full_name;
  if (phone) updates.phone = phone;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
