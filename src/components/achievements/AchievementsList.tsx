import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AchievementsList() {
  const { achievements, loading } = useAchievements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading achievements...</div>
      </div>
    );
  }

  const unlockedIds = new Set(achievements.map(a => a.achievement_type));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Achievements</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {achievements.length} of {ACHIEVEMENT_DEFINITIONS.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACHIEVEMENT_DEFINITIONS.map((def) => {
          const isUnlocked = unlockedIds.has(def.id);
          const achievement = achievements.find(a => a.achievement_type === def.id);

          return (
            <Card
              key={def.id}
              className={cn(
                'relative overflow-hidden transition-all',
                isUnlocked
                  ? 'bg-primary/10 border-primary/30'
                  : 'opacity-50 grayscale'
              )}
            >
              <CardHeader className="pb-2">
                <div className="text-4xl mb-2">{def.icon}</div>
                <CardTitle className="text-sm">{def.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{def.description}</p>
                {isUnlocked && achievement && (
                  <p className="text-xs text-primary mt-2">
                    Unlocked {new Date(achievement.achieved_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <span className="text-2xl">🔒</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
