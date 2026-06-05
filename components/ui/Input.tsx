import { cn } from '@/lib/utils';
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-[--foreground]">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-[--card-bg] text-[--foreground] text-sm',
            'placeholder:text-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary]/40',
            'transition-all duration-150',
            error && 'border-red-400 focus:ring-red-200',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-[--foreground]">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border border-[--border] bg-[--card-bg] text-[--foreground] text-sm',
            'placeholder:text-[--muted] focus:outline-none focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary]/40',
            'transition-all duration-150 resize-none',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
