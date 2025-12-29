import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({ isRunning, onStart, onPause, onReset, onSkip }: TimerControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="w-12 h-12 rounded-full"
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
      
      <Button
        onClick={isRunning ? onPause : onStart}
        size="lg"
        className="w-20 h-20 rounded-full text-lg"
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
  );
}