import { useMemo, useState } from 'react';
import { useTimer, SessionType } from '@/hooks/useTimer';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { useSound, SoundType } from '@/hooks/useSound';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNotifications } from '@/hooks/useNotifications';
import { useAchievements, UserStats } from '@/hooks/useAchievements';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionTabs } from './SessionTabs';
import { TaskSelector } from './TaskSelector';
import { FocusMode } from './FocusMode';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Maximize2, Bell, BellOff } from 'lucide-react';

export function PomodoroTimer() {
  const { tasks, selectedTask, setSelectedTask, addTask, updateTaskEstimate, incrementCompletedPomodoros } = useTasks();
  const { addSession } = useSessions();
  const { settings } = useSettings();
  const { playSound } = useSound();
  const { toast } = useToast();
  const { permission, requestPermission, sendNotification, isSupported } = useNotifications();
  const { checkAndUnlockAchievements } = useAchievements();
  const { streak, todayStats, weeklyData } = useAnalytics();
  const [isFocusMode, setIsFocusMode] = useState(false);

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

    // Send browser notification
    if (permission === 'granted') {
      if (type === 'work') {
        sendNotification('Pomodoro Complete! 🎉', {
          body: selectedTask ? `Great focus on "${selectedTask.name}"!` : 'Time for a break.',
        });
      } else {
        sendNotification('Break Over', {
          body: 'Ready to focus again?',
        });
      }
    }

    if (type === 'work') {
      await addSession(type, duration, selectedTask?.id ?? null);
      
      // Increment completed pomodoros for the task
      if (selectedTask) {
        await incrementCompletedPomodoros(selectedTask.id);
      }

      toast({
        title: 'Pomodoro completed! 🎉',
        description: selectedTask 
          ? `Great focus on "${selectedTask.name}"!` 
          : 'Time for a break.',
      });

      // Check achievements
      const totalPomodoros = (todayStats?.completed || 0) + 1;
      const totalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0) + duration;
      const stats: UserStats = {
        totalPomodoros,
        currentStreak: streak,
        longestStreak: streak,
        totalFocusMinutes: totalMinutes,
        tasksCompleted: tasks.filter(t => t.estimated_pomodoros && t.completed_pomodoros >= t.estimated_pomodoros).length,
        perfectDays: todayStats?.completed >= (settings?.daily_goal || 8) ? 1 : 0,
      };
      await checkAndUnlockAchievements(stats);
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
    enabled: !isFocusMode,
  });

  // Focus mode keyboard shortcuts
  useKeyboardShortcuts({
    onSpace: toggleRunning,
    onR: reset,
    onS: skip,
    enabled: isFocusMode,
  });

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: 'Notifications enabled',
        description: "You'll be notified when timers complete.",
      });
    }
  };

  if (isFocusMode) {
    return (
      <FocusMode
        timeLeft={timeLeft}
        totalTime={totalTime}
        sessionType={sessionType}
        isRunning={isRunning}
        taskName={selectedTask?.name}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSkip={skip}
        onExit={() => setIsFocusMode(false)}
      />
    );
  }

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
          onUpdateEstimate={updateTaskEstimate}
          disabled={isRunning}
        />

        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          onSkip={skip}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFocusMode(true)}
            className="gap-2 text-muted-foreground"
          >
            <Maximize2 className="w-4 h-4" />
            Focus Mode
          </Button>

          {isSupported && permission !== 'granted' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestNotifications}
              className="gap-2 text-muted-foreground"
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </Button>
          )}

          {permission === 'granted' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BellOff className="w-3 h-3" />
              Notifications on
            </div>
          )}
        </div>
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
