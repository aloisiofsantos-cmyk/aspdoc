import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { ProcessFilters, PaginatedResponse } from '../types';
import { Process, ProcessStatus, MovementType } from '@prisma/client';

export class ProcessService {
  static async generateProtocolNumber(): Promise<{ number: string; year: number; sequence: number }> {
    const year = new Date().getFullYear();

    const counter = await prisma.protocolCounter.upsert({
      where: { year },
      update: { sequence: { increment: 1 } },
      create: { year, sequence: 1 },
    });

    const sequence = counter.sequence;
    const paddedSequence = String(sequence).padStart(6, '0');
    const number = `PROC-${year}-${paddedSequence}`;

    return { number, year, sequence };
  }

  static async create(data: {
    title: string;
    description?: string;
    typeId: string;
    departmentId: string;
    creatorId: string;
    priority?: string;
    dueDate?: Date;
    isConfidential?: boolean;
    assigneeId?: string;
    externalName?: string;
    externalCpf?: string;
    externalEmail?: string;
    externalPhone?: string;
    tags?: string[];
  }) {
    const { number, year, sequence } = await this.generateProtocolNumber();

    const process = await prisma.process.create({
      data: {
        number,
        year,
        sequence,
        title: data.title,
        description: data.description,
        typeId: data.typeId,
        departmentId: data.departmentId,
        creatorId: data.creatorId,
        priority: (data.priority as any) || 'NORMAL',
        dueDate: data.dueDate,
        isConfidential: data.isConfidential || false,
        assigneeId: data.assigneeId,
        externalName: data.externalName,
        externalCpf: data.externalCpf,
        externalEmail: data.externalEmail,
        externalPhone: data.externalPhone,
        status: 'OPEN',
        tags: data.tags?.length ? {
          create: data.tags.map(tag => ({ tag })),
        } : undefined,
      },
      include: {
        type: true,
        department: true,
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        tags: true,
      },
    });

    // Log movement
    await prisma.movement.create({
      data: {
        processId: process.id,
        toDeptId: data.departmentId,
        userId: data.creatorId,
        type: MovementType.CREATED,
        observation: 'Processo criado',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        processId: process.id,
        userId: data.creatorId,
        action: 'PROCESS_CREATED',
        entity: 'Process',
        entityId: process.id,
        details: { number: process.number, title: process.title },
      },
    });

    return process;
  }

  static async findAll(
    filters: ProcessFilters,
    pagination: { page: number; limit: number },
    userId?: string,
    userRole?: string,
    userDeptId?: string
  ): Promise<PaginatedResponse<Process>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.typeId) where.typeId = filters.typeId;
    if (filters.priority) where.priority = filters.priority;

    // Department filter
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    } else if (userRole === 'OFFICER' || userRole === 'CITIZEN') {
      // Officers see only their dept or created by them
      where.OR = [
        { departmentId: userDeptId },
        { creatorId: userId },
        { assigneeId: userId },
      ];
    }

    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.creatorId) where.creatorId = filters.creatorId;

    if (filters.search) {
      where.OR = [
        { number: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { externalName: { contains: filters.search, mode: 'insensitive' } },
        { externalCpf: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as any).gte = new Date(filters.startDate);
      if (filters.endDate) (where.createdAt as any).lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      prisma.process.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          type: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          tags: true,
          _count: { select: { documents: true, movements: true } },
        },
      }),
      prisma.process.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findById(id: string) {
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        type: true,
        department: true,
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        tags: true,
        documents: {
          include: {
            signatures: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        movements: {
          include: {
            user: { select: { id: true, name: true } },
            fromDept: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!process) throw new AppError('Processo não encontrado', 404);
    return process;
  }

  static async update(id: string, userId: string, data: Partial<{
    title: string;
    description: string;
    status: ProcessStatus;
    priority: string;
    dueDate: Date;
    assigneeId: string;
    isConfidential: boolean;
  }>) {
    const process = await prisma.process.findUnique({ where: { id } });
    if (!process) throw new AppError('Processo não encontrado', 404);

    const updated = await prisma.process.update({
      where: { id },
      data: {
        ...data,
        priority: data.priority as any,
        updatedAt: new Date(),
      },
    });

    await prisma.activity.create({
      data: {
        processId: id,
        userId,
        action: 'PROCESS_UPDATED',
        entity: 'Process',
        entityId: id,
        details: { changes: data },
      },
    });

    return updated;
  }

  static async forward(id: string, userId: string, data: {
    toDeptId: string;
    toUserId?: string;
    observation?: string;
  }) {
    const process = await prisma.process.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!process) throw new AppError('Processo não encontrado', 404);

    const [updatedProcess] = await Promise.all([
      prisma.process.update({
        where: { id },
        data: {
          departmentId: data.toDeptId,
          assigneeId: data.toUserId || null,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.movement.create({
        data: {
          processId: id,
          fromDeptId: process.departmentId,
          toDeptId: data.toDeptId,
          fromUserId: userId,
          toUserId: data.toUserId,
          userId,
          observation: data.observation,
          type: MovementType.FORWARDED,
        },
      }),
      prisma.activity.create({
        data: {
          processId: id,
          userId,
          action: 'PROCESS_FORWARDED',
          details: { to: data.toDeptId, observation: data.observation },
        },
      }),
    ]);

    return updatedProcess;
  }

  static async close(id: string, userId: string, observation?: string) {
    const updated = await prisma.process.update({
      where: { id },
      data: { status: 'COMPLETED', closedAt: new Date() },
    });

    await prisma.movement.create({
      data: {
        processId: id,
        toDeptId: updated.departmentId,
        userId,
        observation: observation || 'Processo concluído',
        type: MovementType.COMPLETED,
      },
    });

    return updated;
  }

  static async getDashboardStats(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};

    const [
      total,
      open,
      inProgress,
      completed,
      overdue,
      byStatus,
      byType,
      recentProcesses,
    ] = await Promise.all([
      prisma.process.count({ where }),
      prisma.process.count({ where: { ...where, status: 'OPEN' } }),
      prisma.process.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.process.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.process.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] },
        },
      }),
      prisma.process.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.process.groupBy({
        by: ['typeId'],
        where,
        _count: { typeId: true },
        orderBy: { _count: { typeId: 'desc' } },
        take: 5,
      }),
      prisma.process.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          type: { select: { name: true } },
          creator: { select: { name: true } },
        },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      completed,
      overdue,
      byStatus,
      byType,
      recentProcesses,
    };
  }
}
