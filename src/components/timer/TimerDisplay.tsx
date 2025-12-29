import { SessionType } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  sessionType: SessionType;
  isRunning: boolean;
}

export function TimerDisplay({ timeLeft, totalTime, sessionType, isRunning }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClass = {
    work: 'text-primary',
    short_break: 'text-success',
    long_break: 'text-timer-long-break',
  }[sessionType];

  const strokeColor = {
    work: 'hsl(262, 83%, 58%)',
    short_break: 'hsl(142, 76%, 42%)',
    long_break: 'hsl(199, 89%, 53%)',
  }[sessionType];

  const glowClass = {
    work: 'timer-glow',
    short_break: 'timer-glow-success',
    long_break: 'timer-glow-info',
  }[sessionType];

  return (
    <div className={cn('relative flex items-center justify-center', isRunning && glowClass)}>
      <svg className="w-72 h-72 md:w-80 md:h-80 -rotate-90" viewBox="0 0 300 300">
        {/* Background circle */}
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn('font-mono text-7xl md:text-8xl font-semibold tracking-tight', colorClass)}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground text-sm mt-2 uppercase tracking-widest">
          {sessionType.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}