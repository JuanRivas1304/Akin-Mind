import { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[--accent] flex items-center justify-center text-[--muted] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[--foreground] mb-1">{title}</h3>
      <p className="text-sm text-[--muted] mb-5 max-w-xs">{description}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
