import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import axios from 'axios';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { JwtPayload, GovBrUserInfo } from '../types';
import { User } from '@prisma/client';

export class AuthService {
  static generateTokens(user: User) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = uuidv4();

    return { accessToken, refreshToken };
  }

  static async saveRefreshToken(userId: string, token: string): Promise<void> {
    // Remove old tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: addDays(new Date(), 7),
      },
    });
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    if (!user || !user.password) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo. Entre em contato com o administrador.', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Email ou senha incorretos', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async refreshToken(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError('Token de refresh inválido ou expirado', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Usuário inativo', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(storedToken.user);
    await this.saveRefreshToken(storedToken.userId, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async logout(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  static getGovBrAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.govBr.clientId,
      redirect_uri: config.govBr.redirectUri,
      scope: 'openid email profile cpf',
      state,
      nonce: uuidv4(),
    });
    return `${config.govBr.authUrl}?${params.toString()}`;
  }

  static async handleGovBrCallback(code: string): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    // Exchange code for token
    const tokenResponse = await axios.post(
      config.govBr.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.govBr.redirectUri,
        client_id: config.govBr.clientId,
        client_secret: config.govBr.clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userInfoResponse = await axios.get(config.govBr.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const govBrUser: GovBrUserInfo = userInfoResponse.data;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { govBrId: govBrUser.sub },
          { cpf: govBrUser.cpf },
          { email: govBrUser.email },
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          name: govBrUser.name,
          email: govBrUser.email,
          cpf: govBrUser.cpf,
          govBrId: govBrUser.sub,
          govBrToken: access_token,
          role: 'CITIZEN',
          isActive: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          govBrId: govBrUser.sub,
          govBrToken: access_token,
          lastLogin: new Date(),
        },
      });
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.saveRefreshToken(user.id, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken, isNewUser };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Senha atual incorreta', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
