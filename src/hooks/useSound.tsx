import { useCallback, useRef } from 'react';

// Sound data URLs (base64 encoded short sounds)
const SOUNDS = {
  bell: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoIDH+n0+2jdRQAAISq0u2jfBEAAIat1O2gdQ8AAIey1u6dcQwAAIu21+6abQkAAI+72e+WaQYAAJS/2/CSZQMAAJnE3fGOYAAAAJ7I3/KKXf4AAKPMx9eFWfwAAKjQyt2BVfoAAK3U0d18UvgAALLYtNl4TvYAALfc0tx0SvQAALzgvtlwRvIAAMHkztxsQvAAAMboz9poP+4AAMvs1dxkO+wAAM/w2d9gN+oAANP03OJcM+gAANj429xYL+YAAN394N5TLOMAAN7/4uBQKOEAAOP/5OJMJd8AAPcA5+RII94AAPsA6eZEId0AAPsA7OhBHtwAAP4A7upAHNsAAP0A8ew+GtkAAP8A8u49GdgAAP8A9O89F9cAAAEB9vA8FtYAAAEB+PEvFNUAAAEC+vIuE9QAAAIDx/QsEdMAAAQE/vYqENIAAAUF//gpD9EAAAYGAPooDs8AAAcHAfsoDc4AAAgIAvsnDM0AAAkJA/wmC8wAAAoKBP0lCssAAAsLBf4kCcoAAAwMBv8jCMkAAA0NBwAiB8gAAA4OCAEhBscAAA8PCAIgBcYAABAQCQMfBMUAABEQCgQeBMQAABIRCwUdA8MAABMSCwYcAsIAABQTDAcbAcEAABUUDQgaAcAAABYVDgkZAL8AABcWDwoYAL4AABcWEAsXAL0AABgXEQwWALwAABkYEg0VALsAABoZEw4UALoAABsaFAAT',
  chime: 'data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YTYGAAB+g4eMkJSYnKCjpqmrrq+xs7S1t7i5ubq6u7y8vb29vr6+v8DAwMDBwcHCwsLDw8TExMTFxcXGxsbGx8fHyMjIyMnJycrKysrLy8vMzMzMzc3Nzs7Ozs/Pz9DQ0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8AAAEAAQABAAIAAQACAAIAAQABAAIAAQABAAIAAQABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIAAAABAAIA',
  digital: 'data:audio/wav;base64,UklGRq4EAABXQVZFZm10IBAAAAABAAEAIlYAAECcAAABAAgAZGF0YYoEAAD//wAA//8AAP7/AQD+/wAA/v8BAP3/AQD9/wEA/P8CAP3/AQD8/wIA+/8CAPv/AgD6/wMA+v8DAPn/AwD4/wQA+P8EAPf/BAD2/wUA9v8FAPb/BQD1/wYA9P8GAPT/BgDz/wYA8/8GAPP/BgDy/wcA8v8HAPH/BwDx/wcA8P8IAPD/CADv/wgA7/8JAO7/CQDu/wkA7v8JAO3/CgDt/woA7P8KAOz/CgDs/woA6/8LAOv/CwDr/wsA6v8LAOr/DADq/wwA6f8MAOn/DADp/wwA6P8NAOj/DQDo/w0A5/8NAOf/DgDn/w4A5v8OAOb/DgDm/w4A5v8OAOb/DwDl/w8A5f8PAOX/DwDl/w8A5f8PAOT/EADk/xAA5P8QAOT/EADk/xAA5P8QAOP/EQDj/xEA4/8RAOP/EQDj/xEA4/8RAOP/EQDj/xEA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA4v8SAOL/EgDi/xIA',
  gentle: 'data:audio/wav;base64,UklGRq4CAABXQVZFZm10IBAAAAABAAEAIlYAACJWAAABAAgAZGF0YYoCAACAgoSGiIqMjpCSk5WXmJqbnZ6foaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/',
};

export type SoundType = keyof typeof SOUNDS;

export const SOUND_OPTIONS: { value: SoundType; label: string }[] = [
  { value: 'bell', label: 'Bell' },
  { value: 'chime', label: 'Chime' },
  { value: 'digital', label: 'Digital' },
  { value: 'gentle', label: 'Gentle' },
];

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundType: SoundType = 'bell') => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(SOUNDS[soundType] || SOUNDS.bell);
      audio.volume = 0.7;
      audioRef.current = audio;
      
      audio.play().catch((err) => {
        console.log('Audio play failed:', err);
      });
    } catch (err) {
      console.log('Sound error:', err);
    }
  }, []);

  const previewSound = useCallback((soundType: SoundType) => {
    playSound(soundType);
  }, [playSound]);

  return {
    playSound,
    previewSound,
  };
}
