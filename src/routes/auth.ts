
import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import { dmmfToRuntimeDataModel } from '@prisma/client/runtime/library';
import { error } from 'console';

const router = express.Router();

// Passport Google Strategy 설정
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_REDIRECT_URI!
}, async (accessToken, refreshToken, profile, done) => {
    try{
        const {id, displayName, emails, photos} = profile;
        const email = emails?.[0]?.value;

        if(!email){
            return done(new Error('No email found'), undefined);
        }

        // OAuthAccount 조회
        let oauthAccount = await prisma.oAuthAccount.findUnique({
            where:{
                unique_provider_account:{
                    provider: 'GOOGLE',
                    providerId: id
                }
            },
            include: {user: true}
        });

        if(oauthAccount){
            // 기존 사용자 로그인
            return done(null, oauthAccount.user);
        }

        // 이메일로 기존 사용자 찾기
        let user = await prisma.user.findUnique({
            where: {email}
        });

        if(!user){
            // 새 사용자 찾기
            user = await prisma.user.create({
                data: {
                    email,
                    nickname: displayName || email.split('@')[0],
                    displayName: displayName || null,
                    profileImage: photos?.[0]?.value || null,
                    emailVerified: true
                }
            });
        }

        // OAuthAccount 연결
        await prisma.oAuthAccount.create({
            data: {
                provider: 'GOOGLE',
                providerId: id,
                providerData: {
                    sub: id,
                    name: displayName,
                    email: email,
                    picture: photos?.[0]?.value,
                    email_verified: true
                },
                userId: user.id
            }
        });

        return done(null, user);
    }catch(error){
        return done(error, undefined);
    }
}));


// PassPort 직렬화 설정
passport.serializeUser((user: any, done) =>{
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try{
        const user = await prisma.user.findUnique({where: {id}});
        done(null, user);
    }catch(error){
        done(error, null);
    }
});

// Google OAuth 시작
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth 콜백
router.get('/google/callback', 
    passport.authenticate('google', {failureRedirect: '/login'}),
    async (req: any, res) => {
        try{
            const user = req.user;

            // JWT 토큰 생성
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email
            });

            const refreshToken = generateRefreshToken({
                userId: user.id,
                email: user.email
            });

            // lastloginAt 업데이트
            await prisma.user.update({
                where: {id: user.id},
                data: {lastLoginAt: new Date()}
            });

            // 쿠키에 토큰 설정
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000 // 15분
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
            });

            // 프론트엔드로 리다이렉트
            res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        }catch(error){
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    }
);

// 현재 사용자 정보 조회
router.get('/me', async (req, res) => {
    try{
        const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

        if(!token){
            return res.status(401).json({error: 'No token provided'});
        }

        const {verifyAccessToken} = await import('../lib/jwt');
        const payload = verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: {id: payload.userId},
            select: {
                id: true,
                email: true,
                nickname: true,
                displayName: true,
                profileImage: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true
            }
        });

        if(!user){
            return res.status(404).json({error: 'User not found'});
        }

        res.json({user});
    }catch(error){
        console.error('Get user error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// 토큰 갱신
router.post('/refresh', async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken){
            return res.status(401).json({error: "No refresh token provided"});
        }

        const {verifyAccessToken, generateAccessToken} = await import('../lib/jwt');
        const payload = verifyAccessToken(refreshToken);

        const user = await prisma.user.findUnique({
            where: {id: payload.userId}
        });

        if (!user) {
        return res.status(404).json({ error: 'User not found' });
        }

        // 새 액세스 토큰 생성
        const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email
        });

        res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15분
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

export default router;