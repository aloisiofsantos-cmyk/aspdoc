import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthRequest, JwtPayload } from '../types';
import { UserRole } from '@prisma/client';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token de autenticação não fornecido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expirado' });
      return;
    }
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    next();
  };
};

export const isSuperAdmin = authorize(UserRole.SUPER_ADMIN);
export const isAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN);
export const isManager = authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER);
