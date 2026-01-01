import { useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapData {
  date: string;
  count: number;
}

interface ProductivityHeatmapProps {
  data: HeatmapData[];
  weeks?: number;
}

export function ProductivityHeatmap({ data, weeks = 12 }: ProductivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
    const cells: { date: Date; count: number }[][] = [];

    // Create grid structure (7 rows for days, columns for weeks)
    for (let week = 0; week <= weeks; week++) {
      const weekCells: { date: Date; count: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const cellDate = addDays(startDate, week * 7 + day);
        if (cellDate > today) continue;
        
        const dateStr = format(cellDate, 'yyyy-MM-dd');
        const dayData = data.find(d => d.date === dateStr);
        weekCells.push({
          date: cellDate,
          count: dayData?.count ?? 0,
        });
      }
      if (weekCells.length > 0) {
        cells.push(weekCells);
      }
    }

    return cells;
  }, [data, weeks]);

  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 text-xs text-muted-foreground">
          {dayLabels.map((label, i) => (
            <div key={label} className="h-3 flex items-center" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 overflow-x-auto">
          <TooltipProvider delayDuration={100}>
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const cell = week.find(c => getDay(c.date) === dayIndex);
                  if (!cell) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }

                  const intensity = getIntensity(cell.count);

                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'w-3 h-3 rounded-sm transition-colors cursor-pointer',
                            intensity === 0 && 'bg-muted/30',
                            intensity === 1 && 'bg-primary/20',
                            intensity === 2 && 'bg-primary/40',
                            intensity === 3 && 'bg-primary/60',
                            intensity === 4 && 'bg-primary/90'
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{format(cell.date, 'MMM d, yyyy')}</p>
                        <p>{cell.count} pomodoro{cell.count !== 1 ? 's' : ''}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary/90" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
