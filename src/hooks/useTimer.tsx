import { useState, useEffect, useCallback, useRef } from 'react';

export type SessionType = 'work' | 'short_break' | 'long_break';

interface TimerConfig {
  work: number;
  short_break: number;
  long_break: number;
}

const DEFAULT_CONFIG: TimerConfig = {
  work: 25,
  short_break: 5,
  long_break: 15,
};

interface UseTimerOptions {
  config?: TimerConfig;
  onComplete?: (type: SessionType, duration: number) => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { config = DEFAULT_CONFIG, onComplete } = options;
  
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(config.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
    // Reset timer with new duration if not running
    if (!isRunning) {
      setTimeLeft(config[sessionType] * 60);
    }
  }, [config, sessionType, isRunning]);

  const totalTime = config[sessionType] * 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    
    const duration = configRef.current[sessionType];
    onComplete?.(sessionType, duration);

    if (sessionType === 'work') {
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);
      
      if (newCount % 4 === 0) {
        setSessionType('long_break');
        setTimeLeft(configRef.current.long_break * 60);
      } else {
        setSessionType('short_break');
        setTimeLeft(configRef.current.short_break * 60);
      }
    } else {
      setSessionType('work');
      setTimeLeft(configRef.current.work * 60);
    }
  }, [clearTimer, onComplete, pomodorosCompleted, sessionType]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return clearTimer;
  }, [isRunning, clearTimer, handleComplete, timeLeft]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(configRef.current[sessionType] * 60);
  }, [clearTimer, sessionType]);

  const skip = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    
    if (sessionType === 'work') {
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);
      if (newCount % 4 === 0) {
        setSessionType('long_break');
        setTimeLeft(configRef.current.long_break * 60);
      } else {
        setSessionType('short_break');
        setTimeLeft(configRef.current.short_break * 60);
      }
    } else {
      setSessionType('work');
      setTimeLeft(configRef.current.work * 60);
    }
  }, [clearTimer, pomodorosCompleted, sessionType]);

  const switchSession = useCallback((type: SessionType) => {
    clearTimer();
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(configRef.current[type] * 60);
  }, [clearTimer]);

  const toggleRunning = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  return {
    timeLeft,
    totalTime,
    isRunning,
    sessionType,
    pomodorosCompleted,
    start,
    pause,
    reset,
    skip,
    switchSession,
    toggleRunning,
  };
}
