import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config()

// 데이터베이스 연결 테스트 
import { connectDatabase } from './lib/prisma'

// 라우터 import
import healthRouter from './routes/health'

const app = express()

// 미들웨어 설정
app.use(helmet());
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

// 404 핸들러 
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    })
})

// 전역 예외 핸들러
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error)
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    })
})

const PORT = process.env.PORT || 3000

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결 확인
    const dbConnected = await connectDatabase()
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...')
      process.exit(1)
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
      console.log(`DB Health: http://localhost:${PORT}/health/db`)
      console.log(`Adminer: http://localhost:8080`)
    })
  } catch (error) {
    console.error('Server startup failed:', error)
    process.exit(1)
  }
}

startServer()

export default app
