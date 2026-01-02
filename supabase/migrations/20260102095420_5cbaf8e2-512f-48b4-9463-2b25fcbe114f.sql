-- Create workspaces table for team collaboration
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team focus sessions for synchronized focus
CREATE TABLE public.team_focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  started_by UUID NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'work',
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create team session participants
CREATE TABLE public.team_session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_session_id UUID REFERENCES public.team_focus_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create external integrations table
CREATE TABLE public.external_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create AI insights cache table
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insights JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view workspaces they own or are members of"
ON public.workspaces FOR SELECT
USING (owner_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.workspace_members WHERE workspace_id = id AND user_id = auth.uid()
));

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces"
ON public.workspaces FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
ON public.workspaces FOR DELETE
USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspaces w 
  WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
  ))
));

CREATE POLICY "Owners can manage workspace members"
ON public.workspace_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()
));

-- Team focus sessions policies
CREATE POLICY "Members can view team sessions"
ON public.team_focus_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()
));

CREATE POLICY "Members can create team sessions"
ON public.team_focus_sessions FOR INSERT
WITH CHECK (started_by = auth.uid() AND (EXISTS (
  SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()
)));

CREATE POLICY "Session creators can update"
ON public.team_focus_sessions FOR UPDATE
USING (started_by = auth.uid());

-- Team session participants policies
CREATE POLICY "Participants can view"
ON public.team_session_participants FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_focus_sessions ts 
  JOIN public.workspace_members wm ON wm.workspace_id = ts.workspace_id 
  WHERE ts.id = team_session_id AND wm.user_id = auth.uid()
));

CREATE POLICY "Users can join sessions"
ON public.team_session_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave sessions"
ON public.team_session_participants FOR DELETE
USING (user_id = auth.uid());

-- External integrations policies
CREATE POLICY "Users can manage own integrations"
ON public.external_integrations FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- AI insights policies
CREATE POLICY "Users can manage own insights"
ON public.ai_insights FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime for team sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_focus_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_session_participants;

-- Create indexes
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_team_sessions_workspace ON public.team_focus_sessions(workspace_id);
CREATE INDEX idx_team_sessions_active ON public.team_focus_sessions(is_active);
CREATE INDEX idx_ai_insights_user ON public.ai_insights(user_id);