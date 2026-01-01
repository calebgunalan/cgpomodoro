import { useState } from 'react';
import { useBreakSuggestions, BreakActivity } from '@/hooks/useBreakSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

interface BreakSuggestionsProps {
  breakType: 'short' | 'long';
  sessionCount: number;
  onClose?: () => void;
}

export function BreakSuggestions({ breakType, sessionCount, onClose }: BreakSuggestionsProps) {
  const {
    getSuggestedActivities,
    currentActivity,
    isActive,
    timeRemaining,
    currentStep,
    startActivity,
    stopActivity,
    nextStep,
    previousStep,
  } = useBreakSuggestions();

  const suggestedActivities = getSuggestedActivities(sessionCount, breakType);

  if (isActive && currentActivity) {
    const progress = ((currentActivity.duration - timeRemaining) / currentActivity.duration) * 100;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>{currentActivity.icon}</span>
              {currentActivity.name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={stopActivity}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-light tabular-nums">
              {minutes}:{String(seconds).padStart(2, '0')}
            </div>
            <Progress value={progress} className="mt-2" />
          </div>

          {currentActivity.steps && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Step {currentStep + 1} of {currentActivity.steps.length}</span>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center">
                <p>{currentActivity.steps[currentStep]}</p>
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextStep}
                  disabled={currentStep === currentActivity.steps.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={stopActivity} className="w-full">
            End Activity
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {breakType === 'long' ? 'Long Break Activities' : 'Quick Break Ideas'}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestedActivities.slice(0, 4).map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onStart={() => startActivity(activity)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity, onStart }: { activity: BreakActivity; onStart: () => void }) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  return (
    <button
      onClick={onStart}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg',
        'bg-secondary/30 hover:bg-secondary/50 transition-colors',
        'text-left'
      )}
    >
      <span className="text-2xl">{activity.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{activity.name}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{formatDuration(activity.duration)}</span>
        <Play className="w-4 h-4 text-primary" />
      </div>
    </button>
  );
}
