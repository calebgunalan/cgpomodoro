import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PomodoroTimer } from '@/components/timer/PomodoroTimer';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { SessionHistory } from '@/components/history/SessionHistory';
import { AchievementsList } from '@/components/achievements/AchievementsList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Timer, BarChart3, History, Settings, LogOut, Trophy, Brain, Link2, Users, Keyboard } from 'lucide-react';
import { AIInsightsPanel } from '@/components/insights/AIInsightsPanel';
import { IntegrationsPanel } from '@/components/integrations/IntegrationsPanel';
import { TeamWorkspacePanel } from '@/components/team/TeamWorkspacePanel';
import { KeyboardShortcutsModal } from '@/components/help/KeyboardShortcutsModal';
import { TabBadge } from '@/components/ui/tab-badge';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTasks } from '@/hooks/useTasks';
import { useAIInsights } from '@/hooks/useAIInsights';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();
  
  const { tasks } = useTasks();
  const { insights } = useAIInsights();
  
  // Calculate badge counts
  const pendingTasksCount = tasks.filter(t => t.completed_pomodoros < (t.estimated_pomodoros || 1)).length;
  const hasNewInsights = insights ? 1 : 0;

  const tabs = ['timer', 'analytics', 'history', 'achievements', 'insights', 'integrations', 'team'];
  
  useKeyboardShortcuts({
    on1: () => setActiveTab('timer'),
    on2: () => setActiveTab('analytics'),
    on3: () => setActiveTab('history'),
    on4: () => setActiveTab('achievements'),
    on5: () => setActiveTab('insights'),
    on6: () => setActiveTab('integrations'),
    on7: () => setActiveTab('team'),
    onBracketLeft: () => {
      const idx = tabs.indexOf(activeTab);
      setActiveTab(tabs[idx > 0 ? idx - 1 : tabs.length - 1]);
    },
    onBracketRight: () => {
      const idx = tabs.indexOf(activeTab);
      setActiveTab(tabs[(idx + 1) % tabs.length]);
    },
    onQuestionMark: () => setShowShortcuts(true),
    enabled: true,
  });

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="dark min-h-screen bg-background">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Pomodoro</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-7">
            <TabsTrigger value="timer" className="gap-1.5 relative">
              <Timer className="w-4 h-4" />
              <span className="hidden md:inline">Timer</span>
              <TabBadge count={pendingTasksCount} />
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5">
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 relative">
              <Brain className="w-4 h-4" />
              <span className="hidden md:inline">Insights</span>
              <TabBadge count={hasNewInsights} variant="success" />
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5">
              <Link2 className="w-4 h-4" />
              <span className="hidden md:inline">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="mt-0">
            <div className="flex justify-center py-8">
              <PomodoroTimer />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <SessionHistory />
          </TabsContent>

          <TabsContent value="achievements" className="mt-0">
            <AchievementsList />
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <AIInsightsPanel />
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <IntegrationsPanel />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <TeamWorkspacePanel />
          </TabsContent>
        </Tabs>
      </main>
      
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
};

export default Index;
