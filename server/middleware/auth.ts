import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { userRoleEnum } from '../../shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: typeof userRoleEnum.enumValues[number];
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify and decode the token
    // This implementation will depend on your authentication method (JWT, session, etc.)
    const user = await validateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (allowedRoles: typeof userRoleEnum.enumValues[number][]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

async function validateToken(token: string) {
  try {
    // Implement token validation logic here
    // This will depend on your authentication method
    
    // Example using database sessions:
    const session = await prisma.sessions.findUnique({
      where: { sid: token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    return session?.user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}