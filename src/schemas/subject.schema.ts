import z from "zod"


const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u

export const createSubjectSchema = z.object({
    name: z.string()
        .min(1, '과목명은 필수입니다')
        .max(100, '과목명은 100자 이하여야 합니다')
        .trim(),

    color: z.string()
        .regex(hexColorRegex, '올바른 색상 코드를 입력해주세요')
        .default('#3B82F6'),
    
    icon: z.string()
        .max(10, '아이콘은 10자 이하여야 합니다')
        .optional()
        .refine((val) => !val || emojiRegex.test(val) || val.length <= 2, {
            message: '올바른 이모지 또는 간단한 아이콘을 입력해주세요'
        }),
    description: z.string()
        .max(500, '설명은 500자 이하여야 합니다')
        .trim()
        .optional()
        .transform(val => val === ''? null: val)
    
})

export const updateSubjectSchema = createSubjectSchema.partial()

export const subjectParamsSchema = z.object({
    id: z.string().cuid('올바른 과목 ID가 아닙니다')
})

export const subjectQuerySchema = z.object({
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
export type SubjectParams = z.infer<typeof subjectParamsSchema>
export type SubjectQuery = z.infer<typeof subjectQuerySchema>