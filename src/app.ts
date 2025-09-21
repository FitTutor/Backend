import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';

// 환경변수 로드
dotenv.config();

// 데이터베이스 연결
import { connectDatabase } from './lib/prisma';

// 라우터 import
import healthRouter from './routes/health';
import authRouter from './routes/auth';

const app = express()

// 미들웨어 설정
app.use(helmet());
app.use(cookieParser()); // 쿠키 파서 추가

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
}));

app.use(passport.initialize()); // Passport 초기화
app.use(passport.session()); // Passport 세션 지원
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'))
app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({extended: true}))

// 라우터 연결
app.use('/', healthRouter)
app.use('/api/auth', authRouter)

// 기본 라우트들
app.get('/', (req, res) => {
  res.json({
    message: 'FitTutor API 서버',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      dashboard: '/dashboard'
    }
  });
});

app.get('/dashboard', (req, res) => {
  res.json({
    message: 'Dashboard - OAuth 인증 성공!',
    timestamp: new Date().toISOString()
  });
});

// 404 핸들러 
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// 전역 예외 핸들러
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 3000;

// 서버 시작
async function startServer() {
  try {
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`DB Health: http://localhost:${PORT}/health/db`);
      console.log(`Adminer: http://localhost:8080`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

export default app;
