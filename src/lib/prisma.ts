import { PrismaClient } from "@prisma/client"


const globalForPrsima = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrsima.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
    errorFormat: 'colorless',
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

if(process.env.NODE_ENV != 'production'){
    globalForPrsima.prisma = prisma
}

// 데이터베이스 연결 테스트 함수
export async function connectDatabase(): Promise<boolean>{
    try{
        await prisma.$connect()
        await prisma.$queryRaw `SELECT 1`
        console.log('Database connected successfully')
        return true
    }catch(error){
        console.log('Database connection failed: ', error)
        return false
    }
}

// 앱 종료 시 연결 해제
export async function disconnectDatabase(): Promise<void> {
    try{
        await prisma.$disconnect()
        console.log('Database disconnected')
    }catch(error){
        console.error('Error disconnecting from database', error)
    }
}

// 프로세스 종료 시 정리
let isDisconnecting = false;

// beforeExit 이벤트는 제거하고 시그널 핸들러만 유지
process.on('SIGINT', async () => {
    if (!isDisconnecting) {
        isDisconnecting = true;
        console.log('Received SIGINT, disconnecting from database...');
        await disconnectDatabase();
        process.exit(0);
    }
});

process.on('SIGTERM', async () => {
    if (!isDisconnecting) {
        isDisconnecting = true;
        console.log('Received SIGTERM, disconnecting from database...');
        await disconnectDatabase();
        process.exit(0);
    }
});

// uncaughtException과 unhandledRejection 처리
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    if (!isDisconnecting) {
        isDisconnecting = true;
        await disconnectDatabase();
    }
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (!isDisconnecting) {
        isDisconnecting = true;
        await disconnectDatabase();
    }
    process.exit(1);
});