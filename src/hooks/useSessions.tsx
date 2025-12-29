import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SessionType } from './useTimer';

export interface PomodoroSession {
  id: string;
  task_id: string | null;
  session_type: string;
  duration_minutes: number;
  completed_at: string;
}

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(500);

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const addSession = async (
    sessionType: SessionType,
    durationMinutes: number,
    taskId: string | null
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        session_type: sessionType,
        duration_minutes: durationMinutes,
        task_id: taskId,
      })
      .select()
      .single();

    if (!error && data) {
      setSessions((prev) => [data, ...prev]);
      
      // Update daily goal
      await updateDailyGoal();
      
      return data;
    }
    return null;
  };

  const updateDailyGoal = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('daily_goals')
        .update({ completed_pomodoros: existing.completed_pomodoros + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('daily_goals')
        .insert({ user_id: user.id, date: today, completed_pomodoros: 1 });
    }
  };

  return {
    sessions,
    addSession,
    loading,
    refetch: fetchSessions,
  };
}