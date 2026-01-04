import { cn } from '@/lib/utils';

interface TabBadgeProps {
  count: number;
  variant?: 'default' | 'warning' | 'success';
  className?: string;
}

export function TabBadge({ count, variant = 'default', className }: TabBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'warning' && 'bg-orange-500 text-white',
        variant === 'success' && 'bg-green-500 text-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
