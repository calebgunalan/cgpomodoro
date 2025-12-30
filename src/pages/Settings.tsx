import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useSound, SOUND_OPTIONS, SoundType } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { previewSound } = useSound();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    daily_goal: 8,
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sound_enabled: true,
    sound_type: 'bell',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        daily_goal: settings.daily_goal,
        work_duration: settings.work_duration,
        short_break_duration: settings.short_break_duration,
        long_break_duration: settings.long_break_duration,
        sound_enabled: settings.sound_enabled,
        sound_type: settings.sound_type,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(formData);
    setSaving(false);

    if (success) {
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || settingsLoading) {
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
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Goal</CardTitle>
            <CardDescription>Set your target number of Pomodoros per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="daily_goal" className="min-w-32">Target Pomodoros</Label>
              <Input
                id="daily_goal"
                type="number"
                min={1}
                max={20}
                value={formData.daily_goal}
                onChange={(e) => setFormData({ ...formData, daily_goal: parseInt(e.target.value) || 8 })}
                className="w-24"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timer Durations</CardTitle>
            <CardDescription>Customize work and break periods (in minutes)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="work_duration" className="min-w-32">Work Duration</Label>
              <Input
                id="work_duration"
                type="number"
                min={5}
                max={120}
                value={formData.work_duration}
                onChange={(e) => setFormData({ ...formData, work_duration: parseInt(e.target.value) || 25 })}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">minutes</span>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="short_break_duration" className="min-w-32">Short Break</Label>
              <Input
                id="short_break_duration"
                type="number"
                min={1}
                max={30}
                value={formData.short_break_duration}
                onChange={(e) => setFormData({ ...formData, short_break_duration: parseInt(e.target.value) || 5 })}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">minutes</span>
            </div>
            <div className="flex items-center gap-4">
              <Label htmlFor="long_break_duration" className="min-w-32">Long Break</Label>
              <Input
                id="long_break_duration"
                type="number"
                min={5}
                max={60}
                value={formData.long_break_duration}
                onChange={(e) => setFormData({ ...formData, long_break_duration: parseInt(e.target.value) || 15 })}
                className="w-24"
              />
              <span className="text-muted-foreground text-sm">minutes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sound Notifications</CardTitle>
            <CardDescription>Configure audio alerts when timer completes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound_enabled">Enable Sound</Label>
              <Switch
                id="sound_enabled"
                checked={formData.sound_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, sound_enabled: checked })}
              />
            </div>
            {formData.sound_enabled && (
              <div className="flex items-center gap-4">
                <Label className="min-w-32">Alert Sound</Label>
                <Select
                  value={formData.sound_type}
                  onValueChange={(value) => setFormData({ ...formData, sound_type: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => previewSound(formData.sound_type as SoundType)}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>Quick controls for the timer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start/Pause Timer</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reset Timer</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">R</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skip Session</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">S</kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </main>
    </div>
  );
};

export default Settings;
