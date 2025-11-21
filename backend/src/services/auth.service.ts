import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { getDatabase } from '../lib/database.js';
import { config } from '../lib/config.js';
import { UnauthorizedError, NotFoundError } from '../lib/errors.js';
import { JWTPayload, AuthUser, LoginCredentials } from '../types/index.js';

const JWT_SECRET = new TextEncoder().encode(config.jwtSecret);

export class AuthService {
  async login(credentials: LoginCredentials): Promise<{ token: string; user: AuthUser }> {
    const db = getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: credentials.email });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const passwordMatch = await compare(credentials.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const token = await this.generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(config.jwtExpiry)
      .sign(JWT_SECRET);

    return token;
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as 'admin' | 'spoc' | 'user',
        department: payload.department as string | undefined,
        iat: payload.iat || Math.floor(Date.now() / 1000),
        exp: payload.exp || Math.floor(Date.now() / 1000) + 86400,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  async getUserById(userId: string) {
    const db = getDatabase();
    const usersCollection = db.collection('users');
    const { ObjectId } = await import('mongodb');

    let query: any = {};
    try {
      query._id = new ObjectId(userId);
    } catch {
      query._id = userId;
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
