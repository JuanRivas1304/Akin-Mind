import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className, variant = 'primary', size = 'md', loading, children, disabled, ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants = {
    primary: 'bg-[--primary] text-[--primary-fg] hover:opacity-90',
    secondary: 'bg-[--accent] text-[--foreground] hover:bg-[--accent-hover] border border-[--border]',
    ghost: 'text-[--muted] hover:bg-[--accent] hover:text-[--foreground]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-900',
  };
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2', lg: 'text-sm px-5 py-2.5' };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});
Button.displayName = 'Button';
