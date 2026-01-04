import { useMemo, useState, useCallback } from 'react';
import { useTimer, SessionType } from '@/hooks/useTimer';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { useSettings } from '@/hooks/useSettings';
import { useSound, SoundType } from '@/hooks/useSound';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNotifications } from '@/hooks/useNotifications';
import { useAchievements, UserStats } from '@/hooks/useAchievements';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionTabs } from './SessionTabs';
import { TaskSelector } from './TaskSelector';
import { FocusMode } from './FocusMode';
import { TimerPresets, TimerPreset } from './TimerPresets';
import { AmbientSoundPlayer } from '@/components/sounds/AmbientSoundPlayer';
import { BreakSuggestions } from '@/components/breaks/BreakSuggestions';
import { GoalTracker } from '@/components/goals/GoalTracker';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Maximize2, Bell, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function PomodoroTimer() {
  const { tasks, selectedTask, setSelectedTask, addTask, updateTaskEstimate, incrementCompletedPomodoros } = useTasks();
  const { addSession } = useSessions();
  const { settings, updateSettings } = useSettings();
  const { playSound } = useSound();
  const { toast } = useToast();
  const { permission, requestPermission, sendNotification, isSupported } = useNotifications();
  const { checkAndUnlockAchievements } = useAchievements();
  const { streak, todayStats, weeklyData, updateDailyGoal } = useAnalytics();
  const { stopSound: stopAmbient } = useAmbientSound();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showBreakSuggestions, setShowBreakSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);

  const timerConfig = useMemo(() => ({
    work: activePreset?.work ?? settings?.work_duration ?? 25,
    short_break: activePreset?.shortBreak ?? settings?.short_break_duration ?? 5,
    long_break: activePreset?.longBreak ?? settings?.long_break_duration ?? 15,
  }), [settings, activePreset]);

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

  const handleSelectPreset = useCallback((preset: TimerPreset) => {
    setActivePreset(preset);
    // Also update settings for persistence
    updateSettings({
      work_duration: preset.work,
      short_break_duration: preset.shortBreak,
      long_break_duration: preset.longBreak,
    });
  }, [updateSettings]);

  const weeklyCompleted = weeklyData.reduce((sum, d) => sum + d.pomodoros, 0);
  const weeklyTarget = (settings?.daily_goal ?? 8) * 7;

  if (isFocusMode) {
    return (
      <FocusMode
        timeLeft={timeLeft}
        totalTime={totalTime}
        sessionType={sessionType}
        isRunning={isRunning}
        taskName={selectedTask?.name}
        pomodorosCompleted={pomodorosCompleted}
        dailyGoal={settings?.daily_goal ?? 8}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSkip={skip}
        onExit={() => setIsFocusMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
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

      <div className="flex flex-col items-center gap-4 w-full">
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

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFocusMode(true)}
            className="gap-2 text-muted-foreground"
          >
            <Maximize2 className="w-4 h-4" />
            Focus Mode
          </Button>

          <AmbientSoundPlayer compact />

          {sessionType !== 'work' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakSuggestions(true)}
              className="gap-2 text-muted-foreground"
            >
              <Sparkles className="w-4 h-4" />
              Break Ideas
            </Button>
          )}

          {isSupported && permission !== 'granted' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestNotifications}
              className="gap-2 text-muted-foreground"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </Button>
          )}
        </div>

        {showBreakSuggestions && sessionType !== 'work' && (
          <BreakSuggestions
            breakType={sessionType === 'long_break' ? 'long' : 'short'}
            sessionCount={pomodorosCompleted}
            onClose={() => setShowBreakSuggestions(false)}
          />
        )}
      </div>

      {/* Timer Presets & Goal Tracking */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Presets & Goals
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <TimerPresets
            currentPreset={activePreset}
            onSelectPreset={handleSelectPreset}
          />
          
          <GoalTracker
            todayCompleted={todayStats?.completed ?? 0}
            todayTarget={settings?.daily_goal ?? 8}
            weeklyCompleted={weeklyCompleted}
            weeklyTarget={weeklyTarget}
            currentStreak={streak}
            longestStreak={streak}
            onUpdateDailyGoal={updateDailyGoal}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="text-center space-y-1">
        <span className="text-sm text-muted-foreground">
          Pomodoros today: <span className="text-foreground font-medium">{pomodorosCompleted}</span> / {settings?.daily_goal ?? 8}
        </span>
        <p className="text-xs text-muted-foreground/70">
          Space to start/pause • R to reset • S to skip
        </p>
      </div>
    </div>
  );
}
