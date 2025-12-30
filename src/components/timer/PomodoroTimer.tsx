import { useMemo } from 'react';
import { useTimer, SessionType } from '@/hooks/useTimer';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { useSound, SoundType } from '@/hooks/useSound';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionTabs } from './SessionTabs';
import { TaskSelector } from './TaskSelector';
import { useToast } from '@/hooks/use-toast';

export function PomodoroTimer() {
  const { tasks, selectedTask, setSelectedTask, addTask } = useTasks();
  const { addSession } = useSessions();
  const { settings } = useSettings();
  const { playSound } = useSound();
  const { toast } = useToast();

  const timerConfig = useMemo(() => ({
    work: settings?.work_duration ?? 25,
    short_break: settings?.short_break_duration ?? 5,
    long_break: settings?.long_break_duration ?? 15,
  }), [settings]);

  const handleComplete = async (type: SessionType, duration: number) => {
    // Play sound if enabled
    if (settings?.sound_enabled) {
      playSound((settings?.sound_type as SoundType) || 'bell');
    }

    if (type === 'work') {
      await addSession(type, duration, selectedTask?.id ?? null);
      toast({
        title: 'Pomodoro completed! 🎉',
        description: selectedTask 
          ? `Great focus on "${selectedTask.name}"!` 
          : 'Time for a break.',
      });
    } else {
      toast({
        title: 'Break over',
        description: 'Ready to focus again?',
      });
    }
  };

  const {
    timeLeft,
    totalTime,
    isRunning,
    sessionType,
    pomodorosCompleted,
    start,
    pause,
    reset,
    skip,
    switchSession,
    toggleRunning,
  } = useTimer({ config: timerConfig, onComplete: handleComplete });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpace: toggleRunning,
    onR: reset,
    onS: skip,
    enabled: true,
  });

  return (
    <div className="flex flex-col items-center gap-8">
      <SessionTabs
        sessionType={sessionType}
        onSwitch={switchSession}
        isRunning={isRunning}
      />

      <TimerDisplay
        timeLeft={timeLeft}
        totalTime={totalTime}
        sessionType={sessionType}
        isRunning={isRunning}
      />

      <div className="flex flex-col items-center gap-4">
        <TaskSelector
          tasks={tasks}
          selectedTask={selectedTask}
          onSelect={setSelectedTask}
          onAdd={addTask}
          disabled={isRunning}
        />

        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />
      </div>

      <div className="text-center space-y-1">
        <span className="text-sm text-muted-foreground">
          Pomodoros today: <span className="text-foreground font-medium">{pomodorosCompleted}</span>
        </span>
        <p className="text-xs text-muted-foreground/70">
          Space to start/pause • R to reset • S to skip
        </p>
      </div>
    </div>
  );
}
