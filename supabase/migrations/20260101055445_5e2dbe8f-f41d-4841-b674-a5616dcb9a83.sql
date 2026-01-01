-- Add category field to tasks for batching
ALTER TABLE public.tasks 
ADD COLUMN category text DEFAULT NULL;

-- Add index for category grouping
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_user_category ON public.tasks(user_id, category);