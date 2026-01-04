import { useEffect, useState } from 'react';
import { X, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionType } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import { useAmbientSound } from '@/hooks/useAmbientSound';

interface FocusModeProps {
  timeLeft: number;
  totalTime: number;
  sessionType: SessionType;
  isRunning: boolean;
  taskName?: string;
  pomodorosCompleted?: number;
  dailyGoal?: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onExit: () => void;
}

export function FocusMode({
  timeLeft,
  totalTime,
  sessionType,
  isRunning,
  taskName,
  pomodorosCompleted = 0,
  dailyGoal = 8,
  onStart,
  onPause,
  onReset,
  onSkip,
  onExit,
}: FocusModeProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const [dimLevel, setDimLevel] = useState(0);
  
  const { currentSound, isPlaying: isSoundPlaying, toggleSound, stopSound: stopAmbient } = useAmbientSound();

  // Gradually dim the interface when timer is running
  useEffect(() => {
    if (isRunning && sessionType === 'work') {
      const timer = setInterval(() => {
        setDimLevel((prev) => Math.min(prev + 0.02, 0.4));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setDimLevel(0);
    }
  }, [isRunning, sessionType]);

  // Lock scroll and hide overflow when in focus mode
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const handleToggleSound = () => {
    if (currentSound) {
      toggleSound(currentSound);
    }
  };

  const sessionColors = {
    work: 'text-primary',
    short_break: 'text-emerald-400',
    long_break: 'text-blue-400',
  };

  const sessionLabels = {
    work: 'Focus Time',
    short_break: 'Short Break',
    long_break: 'Long Break',
  };

  const dailyProgress = Math.min((pomodorosCompleted / dailyGoal) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      {/* Dim overlay when running */}
      {dimLevel > 0 && (
        <div 
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-1000"
          style={{ opacity: dimLevel }}
        />
      )}

      {/* Top bar with sound control and progress */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentSound && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="text-muted-foreground hover:text-foreground"
            >
              {isSoundPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
          )}
        </div>
        
        {/* Daily progress mini display */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{pomodorosCompleted}/{dailyGoal} today</span>
          <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Session type label */}
      <div className={cn('text-lg font-medium mb-4', sessionColors[sessionType])}>
        {sessionLabels[sessionType]}
      </div>

      {/* Task name */}
      {taskName && (
        <div className="text-muted-foreground text-sm mb-8">
          Working on: {taskName}
        </div>
      )}

      {/* Large timer display */}
      <div className="relative">
        {/* Progress ring */}
        <svg className="w-80 h-80 -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/20"
          />
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 150}
            strokeDashoffset={2 * Math.PI * 150 * (1 - progress / 100)}
            className={cn('transition-all duration-1000', sessionColors[sessionType])}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-8xl font-light tabular-nums', sessionColors[sessionType])}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          onClick={isRunning ? onPause : onStart}
          className={cn(
            'w-20 h-20 rounded-full',
            sessionType === 'work' && 'bg-primary hover:bg-primary/90',
            sessionType === 'short_break' && 'bg-emerald-500 hover:bg-emerald-600',
            sessionType === 'long_break' && 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSkip}
          className="w-12 h-12 rounded-full"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-8 text-xs text-muted-foreground/50">
        Press ESC to exit focus mode • Space to play/pause
      </div>
    </div>
  );
}
