import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export function errorHandler(
    error: Error | ZodError,
    req: Request,
    res: Response,
    next: NextFunction
){
    console.error('API Error', {
        message: error.message,
        url: req.url,
        method: req.method,
        userId: (req as any).user?.userId
    })

    // Zod 검증 오류
    if(error instanceof ZodError){
        return res.status(400).json({
            error: 'Validation Error',
            message: '입력 데이터가 올바르지 않습니다',
            details: (error as ZodError).issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        })
    }

    // 비즈니스 로직 오류
    if(error.message === 'SUBJECT_NOT_FOUND'){
        return res.status(404).json({
            error: 'Subject Not Found',
            message: '요청한 과목을 찾을 수 없습니다'
        })
    }

    if(error.message === 'SUBJECT_NAME_DUPLICATE'){
        return res.status(409).json({
            error: 'Duplicate Subject Name',
            message: '이미 같은 이름의 과목이 존재합니다'
        })
    }

    // 기본 서버 오류
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development'
            ? error.message
            : '서버 내부 오류가 발생했습니다'
    })
}