import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface AIInsights {
  optimalFocusTimes: string[];
  productivityScore: number;
  weeklyTrend: 'improving' | 'stable' | 'declining';
  keyInsights: string[];
  recommendations: string[];
  energyPattern: 'morning' | 'afternoon' | 'evening' | 'mixed';
  estimationAccuracy: 'good' | 'needs_improvement' | 'insufficient_data';
  rawStats?: {
    totalSessions: number;
    totalMinutes: number;
    goalCompletionRate: number;
    peakHours: number[];
    productiveDays: string[];
  };
}

export function useAIInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Load cached insights
  useEffect(() => {
    if (user) {
      loadCachedInsights();
    }
  }, [user]);

  const loadCachedInsights = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setInsights(data.insights as unknown as AIInsights);
      setLastGenerated(new Date(data.generated_at));
    }
  };

  const generateInsights = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('analyze-productivity', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate insights');
      }

      setInsights(response.data);
      setLastGenerated(new Date());
      
      toast({
        title: "Insights Generated",
        description: "Your productivity analysis is ready!",
      });
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    insights,
    loading,
    lastGenerated,
    generateInsights,
    refetch: loadCachedInsights,
  };
}
