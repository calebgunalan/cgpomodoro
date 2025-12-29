import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TaskData {
  name: string;
  color: string;
  minutes: number;
  count: number;
}

interface TaskBreakdownChartProps {
  data: TaskData[];
}

export function TaskBreakdownChart({ data }: TaskBreakdownChartProps) {
  const totalMinutes = data.reduce((acc, d) => acc + d.minutes, 0);

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Task Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Complete some pomodoros to see your task breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Task Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="minutes"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} min (${Math.round((value / totalMinutes) * 100)}%)`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.slice(0, 5).map((task) => (
              <div key={task.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                />
                <span className="text-sm truncate flex-1">{task.name}</span>
                <span className="text-xs text-muted-foreground">
                  {task.count} × {task.minutes / task.count}m
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}