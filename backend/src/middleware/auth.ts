import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { RequestContext, JWTPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
      user?: JWTPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      status: 401,
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
      timestamp: new Date().toISOString(),
    });
  }

  authService
    .verifyToken(token)
    .then((user) => {
      req.user = user;
      req.context = {
        user,
        userId: user.id,
        userRole: user.role,
        department: user.department,
      };
      next();
    })
    .catch(() => {
      return res.status(401).json({
        success: false,
        status: 401,
        error: {
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
        },
        timestamp: new Date().toISOString(),
      });
    });
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.['auth-token'];
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}
