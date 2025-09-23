import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedUser extends Omit<IUser, 'password'> {
  id: string;
}

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error: unknown) {
    const jwtError = error as jwt.JsonWebTokenError & { name: string };
    if (jwtError.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (jwtError.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is malformed'
      });
    } else if (jwtError.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  }
};

export { auth, AuthRequest };