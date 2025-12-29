import { useTimer, SessionType } from '@/hooks/useTimer';
import { useTasks } from '@/hooks/useTasks';
import { useSessions } from '@/hooks/useSessions';
import { TimerDisplay } from './TimerDisplay';
import { TimerControls } from './TimerControls';
import { SessionTabs } from './SessionTabs';
import { TaskSelector } from './TaskSelector';
import { useToast } from '@/hooks/use-toast';

export function PomodoroTimer() {
  const { tasks, selectedTask, setSelectedTask, addTask } = useTasks();
  const { addSession } = useSessions();
  const { toast } = useToast();

  const handleComplete = async (type: SessionType, duration: number) => {
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
  } = useTimer(handleComplete);

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

      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          Pomodoros today: <span className="text-foreground font-medium">{pomodorosCompleted}</span>
        </span>
      </div>
    </div>
  );
}