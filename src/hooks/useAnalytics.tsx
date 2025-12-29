import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval, isSameDay } from 'date-fns';

interface DailyGoal {
  id: string;
  date: string;
  target_pomodoros: number;
  completed_pomodoros: number;
}

interface Session {
  id: string;
  task_id: string | null;
  session_type: string;
  duration_minutes: number;
  completed_at: string;
}

interface Task {
  id: string;
  name: string;
  color: string;
}

export function useAnalytics() {
  const { user } = useAuth();
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSettings, setUserSettings] = useState<{ daily_goal: number }>({ daily_goal: 8 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const [goalsRes, sessionsRes, tasksRes, settingsRes] = await Promise.all([
      supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.split('T')[0])
        .order('date', { ascending: false }),
      supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo)
        .order('completed_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (goalsRes.data) setDailyGoals(goalsRes.data);
    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (settingsRes.data) setUserSettings(settingsRes.data);

    setLoading(false);
  };

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const goal = dailyGoals.find((g) => g.date === dateStr);
      
      if (goal && goal.completed_pomodoros >= goal.target_pomodoros) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    
    return count;
  }, [dailyGoals]);

  const todayStats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const goal = dailyGoals.find((g) => g.date === todayStr);
    
    const todaySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.completed_at);
      return isSameDay(sessionDate, today) && s.session_type === 'work';
    });

    return {
      completed: goal?.completed_pomodoros ?? todaySessions.length,
      target: goal?.target_pomodoros ?? userSettings.daily_goal,
      focusMinutes: todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
    };
  }, [dailyGoals, sessions, userSettings]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.completed_at);
        return isSameDay(sessionDate, day) && s.session_type === 'work';
      });

      return {
        day: format(day, 'EEE'),
        date: dateStr,
        pomodoros: daySessions.length,
        minutes: daySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
      };
    });
  }, [sessions]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter((s) => {
        const sessionDate = new Date(s.completed_at);
        return isSameDay(sessionDate, day) && s.session_type === 'work';
      });

      return {
        day: format(day, 'd'),
        date: dateStr,
        pomodoros: daySessions.length,
        minutes: daySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
      };
    });
  }, [sessions]);

  const taskBreakdown = useMemo(() => {
    const workSessions = sessions.filter((s) => s.session_type === 'work');
    const breakdown: Record<string, { name: string; color: string; minutes: number; count: number }> = {};

    workSessions.forEach((session) => {
      const taskId = session.task_id ?? 'uncategorized';
      const task = tasks.find((t) => t.id === session.task_id);

      if (!breakdown[taskId]) {
        breakdown[taskId] = {
          name: task?.name ?? 'Uncategorized',
          color: task?.color ?? '#6B7280',
          minutes: 0,
          count: 0,
        };
      }

      breakdown[taskId].minutes += session.duration_minutes;
      breakdown[taskId].count += 1;
    });

    return Object.values(breakdown).sort((a, b) => b.minutes - a.minutes);
  }, [sessions, tasks]);

  const updateDailyGoal = async (target: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, daily_goal: target, updated_at: new Date().toISOString() });

    if (!error) {
      setUserSettings((prev) => ({ ...prev, daily_goal: target }));
    }
  };

  return {
    streak,
    todayStats,
    weeklyData,
    monthlyData,
    taskBreakdown,
    userSettings,
    updateDailyGoal,
    loading,
    refetch: fetchData,
  };
}