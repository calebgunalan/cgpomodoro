import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  name: string;
  color: string;
  estimated_pomodoros: number | null;
  completed_pomodoros: number;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    }
    setLoading(false);
  };

  const addTask = async (name: string, color: string = '#8B5CF6', estimatedPomodoros?: number) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        user_id: user.id, 
        name, 
        color,
        estimated_pomodoros: estimatedPomodoros ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => [data, ...prev]);
      return data;
    }
    return null;
  };

  const updateTaskEstimate = async (id: string, estimatedPomodoros: number | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ estimated_pomodoros: estimatedPomodoros })
      .eq('id', id);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estimated_pomodoros: estimatedPomodoros } : t))
      );
      if (selectedTask?.id === id) {
        setSelectedTask((prev) => prev ? { ...prev, estimated_pomodoros: estimatedPomodoros } : prev);
      }
    }
  };

  const incrementCompletedPomodoros = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCount = task.completed_pomodoros + 1;
    const { error } = await supabase
      .from('tasks')
      .update({ completed_pomodoros: newCount })
      .eq('id', id);

    if (!error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed_pomodoros: newCount } : t))
      );
      if (selectedTask?.id === id) {
        setSelectedTask((prev) => prev ? { ...prev, completed_pomodoros: newCount } : prev);
      }
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    }
  };

  return {
    tasks,
    selectedTask,
    setSelectedTask,
    addTask,
    deleteTask,
    updateTaskEstimate,
    incrementCompletedPomodoros,
    loading,
    refetch: fetchTasks,
  };
}