import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';


// 환경변수 로드
dotenv.config();

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('combined()'));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Study Planner API Server is running!',
        timestamp: new Date().toISOString(),
    });
});

// 기본 라우트
app.get('/api', (req, res) => {
    res.json({
        message: "Welcome to Study Planner API",
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            schedules: '/api/schedules',
        },
    });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

export default app;