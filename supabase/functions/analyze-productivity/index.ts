import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Fetch user's session data for analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sessionsRes, tasksRes, goalsRes] = await Promise.all([
      supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    ]);

    const sessions = sessionsRes.data || [];
    const tasks = tasksRes.data || [];
    const goals = goalsRes.data || [];

    // Prepare data summary for AI
    const hourlyDistribution: Record<number, number> = {};
    const dayOfWeekDistribution: Record<number, number> = {};
    let totalWorkSessions = 0;
    let totalFocusMinutes = 0;
    
    sessions.forEach((session: any) => {
      if (session.session_type === "work") {
        totalWorkSessions++;
        totalFocusMinutes += session.duration_minutes;
        
        const date = new Date(session.completed_at);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        dayOfWeekDistribution[dayOfWeek] = (dayOfWeekDistribution[dayOfWeek] || 0) + 1;
      }
    });

    // Find peak hours
    const peakHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Find most productive days
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const productiveDays = Object.entries(dayOfWeekDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([day]) => dayNames[parseInt(day)]);

    // Task estimation accuracy
    const tasksWithEstimates = tasks.filter((t: any) => t.estimated_pomodoros);
    const accuracyData = tasksWithEstimates.map((t: any) => ({
      name: t.name,
      estimated: t.estimated_pomodoros,
      actual: t.completed_pomodoros,
      accuracy: t.estimated_pomodoros > 0 
        ? Math.round((1 - Math.abs(t.completed_pomodoros - t.estimated_pomodoros) / t.estimated_pomodoros) * 100)
        : null
    }));

    // Goal completion rate
    const goalsWithTargets = goals.filter((g: any) => g.target_pomodoros > 0);
    const completedGoals = goalsWithTargets.filter((g: any) => g.completed_pomodoros >= g.target_pomodoros);
    const goalCompletionRate = goalsWithTargets.length > 0 
      ? Math.round((completedGoals.length / goalsWithTargets.length) * 100) 
      : 0;

    // Create prompt for AI analysis
    const prompt = `Analyze this Pomodoro productivity data and provide personalized insights:

DATA SUMMARY (Last 30 days):
- Total work sessions: ${totalWorkSessions}
- Total focus time: ${totalFocusMinutes} minutes (${Math.round(totalFocusMinutes / 60)} hours)
- Average sessions per day: ${Math.round(totalWorkSessions / 30 * 10) / 10}
- Peak productivity hours: ${peakHours.map(h => `${h}:00`).join(", ") || "Not enough data"}
- Most productive days: ${productiveDays.join(", ") || "Not enough data"}
- Daily goal completion rate: ${goalCompletionRate}%
- Tasks tracked: ${tasks.length}
- Tasks with estimates: ${tasksWithEstimates.length}

HOURLY DISTRIBUTION:
${Object.entries(hourlyDistribution).map(([h, c]) => `${h}:00 - ${c} sessions`).join("\n")}

Provide a JSON response with exactly this structure:
{
  "optimalFocusTimes": ["array of 3 recommended time slots like '9:00 AM - 11:00 AM'"],
  "productivityScore": number between 0-100,
  "weeklyTrend": "improving" | "stable" | "declining",
  "keyInsights": ["3-4 specific, actionable insights based on the data"],
  "recommendations": ["3-4 personalized recommendations to improve productivity"],
  "energyPattern": "morning" | "afternoon" | "evening" | "mixed",
  "estimationAccuracy": "good" | "needs_improvement" | "insufficient_data"
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a productivity analysis expert. Analyze the provided Pomodoro session data and return structured insights. Always respond with valid JSON only, no markdown or extra text."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let insights;
    
    try {
      const content = aiData.choices[0].message.content;
      // Clean up any markdown formatting
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      insights = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Provide fallback insights
      insights = {
        optimalFocusTimes: peakHours.length > 0 
          ? peakHours.map(h => `${h}:00 - ${h + 2}:00`) 
          : ["9:00 AM - 11:00 AM", "2:00 PM - 4:00 PM"],
        productivityScore: Math.min(100, Math.round((totalWorkSessions / 30) * 25)),
        weeklyTrend: "stable",
        keyInsights: [
          `You've completed ${totalWorkSessions} focus sessions in the last 30 days`,
          `Your total focus time is ${Math.round(totalFocusMinutes / 60)} hours`,
          `Daily goal completion rate: ${goalCompletionRate}%`
        ],
        recommendations: [
          "Try to maintain consistent daily focus sessions",
          "Set realistic daily goals based on your capacity",
          "Take regular breaks to maintain productivity"
        ],
        energyPattern: peakHours[0] < 12 ? "morning" : peakHours[0] < 17 ? "afternoon" : "evening",
        estimationAccuracy: tasksWithEstimates.length < 3 ? "insufficient_data" : "needs_improvement"
      };
    }

    // Add raw stats to insights
    insights.rawStats = {
      totalSessions: totalWorkSessions,
      totalMinutes: totalFocusMinutes,
      goalCompletionRate,
      peakHours,
      productiveDays
    };

    // Cache insights
    await supabase.from("ai_insights").upsert({
      user_id: user.id,
      insights,
      generated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in analyze-productivity:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
