import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProcessStatus, Priority, SignatureStatus, MovementType, UserRole } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '—';
  return format(new Date(date), fmt, { locale: ptBR });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export const STATUS_LABELS: Record<ProcessStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  PENDING: 'Pendente',
  WAITING_SIGNATURE: 'Aguardando Assinatura',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<ProcessStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-orange-100 text-orange-800',
  WAITING_SIGNATURE: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
  PENDING: 'Pendente',
  SIGNED: 'Assinado',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  CREATED: 'Criado',
  FORWARDED: 'Encaminhado',
  RETURNED: 'Devolvido',
  SIGNED: 'Assinado',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado',
  COMMENTED: 'Comentário',
  REOPENED: 'Reaberto',
  CANCELLED: 'Cancelado',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  OFFICER: 'Servidor',
  CITIZEN: 'Cidadão',
};

export function canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(role);
}

export function isManager(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
}
