import { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../db';
import { users, sessions, roleEnum } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: typeof roleEnum.enumValues[number];
  companyId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateUser: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const user = await validateToken(token);
    
    if (!user || !user.email || !user.role) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (allowedRoles: typeof roleEnum.enumValues[number][]) => {
  return ((req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  }) as RequestHandler;
};

async function validateToken(token: string) {
  try {
    const [session] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(
        eq(sessions.sid, token),
        eq(users.isActive, true),
        eq(users.isVerified, true)
      ));

    return session || null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}