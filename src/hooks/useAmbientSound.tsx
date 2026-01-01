import { useCallback, useRef, useState } from 'react';

// Ambient sound URLs - using free sound libraries
const AMBIENT_SOUNDS = {
  rain: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c0c3bcd6d4.mp3',
  forest: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1baf.mp3',
  ocean: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc79c2b.mp3',
  cafe: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630674c4.mp3',
  fireplace: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_313f5765a9.mp3',
};

// White/brown noise generated as simple oscillator-based sounds
const NOISE_SOUNDS = {
  white_noise: 'white',
  brown_noise: 'brown',
  pink_noise: 'pink',
};

export type AmbientSoundType = keyof typeof AMBIENT_SOUNDS;
export type NoiseSoundType = keyof typeof NOISE_SOUNDS;
export type AllAmbientType = AmbientSoundType | NoiseSoundType;

export const AMBIENT_OPTIONS: { value: AllAmbientType; label: string; icon: string }[] = [
  { value: 'rain', label: 'Rain', icon: '🌧️' },
  { value: 'forest', label: 'Forest', icon: '🌲' },
  { value: 'ocean', label: 'Ocean Waves', icon: '🌊' },
  { value: 'cafe', label: 'Café', icon: '☕' },
  { value: 'fireplace', label: 'Fireplace', icon: '🔥' },
  { value: 'white_noise', label: 'White Noise', icon: '📻' },
  { value: 'brown_noise', label: 'Brown Noise', icon: '🎚️' },
  { value: 'pink_noise', label: 'Pink Noise', icon: '🎛️' },
];

export function useAmbientSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<AllAmbientType | null>(null);
  const [volume, setVolume] = useState(0.3);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSound(null);
  }, []);

  const createNoiseBuffer = useCallback((type: string, audioContext: AudioContext) => {
    const bufferSize = audioContext.sampleRate * 2; // 2 seconds
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      if (type === 'white') {
        output[i] = white * 0.5;
      } else if (type === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else if (type === 'pink') {
        // Simple pink noise approximation
        output[i] = (white + lastOut * 0.5) * 0.5;
        lastOut = output[i];
      }
    }

    return buffer;
  }, []);

  const playSound = useCallback((soundType: AllAmbientType) => {
    stopSound();

    if (soundType in NOISE_SOUNDS) {
      // Generate noise using Web Audio API
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const noiseType = NOISE_SOUNDS[soundType as NoiseSoundType];
      const buffer = createNoiseBuffer(noiseType, audioContext);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start();
      noiseNodeRef.current = source;
    } else {
      // Play ambient sound file
      const audio = new Audio(AMBIENT_SOUNDS[soundType as AmbientSoundType]);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;
      
      audio.play().catch((err) => {
        console.log('Ambient sound play failed:', err);
      });
    }

    setIsPlaying(true);
    setCurrentSound(soundType);
  }, [stopSound, createNoiseBuffer, volume]);

  const toggleSound = useCallback((soundType: AllAmbientType) => {
    if (isPlaying && currentSound === soundType) {
      stopSound();
    } else {
      playSound(soundType);
    }
  }, [isPlaying, currentSound, stopSound, playSound]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  }, []);

  return {
    playSound,
    stopSound,
    toggleSound,
    isPlaying,
    currentSound,
    volume,
    updateVolume,
  };
}
