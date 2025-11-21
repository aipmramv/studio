import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../lib/response.js';
import { ValidationError } from '../lib/errors.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const result = await authService.login({ email, password });
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to login');
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Token invalidation would be handled by the client clearing the token
    return sendSuccess(res, { message: 'Logged out successfully' }, 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to logout');
  }
});

// GET /api/auth/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await authService.getUserById(req.user.id);
    return sendSuccess(res, user, 200);
  } catch (error: any) {
    if (error.statusCode && error.code) {
      return sendError(res, error.statusCode, error.code, error.message);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch profile');
  }
});

export default router;
