import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  achievement_type: string;
  achieved_at: string;
  metadata: Record<string, unknown> | null;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalPomodoros: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
  perfectDays: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_pomodoro',
    name: 'First Focus',
    description: 'Complete your first pomodoro session',
    icon: '🎯',
    condition: (stats) => stats.totalPomodoros >= 1,
  },
  {
    id: 'ten_pomodoros',
    name: 'Getting Started',
    description: 'Complete 10 pomodoro sessions',
    icon: '🔥',
    condition: (stats) => stats.totalPomodoros >= 10,
  },
  {
    id: 'fifty_pomodoros',
    name: 'Focus Master',
    description: 'Complete 50 pomodoro sessions',
    icon: '⚡',
    condition: (stats) => stats.totalPomodoros >= 50,
  },
  {
    id: 'hundred_pomodoros',
    name: 'Centurion',
    description: 'Complete 100 pomodoro sessions',
    icon: '💯',
    condition: (stats) => stats.totalPomodoros >= 100,
  },
  {
    id: 'three_day_streak',
    name: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: '📅',
    condition: (stats) => stats.currentStreak >= 3,
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🏆',
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'thirty_day_streak',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    condition: (stats) => stats.currentStreak >= 30,
  },
  {
    id: 'hour_focus',
    name: 'Deep Focus',
    description: 'Accumulate 60 minutes of focus time',
    icon: '⏰',
    condition: (stats) => stats.totalFocusMinutes >= 60,
  },
  {
    id: 'ten_hour_focus',
    name: 'Time Investor',
    description: 'Accumulate 10 hours of focus time',
    icon: '💎',
    condition: (stats) => stats.totalFocusMinutes >= 600,
  },
  {
    id: 'perfect_day',
    name: 'Perfect Day',
    description: 'Complete your daily goal',
    icon: '✨',
    condition: (stats) => stats.perfectDays >= 1,
  },
];

export function useAchievements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setAchievements(data as Achievement[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    } else {
      setAchievements([]);
      setLoading(false);
    }
  }, [user, fetchAchievements]);

  const unlockAchievement = useCallback(async (achievementType: string) => {
    if (!user) return false;

    // Check if already unlocked
    if (achievements.some(a => a.achievement_type === achievementType)) {
      return false;
    }

    const { data, error } = await supabase
      .from('achievements')
      .insert({ user_id: user.id, achievement_type: achievementType })
      .select()
      .single();

    if (!error && data) {
      setAchievements(prev => [...prev, data as Achievement]);
      
      const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.id === achievementType);
      if (definition) {
        toast({
          title: `Achievement Unlocked! ${definition.icon}`,
          description: definition.name,
        });
      }
      return true;
    }
    return false;
  }, [user, achievements, toast]);

  const checkAndUnlockAchievements = useCallback(async (stats: UserStats) => {
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      if (definition.condition(stats) && !achievements.some(a => a.achievement_type === definition.id)) {
        await unlockAchievement(definition.id);
      }
    }
  }, [achievements, unlockAchievement]);

  const getUnlockedAchievements = useCallback(() => {
    return ACHIEVEMENT_DEFINITIONS.filter(def => 
      achievements.some(a => a.achievement_type === def.id)
    );
  }, [achievements]);

  const getLockedAchievements = useCallback(() => {
    return ACHIEVEMENT_DEFINITIONS.filter(def => 
      !achievements.some(a => a.achievement_type === def.id)
    );
  }, [achievements]);

  return {
    achievements,
    loading,
    unlockAchievement,
    checkAndUnlockAchievements,
    getUnlockedAchievements,
    getLockedAchievements,
    refetch: fetchAchievements,
  };
}
