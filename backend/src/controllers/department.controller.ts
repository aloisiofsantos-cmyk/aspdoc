import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

export const deptValidation = {
  create: [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('code').notEmpty().withMessage('Código é obrigatório')
      .matches(/^[A-Z0-9_]+$/).withMessage('Código deve conter apenas letras maiúsculas, números e underscore'),
  ],
};

export class DepartmentController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await prisma.department.findMany({
        where: { isActive: req.query.active !== 'false' ? true : undefined },
        include: {
          parent: { select: { id: true, name: true } },
          children: { select: { id: true, name: true, code: true } },
          _count: { select: { users: true, processes: true } },
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async getTree(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      // Build tree
      const deptMap = new Map(departments.map(d => [d.id, { ...d, children: [] as typeof departments }]));
      const roots: typeof departments = [];

      for (const dept of departments) {
        if (dept.parentId) {
          const parent = deptMap.get(dept.parentId);
          if (parent) parent.children.push(dept);
        } else {
          roots.push(dept);
        }
      }

      res.json({ success: true, data: roots });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await prisma.department.findUnique({
        where: { id: req.params.id },
        include: {
          parent: true,
          children: true,
          users: {
            where: { isActive: true },
            select: { id: true, name: true, email: true, role: true },
          },
          _count: { select: { processes: true } },
        },
      });

      if (!dept) throw new AppError('Departamento não encontrado', 404);
      res.json({ success: true, data: dept });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const dept = await prisma.department.create({
        data: {
          name: req.body.name,
          code: req.body.code.toUpperCase(),
          description: req.body.description,
          parentId: req.body.parentId || null,
        },
      });

      res.status(201).json({ success: true, message: 'Departamento criado', data: dept });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await prisma.department.update({
        where: { id: req.params.id },
        data: {
          name: req.body.name,
          description: req.body.description,
          parentId: req.body.parentId,
          isActive: req.body.isActive,
        },
      });

      res.json({ success: true, message: 'Departamento atualizado', data: dept });
    } catch (error) {
      next(error);
    }
  }
}
