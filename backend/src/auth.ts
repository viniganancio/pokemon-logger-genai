import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './database';
import { User } from './types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO users (id, email, password, name, createdAt) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, name, createdAt],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign({ userId }, JWT_SECRET);
        res.json({ 
          token, 
          user: { id: userId, email, name } 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: User) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

export { router as authRoutes };