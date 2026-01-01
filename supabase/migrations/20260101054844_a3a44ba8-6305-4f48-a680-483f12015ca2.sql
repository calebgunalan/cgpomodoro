-- Add estimated_pomodoros to tasks table for task estimation feature
ALTER TABLE public.tasks 
ADD COLUMN estimated_pomodoros integer DEFAULT NULL,
ADD COLUMN completed_pomodoros integer NOT NULL DEFAULT 0;

-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achieved_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policy for achievements
CREATE POLICY "Users can manage own achievements"
ON public.achievements
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.achievements
ADD CONSTRAINT achievements_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;