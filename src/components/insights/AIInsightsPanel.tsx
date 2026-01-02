import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIInsights } from '@/hooks/useAIInsights';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Zap,
  Target,
  Lightbulb,
  RefreshCw,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { format } from 'date-fns';

export function AIInsightsPanel() {
  const { insights, loading, lastGenerated, generateInsights } = useAIInsights();

  const getTrendIcon = () => {
    switch (insights?.weeklyTrend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEnergyIcon = () => {
    switch (insights?.energyPattern) {
      case 'morning':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'afternoon':
        return <Sunset className="h-4 w-4 text-orange-500" />;
      case 'evening':
        return <Moon className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Productivity Insights</h2>
        </div>
        <div className="flex items-center gap-4">
          {lastGenerated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {format(lastGenerated, 'MMM d, h:mm a')}
            </span>
          )}
          <Button onClick={generateInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </div>
      </div>

      {!insights && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No insights yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Generate Insights" to analyze your productivity patterns
            </p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Productivity Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Productivity Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-4xl font-bold ${getScoreColor(insights.productivityScore)}`}>
                  {insights.productivityScore}
                </span>
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className="text-sm capitalize">{insights.weeklyTrend}</span>
                </div>
              </div>
              <Progress value={insights.productivityScore} className="h-2" />
            </CardContent>
          </Card>

          {/* Energy Pattern */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Energy Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getEnergyIcon()}
                <span className="text-2xl font-semibold capitalize">
                  {insights.energyPattern} Person
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You're most productive in the {insights.energyPattern}
              </p>
            </CardContent>
          </Card>

          {/* Optimal Focus Times */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Optimal Focus Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.optimalFocusTimes.slice(0, 3).map((time, i) => (
                  <Badge key={i} variant="secondary" className="mr-2">
                    {time}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {insights.keyInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {i + 1}
                    </div>
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Raw Stats */}
          {insights.rawStats && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Stats (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {insights.rawStats.totalSessions}
                    </div>
                    <div className="text-xs text-muted-foreground">Focus Sessions</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(insights.rawStats.totalMinutes / 60)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Focus Time</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {insights.rawStats.goalCompletionRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Goals Met</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {insights.rawStats.productiveDays[0] || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Best Day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
