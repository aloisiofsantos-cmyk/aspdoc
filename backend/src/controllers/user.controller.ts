import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

export const userValidation = {
  create: [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('role').isIn(['ADMIN', 'MANAGER', 'OFFICER', 'CITIZEN']).withMessage('Perfil inválido'),
  ],
};

export class UserController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const search = req.query.search as string;
      const role = req.query.role as string;
      const departmentId = req.query.departmentId as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = role;
      if (departmentId) where.departmentId = departmentId;
      if (isActive !== undefined) where.isActive = isActive;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            department: { select: { id: true, name: true, code: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          data: users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
          phone: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          department: { select: { id: true, name: true, code: true } },
        },
      });

      if (!user) throw new AppError('Usuário não encontrado', 404);
      res.json({ success: true, data: user });
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

      const tempPassword = `Temp@${uuidv4().slice(0, 8)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const user = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          cpf: req.body.cpf,
          role: req.body.role,
          departmentId: req.body.departmentId || null,
          phone: req.body.phone,
          password: hashedPassword,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      EmailService.sendWelcome(req.body.email, req.body.name, tempPassword).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Usuário criado. Senha temporária enviada por email.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, role, departmentId, phone, isActive } = req.body;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
          ...(departmentId !== undefined && { departmentId }),
          ...(phone !== undefined && { phone }),
          ...(isActive !== undefined && { isActive }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      res.json({ success: true, message: 'Usuário atualizado', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: { name, phone },
        select: { id: true, name: true, email: true, phone: true },
      });

      res.json({ success: true, message: 'Perfil atualizado', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tempPassword = `Temp@${uuidv4().slice(0, 8)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { password: hashedPassword },
      });

      EmailService.sendWelcome(user.email, user.name, tempPassword).catch(() => {});

      res.json({ success: true, message: 'Senha redefinida e enviada por email' });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.params.id === req.user!.id) {
        res.status(400).json({ success: false, message: 'Não é possível desativar sua própria conta' });
        return;
      }

      await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      res.json({ success: true, message: 'Usuário desativado' });
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (id === 'all') {
        await prisma.notification.updateMany({
          where: { userId: req.user!.id },
          data: { isRead: true },
        });
      } else {
        await prisma.notification.update({
          where: { id, userId: req.user!.id },
          data: { isRead: true },
        });
      }
      res.json({ success: true, message: 'Notificação marcada como lida' });
    } catch (error) {
      next(error);
    }
  }
}
