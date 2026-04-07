import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export interface ProcessFilters {
  status?: string;
  typeId?: string;
  departmentId?: string;
  priority?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  assigneeId?: string;
  creatorId?: string;
}

export interface GovBrUserInfo {
  sub: string;
  name: string;
  email: string;
  cpf: string;
  phone_number?: string;
  picture?: string;
  amr?: string[];
}
