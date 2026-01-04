import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Flame, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface GoalTrackerProps {
  todayCompleted: number;
  todayTarget: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  currentStreak: number;
  longestStreak: number;
  onUpdateDailyGoal?: (target: number) => void;
}

export function GoalTracker({
  todayCompleted,
  todayTarget,
  weeklyCompleted,
  weeklyTarget,
  currentStreak,
  longestStreak,
  onUpdateDailyGoal,
}: GoalTrackerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  const dailyProgress = Math.min((todayCompleted / todayTarget) * 100, 100);
  const weeklyProgress = Math.min((weeklyCompleted / weeklyTarget) * 100, 100);
  const isDailyGoalMet = todayCompleted >= todayTarget;
  const isWeeklyGoalMet = weeklyCompleted >= weeklyTarget;

  // Trigger celebration when daily goal is met
  useEffect(() => {
    if (isDailyGoalMet && !hasTriggeredCelebration && todayCompleted > 0) {
      setShowCelebration(true);
      setHasTriggeredCelebration(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
      });

      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [isDailyGoalMet, hasTriggeredCelebration, todayCompleted]);

  // Reset celebration flag at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setHasTriggeredCelebration(false);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-muted-foreground';
  };

  return (
    <Card className="relative overflow-hidden">
      {showCelebration && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="text-center space-y-2">
            <Sparkles className="w-12 h-12 mx-auto text-amber-400 animate-pulse" />
            <p className="text-xl font-bold text-foreground">Daily Goal Achieved! 🎉</p>
            <p className="text-sm text-muted-foreground">Keep up the amazing work!</p>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4" />
          Goal Progress
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Daily Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's Goal</span>
            <span className={cn(
              'font-medium',
              isDailyGoalMet ? 'text-emerald-500' : 'text-foreground'
            )}>
              {todayCompleted} / {todayTarget} pomodoros
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                getProgressColor(dailyProgress)
              )}
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          {isDailyGoalMet && (
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Daily goal achieved!
            </p>
          )}
        </div>

        {/* Weekly Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className={cn(
              'font-medium',
              isWeeklyGoalMet ? 'text-emerald-500' : 'text-foreground'
            )}>
              {weeklyCompleted} / {weeklyTarget} pomodoros
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                getProgressColor(weeklyProgress)
              )}
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className={cn(
              'p-2 rounded-full',
              currentStreak > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'
            )}>
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-primary/20 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
          </div>
        </div>

        {/* Streak Celebration Milestones */}
        {currentStreak > 0 && currentStreak % 7 === 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-sm text-center">
              🔥 <span className="font-medium">{currentStreak} day streak!</span> You're on fire!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
