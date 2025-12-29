import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCards } from './StatsCards';
import { FocusChart } from './FocusChart';
import { TaskBreakdownChart } from './TaskBreakdownChart';

export function AnalyticsDashboard() {
  const { streak, todayStats, weeklyData, monthlyData, taskBreakdown, loading } = useAnalytics();

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

      <div className="grid lg:grid-cols-2 gap-4">
        <FocusChart weeklyData={weeklyData} monthlyData={monthlyData} />
        <TaskBreakdownChart data={taskBreakdown} />
      </div>
    </div>
  );
}