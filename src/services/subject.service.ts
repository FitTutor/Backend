import { prisma } from "../lib/prisma";
import { CreateSubjectInput, SubjectQuery, UpdateSubjectInput } from "../schemas/subject.schema";


export class SubjectService{
    // 사용자의 모든 과목 조회
    static async getSubjectsByUserId(userId: string, query: SubjectQuery){
        const {search, limit, offset, sortBy, sortOrder} = query

        const where = {
            userId,
            ...(search && {
                OR: [
                    {name: {contains: search, mode: 'insensitive' as const}},
                    {description: {contains: search, mode: 'insensitive' as const}}
                ]
            })
        }

        const orderBy = {[sortBy]: sortOrder}

        const [subjects, total] = await Promise.all([
            prisma.subject.findMany({
                where,
                orderBy,
                skip: offset,
                take: limit,
                select:{
                    id: true,
                    name: true,
                    color: true,
                    icon: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            studySessions: true,
                            planTasks: true
                        }
                    }
                }
            }),
            prisma.subject.count({where})
        ])

        return{
            subjects: subjects.map(subject => ({
                ...subject,
                stats: subject._count,
            })),
            pagination: {
                total,
                limit,
                offset,
                hasNext: offset + limit < total
            }
        }
    }

    // 특정 과목 조회(소유권 검증 포함)
    static async getSubjectById(id: string, userId: string){
        const subject = await prisma.subject.findFirst({
            where: {id, userId},
            select: {
                id: true,
                name: true,
                color: true,
                icon: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        studySessions: true,
                        planTasks: true
                    }
                }
            }
        })

        if(!subject){
            throw new Error('SUBJECT_NOT_FOUND')
        }

        return {
            ...subject,
            stats: subject._count
        }
    }

    // 과목 생성(중복명 검사 포함)
    static async createSubject(userId: string, data: CreateSubjectInput){
        const existingSubject = await prisma.subject.findFirst({
            where: {
                userId,
                name: {equals: data.name, mode: 'insensitive'}
            }
        })

        if(existingSubject){
            throw new Error('SUBJECT_NAME_DUPLICATE')
        }

        return await prisma.subject.create({
            data: {...data, userId},
            select: {
                id: true,
                name: true,
                color: true,
                icon: true,
                description: true,
                createdAt: true,
                updatedAt: true
            }
        })
    }

    // 과목 수정
    static async updateSubject(id: string, userId: string, data: UpdateSubjectInput){
        const existingSubject = await prisma.subject.findFirst({
            where: {id, userId}
        })

        if(!existingSubject){
            throw new Error('SUBJECT_NOT_FOUND')
        }

        // 이름 변경 시 중복 검사
        if(data.name && data.name !== existingSubject.name){
            const duplicateSubject = await prisma.subject.findFirst({
                where: {
                    userId,
                    name: {equals: data.name, mode: 'insensitive'},
                    id: {not: id}
                }
            })

            if(duplicateSubject){
                throw new Error('SUBJECT_NAME_DUPLICATE')
            }
        }

        return await prisma.subject.update({
            where: {id},
            data,
            select: {
                id: true,
                name: true,
                color: true,
                icon: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    }


    // 과목 삭제
    static async deleteSubject(id: string, userId: string){
        const subject = await prisma.subject.findFirst({
            where: {id, userId},
            include: {
                _count: {
                    select: {
                        studySessions: true,
                        planTasks: true
                    }
                }
            }
        })

        if(!subject){
            throw new Error('SUBJECT_NOT_FOUND')
        }

        await prisma.subject.delete({where: {id}})

        return {
            deletedSubject: {id: subject.id, name: subject.name},
            deletedRelatedData: subject._count
        }
    }
}
