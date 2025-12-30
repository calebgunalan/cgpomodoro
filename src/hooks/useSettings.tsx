import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSettings {
  id: string;
  daily_goal: number;
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sound_enabled: boolean;
  sound_type: string;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
  daily_goal: 8,
  work_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sound_enabled: true,
  sound_type: 'bell',
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(data as UserSettings);
    } else {
      // Create default settings for new user
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single();

      if (!insertError && newSettings) {
        setSettings(newSettings as UserSettings);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<UserSettings, 'id'>>) => {
    if (!user || !settings) return false;

    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
      .select()
      .single();

    if (!error && data) {
      setSettings(data as UserSettings);
      return true;
    }
    return false;
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
}
