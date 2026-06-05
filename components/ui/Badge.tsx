import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[--accent] text-[--muted]',
    success: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
