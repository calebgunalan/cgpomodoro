import { SessionType } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';

interface SessionTabsProps {
  sessionType: SessionType;
  onSwitch: (type: SessionType) => void;
  isRunning: boolean;
}

export function SessionTabs({ sessionType, onSwitch, isRunning }: SessionTabsProps) {
  const tabs: { type: SessionType; label: string }[] = [
    { type: 'work', label: 'Focus' },
    { type: 'short_break', label: 'Short Break' },
    { type: 'long_break', label: 'Long Break' },
  ];

  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
      {tabs.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => !isRunning && onSwitch(type)}
          disabled={isRunning}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all',
            sessionType === type
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            isRunning && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}