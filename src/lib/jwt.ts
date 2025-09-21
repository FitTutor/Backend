import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JwtPayload{
    userId: string;
    email: string;
    type: 'access' | 'refresh';
}

export function generateAccessToken(payload: Omit<JwtPayload, 'type'>): string{
    return jwt.sign(
        {...payload, type: 'access'},
        JWT_SECRET,
        {expiresIn: JWT_ACCESS_EXPIRES_IN} as jwt.SignOptions
    );
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string{
    return jwt.sign(
        {...payload, type: 'refresh'},
        JWT_REFRESH_SECRET,
        {expiresIn: JWT_REFRESH_EXPIRES_IN} as jwt.SignOptions
    );
}

export function verifyAccessToken(token: string): JwtPayload{
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if(decoded.type !== 'access'){
        throw new Error('Invalid token type');
    }
    return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload{
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    if(decoded.type !== 'refresh'){
        throw new Error('Invalid token type');
    }
    return decoded;
}

