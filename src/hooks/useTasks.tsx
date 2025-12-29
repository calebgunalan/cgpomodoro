import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  name: string;
  color: string;
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

  const addTask = async (name: string, color: string = '#8B5CF6') => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, name, color })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => [data, ...prev]);
      return data;
    }
    return null;
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
    loading,
    refetch: fetchTasks,
  };
}