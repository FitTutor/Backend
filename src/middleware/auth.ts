import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";


export interface AuthenticatedRequest extends Request{
    user?: {
        userId: string,
        email: string
    };
}

export const authenticateToken = async(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
        return res.status(401).json({ error: 'No token provided' });
        }

        const payload = verifyAccessToken(token);
        req.user = {
        userId: payload.userId,
        email: payload.email
        };

        next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}