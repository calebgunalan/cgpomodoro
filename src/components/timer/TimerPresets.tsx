import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Zap, Coffee, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimerPreset {
  id: string;
  name: string;
  work: number;
  shortBreak: number;
  longBreak: number;
  icon: 'classic' | 'extended' | 'sprint' | 'custom';
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'classic', name: 'Classic', work: 25, shortBreak: 5, longBreak: 15, icon: 'classic' },
  { id: 'extended', name: 'Extended', work: 50, shortBreak: 10, longBreak: 30, icon: 'extended' },
  { id: 'sprint', name: 'Sprint', work: 90, shortBreak: 20, longBreak: 45, icon: 'sprint' },
];

interface TimerPresetsProps {
  currentPreset: TimerPreset | null;
  onSelectPreset: (preset: TimerPreset) => void;
  customPresets?: TimerPreset[];
  onSaveCustomPreset?: (preset: Omit<TimerPreset, 'id'>) => void;
}

const PresetIcon = ({ type }: { type: TimerPreset['icon'] }) => {
  switch (type) {
    case 'classic':
      return <Clock className="w-5 h-5" />;
    case 'extended':
      return <Coffee className="w-5 h-5" />;
    case 'sprint':
      return <Zap className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export function TimerPresets({ 
  currentPreset, 
  onSelectPreset, 
  customPresets = [],
  onSaveCustomPreset 
}: TimerPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWork, setCustomWork] = useState(25);
  const [customShortBreak, setCustomShortBreak] = useState(5);
  const [customLongBreak, setCustomLongBreak] = useState(15);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const handleSaveCustom = () => {
    if (!customName.trim()) return;
    
    onSaveCustomPreset?.({
      name: customName,
      work: customWork,
      shortBreak: customShortBreak,
      longBreak: customLongBreak,
      icon: 'custom',
    });
    
    setIsOpen(false);
    setCustomName('');
    setCustomWork(25);
    setCustomShortBreak(5);
    setCustomLongBreak(15);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Timer Presets</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
              <Plus className="w-3 h-3" />
              Custom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="My Custom Preset"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work-duration">Work (min)</Label>
                  <Input
                    id="work-duration"
                    type="number"
                    min={1}
                    max={120}
                    value={customWork}
                    onChange={(e) => setCustomWork(parseInt(e.target.value) || 25)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="short-break">Short Break</Label>
                  <Input
                    id="short-break"
                    type="number"
                    min={1}
                    max={60}
                    value={customShortBreak}
                    onChange={(e) => setCustomShortBreak(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long-break">Long Break</Label>
                  <Input
                    id="long-break"
                    type="number"
                    min={1}
                    max={60}
                    value={customLongBreak}
                    onChange={(e) => setCustomLongBreak(parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveCustom} className="w-full">
                Save Preset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {allPresets.map((preset) => {
          const isActive = currentPreset?.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={cn(
                'relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground'
              )}
            >
              {isActive && (
                <Check className="absolute top-1 right-1 w-3 h-3 text-primary" />
              )}
              <PresetIcon type={preset.icon} />
              <span className="text-xs font-medium">{preset.name}</span>
              <span className="text-[10px] opacity-70">
                {preset.work}/{preset.shortBreak}/{preset.longBreak}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
