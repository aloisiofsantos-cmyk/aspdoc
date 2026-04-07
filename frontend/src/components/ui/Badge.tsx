import React from 'react';
import { cn } from '../../utils';
import {
  STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  SIGNATURE_STATUS_LABELS,
} from '../../utils';
import { ProcessStatus, Priority, SignatureStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';
}

const variantClasses = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
};

export function Badge({ children, className, variant = 'blue' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProcessStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      STATUS_COLORS[status]
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      PRIORITY_COLORS[priority]
    )}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function SignatureBadge({ status }: { status: SignatureStatus }) {
  const colors: Record<SignatureStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SIGNED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[status])}>
      {SIGNATURE_STATUS_LABELS[status]}
    </span>
  );
}
