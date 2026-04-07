import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../types';

export const authValidation = {
  login: [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  changePassword: [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Senha deve ter no mínimo 8 caracteres, uma maiúscula, uma minúscula e um número'),
  ],
};

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token é obrigatório' });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await AuthService.logout(req.user.id);
      }
      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    res.json({ success: true, data: req.user });
  }

  static async govBrInit(req: Request, res: Response): Promise<void> {
    const state = uuidv4();
    const authUrl = AuthService.getGovBrAuthUrl(state);
    res.json({ success: true, data: { authUrl, state } });
  }

  static async govBrCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.query;
      if (!code) {
        res.status(400).json({ success: false, message: 'Código de autorização não fornecido' });
        return;
      }

      const result = await AuthService.handleGovBrCallback(code as string);
      res.json({
        success: true,
        message: result.isNewUser ? 'Conta criada via Gov.br' : 'Login via Gov.br realizado',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.id, currentPassword, newPassword);

      res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
}
