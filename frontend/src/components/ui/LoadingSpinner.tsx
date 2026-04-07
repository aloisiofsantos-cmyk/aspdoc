import React from 'react';
import { cn } from '../../utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
        sizeClasses[size]
      )} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner text="Carregando..." />
    </div>
  );
}
