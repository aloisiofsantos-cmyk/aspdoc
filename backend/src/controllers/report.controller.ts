import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class ReportController {
  static async processByStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, departmentId } = req.query;

      const where: Record<string, unknown> = {};
      if (departmentId) where.departmentId = departmentId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as any).gte = new Date(startDate as string);
        if (endDate) (where.createdAt as any).lte = new Date(endDate as string);
      }

      const data = await prisma.process.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async processByType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, departmentId } = req.query;

      const where: Record<string, unknown> = {};
      if (departmentId) where.departmentId = departmentId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as any).gte = new Date(startDate as string);
        if (endDate) (where.createdAt as any).lte = new Date(endDate as string);
      }

      const data = await prisma.process.groupBy({
        by: ['typeId'],
        where,
        _count: { typeId: true },
        orderBy: { _count: { typeId: 'desc' } },
      });

      const types = await prisma.processType.findMany({ select: { id: true, name: true } });
      const typeMap = new Map(types.map(t => [t.id, t.name]));

      const result = data.map(d => ({
        typeId: d.typeId,
        typeName: typeMap.get(d.typeId) || 'Desconhecido',
        count: d._count.typeId,
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async processByDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const where: Record<string, unknown> = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) (where.createdAt as any).gte = new Date(startDate as string);
        if (endDate) (where.createdAt as any).lte = new Date(endDate as string);
      }

      const data = await prisma.process.groupBy({
        by: ['departmentId'],
        where,
        _count: { departmentId: true },
        orderBy: { _count: { departmentId: 'desc' } },
      });

      const depts = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
      const deptMap = new Map(depts.map(d => [d.id, d]));

      const result = data.map(d => ({
        departmentId: d.departmentId,
        department: deptMap.get(d.departmentId) || { name: 'Desconhecido', code: '?' },
        count: d._count.departmentId,
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async monthlyEvolution(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const result = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const [created, completed] = await Promise.all([
          prisma.process.count({ where: { createdAt: { gte: start, lte: end } } }),
          prisma.process.count({
            where: {
              closedAt: { gte: start, lte: end },
              status: 'COMPLETED',
            },
          }),
        ]);

        result.push({
          month: format(date, 'MMM/yy', { locale: ptBR }),
          created,
          completed,
        });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async overdue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const processes = await prisma.process.findMany({
        where: {
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] },
        },
        include: {
          type: { select: { name: true } },
          department: { select: { name: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
      });

      res.json({ success: true, data: processes });
    } catch (error) {
      next(error);
    }
  }

  static async summary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalProcesses,
        totalToday,
        totalThisMonth,
        totalUsers,
        totalDepts,
        totalDocs,
        pendingSignatures,
      ] = await Promise.all([
        prisma.process.count(),
        prisma.process.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.process.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.department.count({ where: { isActive: true } }),
        prisma.document.count(),
        prisma.signature.count({ where: { status: 'PENDING' } }),
      ]);

      res.json({
        success: true,
        data: {
          totalProcesses,
          totalToday,
          totalThisMonth,
          totalUsers,
          totalDepts,
          totalDocs,
          pendingSignatures,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
