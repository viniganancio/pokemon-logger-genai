import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest, User } from './types';
import { db } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user: User) => {
      if (err || !user) {
        return res.status(403).json({ error: 'User not found' });
      }
      req.user = user;
      next();
    });
  });
};