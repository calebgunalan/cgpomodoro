import { useState, useCallback, useEffect, useRef } from 'react';

export interface BreakActivity {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  icon: string;
  category: 'stretch' | 'breathing' | 'meditation' | 'movement' | 'eyes';
  steps?: string[];
}

export const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    id: 'deep_breathing',
    name: 'Deep Breathing',
    description: 'Calm your mind with 4-7-8 breathing technique',
    duration: 60,
    icon: '🌬️',
    category: 'breathing',
    steps: [
      'Breathe in through your nose for 4 seconds',
      'Hold your breath for 7 seconds',
      'Exhale slowly through your mouth for 8 seconds',
      'Repeat 3-4 times',
    ],
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for focus and calm',
    duration: 90,
    icon: '📦',
    category: 'breathing',
    steps: [
      'Breathe in for 4 seconds',
      'Hold for 4 seconds',
      'Breathe out for 4 seconds',
      'Hold for 4 seconds',
      'Repeat 4-5 times',
    ],
  },
  {
    id: 'neck_stretches',
    name: 'Neck Stretches',
    description: 'Release tension in your neck and shoulders',
    duration: 45,
    icon: '🧘',
    category: 'stretch',
    steps: [
      'Slowly tilt your head to the right, hold 10 seconds',
      'Return to center, then tilt left, hold 10 seconds',
      'Look up gently, hold 5 seconds',
      'Look down gently, hold 5 seconds',
      'Roll your shoulders back 5 times',
    ],
  },
  {
    id: 'wrist_stretches',
    name: 'Wrist & Hand Stretches',
    description: 'Relief for typing fatigue',
    duration: 30,
    icon: '🤲',
    category: 'stretch',
    steps: [
      'Extend your arm, palm up, gently pull fingers back',
      'Hold for 10 seconds, switch hands',
      'Make fists and rotate wrists 10 times each direction',
      'Spread fingers wide, hold 5 seconds',
    ],
  },
  {
    id: 'eye_relief',
    name: '20-20-20 Eye Relief',
    description: 'Rest your eyes from screen fatigue',
    duration: 20,
    icon: '👁️',
    category: 'eyes',
    steps: [
      'Look at something 20 feet away',
      'Focus on it for 20 seconds',
      'Blink 20 times slowly',
      'Close your eyes and relax',
    ],
  },
  {
    id: 'desk_yoga',
    name: 'Desk Yoga',
    description: 'Simple stretches you can do at your desk',
    duration: 120,
    icon: '🧘‍♀️',
    category: 'stretch',
    steps: [
      'Seated twist: turn torso right, hold chair, 15 seconds each side',
      'Seated forward fold: reach for toes, 15 seconds',
      'Cat-cow stretches while seated, 5 rounds',
      'Shoulder shrugs: lift, hold 5 sec, release, repeat 5 times',
    ],
  },
  {
    id: 'quick_walk',
    name: 'Quick Walk',
    description: 'Get your blood flowing with a short walk',
    duration: 180,
    icon: '🚶',
    category: 'movement',
    steps: [
      'Stand up and shake out your limbs',
      'Walk around your space or outside',
      'Focus on deep breaths while walking',
      'Return feeling refreshed',
    ],
  },
  {
    id: 'mini_meditation',
    name: 'Mini Meditation',
    description: 'A quick mindfulness reset',
    duration: 90,
    icon: '🧘‍♂️',
    category: 'meditation',
    steps: [
      'Close your eyes and sit comfortably',
      'Focus on your breath - just observe',
      'When thoughts arise, gently return to breath',
      'Feel your body relax with each exhale',
      'Slowly open your eyes when ready',
    ],
  },
];

export function useBreakSuggestions() {
  const [currentActivity, setCurrentActivity] = useState<BreakActivity | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const getSuggestedActivities = useCallback((sessionCount: number, breakType: 'short' | 'long') => {
    // Suggest based on break type and session count
    if (breakType === 'long') {
      return BREAK_ACTIVITIES.filter(a => 
        a.category === 'meditation' || a.category === 'movement' || a.duration > 60
      );
    }
    
    // For short breaks, rotate through quick activities
    const quickActivities = BREAK_ACTIVITIES.filter(a => a.duration <= 60);
    const index = sessionCount % quickActivities.length;
    return [quickActivities[index], ...quickActivities.filter((_, i) => i !== index)];
  }, []);

  const startActivity = useCallback((activity: BreakActivity) => {
    setCurrentActivity(activity);
    setTimeRemaining(activity.duration);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const stopActivity = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setCurrentActivity(null);
    setTimeRemaining(0);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentActivity?.steps && currentStep < currentActivity.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentActivity, currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopActivity();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, stopActivity]);

  return {
    activities: BREAK_ACTIVITIES,
    getSuggestedActivities,
    currentActivity,
    isActive,
    timeRemaining,
    currentStep,
    startActivity,
    stopActivity,
    nextStep,
    previousStep,
  };
}
