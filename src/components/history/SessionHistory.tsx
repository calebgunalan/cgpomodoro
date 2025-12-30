import { useMemo } from 'react';
import { format } from 'date-fns';
import { useSessions, PomodoroSession } from '@/hooks/useSessions';
import { useTasks, Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2 } from 'lucide-react';

interface SessionWithTask extends PomodoroSession {
  task?: Task;
}

export function SessionHistory() {
  const { sessions, loading: sessionsLoading } = useSessions();
  const { tasks, loading: tasksLoading } = useTasks();

  const sessionsWithTasks = useMemo(() => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return sessions
      .filter((s) => s.session_type === 'work')
      .map((session) => ({
        ...session,
        task: session.task_id ? taskMap.get(session.task_id) : undefined,
      })) as SessionWithTask[];
  }, [sessions, tasks]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, SessionWithTask[]> = {};
    sessionsWithTasks.forEach((session) => {
      const date = format(new Date(session.completed_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    return groups;
  }, [sessionsWithTasks]);

  if (sessionsLoading || tasksLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse text-muted-foreground text-center py-8">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionsWithTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No completed sessions yet. Start your first Pomodoro!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedSessions)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, daySessions]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-2">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.task?.name || 'No task'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration_minutes} min
                          </p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: session.task?.color || '#8B5CF6' }}
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(session.completed_at), 'h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
