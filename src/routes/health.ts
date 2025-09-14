import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/health', async (req, res) => {
  const startTime = Date.now()
  
  try {
    // 데이터베이스 연결 및 쿼리 테스트
    await prisma.$queryRaw`SELECT 1 as health_check`
    
    // 기본 통계 조회
    const [userCount, subjectCount, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.subject.count(),
      prisma.studySession.count()
    ])
    
    const responseTime = Date.now() - startTime
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        statistics: {
          users: userCount,
          subjects: subjectCount,
          sessions: sessionCount
        }
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error('Health check failed:', error)
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown database error'
      },
      environment: process.env.NODE_ENV || 'development'
    })
  }
})

// 데이터베이스 전용 헬스체크
router.get('/health/db', async (req, res) => {
  try {
    const startTime = Date.now()
    
    const [healthCheck, sampleUsers] = await Promise.all([
      prisma.$queryRaw`SELECT version() as version, now() as current_time`,
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nickname: true,
          _count: {
            select: {
              subjects: true,
              studySessions: true,
              studyPlans: true
            }
          }
        },
        take: 3
      })
    ])
    
    const responseTime = Date.now() - startTime
    
    res.json({
      status: 'healthy',
      database: {
        connected: true,
        responseTime: `${responseTime}ms`,
        info: healthCheck,
        sampleUsers
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Database connection failed'
      }
    })
  }
})

export default router
