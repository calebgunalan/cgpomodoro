import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCards } from './StatsCards';
import { FocusChart } from './FocusChart';
import { TaskBreakdownChart } from './TaskBreakdownChart';
import { ProductivityHeatmap } from './ProductivityHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function AnalyticsDashboard() {
  const { streak, todayStats, weeklyData, monthlyData, taskBreakdown, heatmapData, loading } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-secondary/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsCards
        streak={streak}
        todayCompleted={todayStats.completed}
        todayTarget={todayStats.target}
        todayMinutes={todayStats.focusMinutes}
      />

      {/* Productivity Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Productivity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductivityHeatmap data={heatmapData} weeks={12} />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <FocusChart weeklyData={weeklyData} monthlyData={monthlyData} />
        <TaskBreakdownChart data={taskBreakdown} />
      </div>
    </div>
  );
}