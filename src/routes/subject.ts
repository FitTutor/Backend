import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { createSubjectSchema, subjectParamsSchema, subjectQuerySchema, updateSubjectSchema } from "../schemas/subject.schema";
import { SubjectService } from "../services/subject.service";

const router = Router()

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken as any)

// 과목 목록 조회(GET/subjects)
router.get('/subjects', async(req, res, next) => {
    try{
        const query = subjectQuerySchema.parse(req.query)
        const result = await SubjectService.getSubjectsByUserId((req as any).user!.userId, query)
        
        res.json({
            success: true,
            data: result.subjects,
            pagination: result.pagination
        })
    } catch(error){
        next(error)
    }
})

// 과목 생성(POST/subjects)
router.post('/subjects', async (req, res, next) => {
    try{
        const data = createSubjectSchema.parse(req.body)
        const subject = await SubjectService.createSubject((req as any).user!.userId, data)

        res.status(201).json({
            success: true,
            message: '과목이 성공적으로 생성되었습니다',
            data: subject
        })
    }catch(error){
        next(error)
    }
})

// 특정 과목 조회(GET/subjects/:id)
router.get('/subjects/:id', async(req, res, next) => {
    try{
        const {id} = subjectParamsSchema.parse(req.params)
        const subject = await SubjectService.getSubjectById(id, (req as any).user!.userId)

        res.json({
            success: true,
            data: subject
        })
    }catch(error){
        next(error)
    }
})

// 과목 수정(PATCH/subjects/:id)
router.patch('/subjects/:id', async (req, res, next) => {
    try{
        const {id} = subjectParamsSchema.parse(req.params)
        const data = updateSubjectSchema.parse(req.body)

        if(Object.keys(data).length === 0){
            return res.status(400).json({
                error: 'Validation Error',
                message: '수정할 데이터를 입력해주세요'
            })
        }

        const subject = await SubjectService.updateSubject(id, (req as any).user!.userId, data)

        res.json({
            success: true,
            message: '과목이 성공적으로 수정되었습니다',
            data: subject
        })
    }catch(error){
        next(error)
    }
})

// 과목 삭제(DELETE/subjects/:id)
router.delete('/subjects/:id', async (req, res, next) => {
    try{
        const {id} =  subjectParamsSchema.parse(req.params)
        const result = await SubjectService.deleteSubject(id, (req as any).user!.userId)

        let message = "과목이 성공적으로 삭제되었습니다"
        if(result.deletedRelatedData.studySessions > 0 || result.deletedRelatedData.planTasks > 0){
            message += `(관련 학습 세션 ${result.deletedRelatedData.studySessions}개, 계획 과업 ${result.deletedRelatedData.planTasks}개도 함께 삭제되었습니다)`
        }

        res.json({
            success: true,
            message,
            delta: result
        })
    }catch(error){
        next(error)
    }
})

export default router
