import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
  day: string;
  date: string;
  pomodoros: number;
  minutes: number;
}

interface FocusChartProps {
  weeklyData: ChartData[];
  monthlyData: ChartData[];
}

export function FocusChart({ weeklyData, monthlyData }: FocusChartProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const data = view === 'weekly' ? weeklyData : monthlyData;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Focus Time</CardTitle>
        <Tabs value={view} onValueChange={(v) => setView(v as 'weekly' | 'monthly')}>
          <TabsList className="h-8">
            <TabsTrigger value="weekly" className="text-xs px-3">Week</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs px-3">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                interval={view === 'monthly' ? 6 : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--secondary))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value} pomodoros`, 'Completed']}
              />
              <Bar 
                dataKey="pomodoros" 
                radius={[4, 4, 0, 0]}
                maxBarSize={view === 'weekly' ? 40 : 12}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.pomodoros > 0 ? 'hsl(262, 83%, 58%)' : 'hsl(var(--secondary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}