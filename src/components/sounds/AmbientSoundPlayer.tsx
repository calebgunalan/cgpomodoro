import { useAmbientSound, AMBIENT_OPTIONS, AllAmbientType } from '@/hooks/useAmbientSound';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react';

interface AmbientSoundPlayerProps {
  compact?: boolean;
}

export function AmbientSoundPlayer({ compact = false }: AmbientSoundPlayerProps) {
  const { toggleSound, stopSound, isPlaying, currentSound, volume, updateVolume } = useAmbientSound();

  const currentOption = AMBIENT_OPTIONS.find(o => o.value === currentSound);

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isPlaying ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">{currentOption?.icon}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Sounds</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <AmbientSoundContent
            isPlaying={isPlaying}
            currentSound={currentSound}
            volume={volume}
            onToggle={toggleSound}
            onStop={stopSound}
            onVolumeChange={updateVolume}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="w-full">
      <AmbientSoundContent
        isPlaying={isPlaying}
        currentSound={currentSound}
        volume={volume}
        onToggle={toggleSound}
        onStop={stopSound}
        onVolumeChange={updateVolume}
      />
    </div>
  );
}

interface AmbientSoundContentProps {
  isPlaying: boolean;
  currentSound: AllAmbientType | null;
  volume: number;
  onToggle: (sound: AllAmbientType) => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
}

function AmbientSoundContent({
  isPlaying,
  currentSound,
  volume,
  onToggle,
  onStop,
  onVolumeChange,
}: AmbientSoundContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Ambient Sounds</h4>
        {isPlaying && (
          <Button variant="ghost" size="sm" onClick={onStop}>
            Stop
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {AMBIENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onToggle(option.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
              'hover:bg-secondary/50',
              currentSound === option.value && isPlaying
                ? 'bg-primary/20 ring-1 ring-primary'
                : 'bg-secondary/30'
            )}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {isPlaying && (
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            max={100}
            step={5}
            className="flex-1"
          />
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
