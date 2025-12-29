import { Flame, Target, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
  streak: number;
  todayCompleted: number;
  todayTarget: number;
  todayMinutes: number;
}

export function StatsCards({ streak, todayCompleted, todayTarget, todayMinutes }: StatsCardsProps) {
  const progress = Math.min((todayCompleted / todayTarget) * 100, 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {todayCompleted}<span className="text-muted-foreground text-lg">/{todayTarget}</span>
              </p>
              <p className="text-xs text-muted-foreground">Today's Goal</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{todayMinutes}</p>
              <p className="text-xs text-muted-foreground">Focus Minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-timer-long-break/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-timer-long-break" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {progress >= 100 ? '✓' : `${Math.round(progress)}%`}
              </p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}