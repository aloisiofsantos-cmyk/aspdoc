import { Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ProcessService } from '../services/process.service';
import { EmailService } from '../services/email.service';
import { AuthRequest, ProcessFilters } from '../types';
import { prisma } from '../config/prisma';

export const processValidation = {
  create: [
    body('title').notEmpty().withMessage('Título é obrigatório').isLength({ max: 255 }),
    body('typeId').notEmpty().withMessage('Tipo de processo é obrigatório'),
    body('departmentId').notEmpty().withMessage('Departamento é obrigatório'),
    body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    body('dueDate').optional().isISO8601(),
  ],
  forward: [
    body('toDeptId').notEmpty().withMessage('Destino é obrigatório'),
    body('observation').optional().isLength({ max: 1000 }),
  ],
};

export class ProcessController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const process = await ProcessService.create({
        ...req.body,
        creatorId: req.user!.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });

      // Send email notification
      if (process.assignee?.email) {
        EmailService.sendProcessCreated(process.assignee.email, {
          number: process.number,
          title: process.title,
          type: process.type.name,
        }).catch(() => {});
      }

      res.status(201).json({
        success: true,
        message: `Processo ${process.number} criado com sucesso`,
        data: process,
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const filters: ProcessFilters = {
        status: req.query.status as string,
        typeId: req.query.typeId as string,
        departmentId: req.query.departmentId as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        assigneeId: req.query.assigneeId as string,
        creatorId: req.query.creatorId as string,
      };

      const result = await ProcessService.findAll(
        filters,
        { page, limit },
        req.user!.id,
        req.user!.role,
        req.user!.departmentId || undefined
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const process = await ProcessService.findById(req.params.id);
      res.json({ success: true, data: process });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const process = await ProcessService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, message: 'Processo atualizado', data: process });
    } catch (error) {
      next(error);
    }
  }

  static async forward(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const process = await ProcessService.forward(req.params.id, req.user!.id, req.body);

      // Notify destination department
      if (req.body.toUserId) {
        const toUser = await prisma.user.findUnique({ where: { id: req.body.toUserId } });
        const fromDept = await prisma.department.findUnique({ where: { id: process.departmentId } });
        const toDept = await prisma.department.findUnique({ where: { id: req.body.toDeptId } });

        if (toUser?.email && fromDept && toDept) {
          EmailService.sendProcessForwarded(toUser.email, {
            processNumber: process.number,
            processTitle: process.title,
            fromDept: fromDept.name,
            toDept: toDept.name,
            observation: req.body.observation,
          }).catch(() => {});
        }
      }

      res.json({ success: true, message: 'Processo encaminhado com sucesso', data: process });
    } catch (error) {
      next(error);
    }
  }

  static async close(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const process = await ProcessService.close(req.params.id, req.user!.id, req.body.observation);
      res.json({ success: true, message: 'Processo concluído', data: process });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.user!.role;
      const departmentId = (role === 'OFFICER' || role === 'CITIZEN')
        ? req.user!.departmentId || undefined
        : req.query.departmentId as string | undefined;

      const stats = await ProcessService.getDashboardStats(departmentId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { number } = req.params;
      const process = await prisma.process.findUnique({
        where: { number },
        select: {
          number: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          type: { select: { name: true } },
          department: { select: { name: true } },
          movements: {
            select: {
              type: true,
              observation: true,
              createdAt: true,
              fromDept: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!process) {
        res.status(404).json({ success: false, message: 'Processo não encontrado' });
        return;
      }

      res.json({ success: true, data: process });
    } catch (error) {
      next(error);
    }
  }
}
