import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    email: string;
  };
}

interface TeamFocusSession {
  id: string;
  workspace_id: string;
  started_by: string;
  session_type: string;
  duration_minutes: number;
  started_at: string;
  ends_at: string;
  is_active: boolean;
}

interface TeamSessionParticipant {
  id: string;
  team_session_id: string;
  user_id: string;
  joined_at: string;
}

export function useTeamWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [activeSession, setActiveSession] = useState<TeamFocusSession | null>(null);
  const [participants, setParticipants] = useState<TeamSessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  // Subscribe to realtime updates for team sessions
  useEffect(() => {
    if (!currentWorkspace) return;

    const channel = supabase
      .channel(`team-sessions-${currentWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_focus_sessions',
          filter: `workspace_id=eq.${currentWorkspace.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const session = payload.new as TeamFocusSession;
            if (session.is_active) {
              setActiveSession(session);
            } else if (activeSession?.id === session.id) {
              setActiveSession(null);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_session_participants',
        },
        () => {
          if (activeSession) {
            fetchParticipants(activeSession.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace, activeSession]);

  const fetchWorkspaces = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        selectWorkspace(data[0]);
      }
    }
    setLoading(false);
  };

  const selectWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    await Promise.all([
      fetchMembers(workspace.id),
      fetchActiveSession(workspace.id)
    ]);
  };

  const fetchMembers = async (workspaceId: string) => {
    const { data } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (data) {
      setMembers(data);
    }
  };

  const fetchActiveSession = async (workspaceId: string) => {
    const { data } = await supabase
      .from('team_focus_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveSession(data);
      await fetchParticipants(data.id);
    } else {
      setActiveSession(null);
      setParticipants([]);
    }
  };

  const fetchParticipants = async (sessionId: string) => {
    const { data } = await supabase
      .from('team_session_participants')
      .select('*')
      .eq('team_session_id', sessionId);

    if (data) {
      setParticipants(data);
    }
  };

  const createWorkspace = useCallback(async (name: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive",
      });
      return null;
    }

    setWorkspaces(prev => [data, ...prev]);
    selectWorkspace(data);
    
    toast({
      title: "Workspace Created",
      description: `${name} is ready for collaboration!`,
    });
    
    return data;
  }, [user, toast]);

  const inviteMember = useCallback(async (email: string) => {
    if (!user || !currentWorkspace) return false;

    // Find user by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      toast({
        title: "User Not Found",
        description: "No user found with that email address",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: currentWorkspace.id,
        user_id: profile.id,
        role: 'member'
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already a Member",
          description: "This user is already in the workspace",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to invite member",
          variant: "destructive",
        });
      }
      return false;
    }

    await fetchMembers(currentWorkspace.id);
    toast({
      title: "Member Invited",
      description: `${email} has been added to the workspace`,
    });
    return true;
  }, [user, currentWorkspace, toast]);

  const startTeamSession = useCallback(async (durationMinutes: number = 25, sessionType: string = 'work') => {
    if (!user || !currentWorkspace) return null;

    const endsAt = new Date();
    endsAt.setMinutes(endsAt.getMinutes() + durationMinutes);

    const { data, error } = await supabase
      .from('team_focus_sessions')
      .insert({
        workspace_id: currentWorkspace.id,
        started_by: user.id,
        duration_minutes: durationMinutes,
        session_type: sessionType,
        ends_at: endsAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start team session",
        variant: "destructive",
      });
      return null;
    }

    // Auto-join the session
    await joinSession(data.id);
    
    toast({
      title: "Team Session Started",
      description: "Your team can now join the focus session!",
    });
    
    return data;
  }, [user, currentWorkspace, toast]);

  const joinSession = useCallback(async (sessionId?: string) => {
    if (!user) return false;
    const targetSessionId = sessionId || activeSession?.id;
    if (!targetSessionId) return false;

    const { error } = await supabase
      .from('team_session_participants')
      .insert({
        team_session_id: targetSessionId,
        user_id: user.id
      });

    if (error && error.code !== '23505') {
      toast({
        title: "Error",
        description: "Failed to join session",
        variant: "destructive",
      });
      return false;
    }

    await fetchParticipants(targetSessionId);
    return true;
  }, [user, activeSession, toast]);

  const leaveSession = useCallback(async () => {
    if (!user || !activeSession) return false;

    const { error } = await supabase
      .from('team_session_participants')
      .delete()
      .eq('team_session_id', activeSession.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave session",
        variant: "destructive",
      });
      return false;
    }

    await fetchParticipants(activeSession.id);
    return true;
  }, [user, activeSession, toast]);

  const endTeamSession = useCallback(async () => {
    if (!user || !activeSession) return false;

    const { error } = await supabase
      .from('team_focus_sessions')
      .update({ is_active: false })
      .eq('id', activeSession.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
      return false;
    }

    setActiveSession(null);
    setParticipants([]);
    
    toast({
      title: "Session Ended",
      description: "Great work, team!",
    });
    
    return true;
  }, [user, activeSession, toast]);

  const isParticipant = user ? participants.some(p => p.user_id === user.id) : false;
  const isOwner = user && currentWorkspace ? currentWorkspace.owner_id === user.id : false;
  const isSessionCreator = user && activeSession ? activeSession.started_by === user.id : false;

  return {
    workspaces,
    currentWorkspace,
    members,
    activeSession,
    participants,
    loading,
    isParticipant,
    isOwner,
    isSessionCreator,
    createWorkspace,
    selectWorkspace,
    inviteMember,
    startTeamSession,
    joinSession,
    leaveSession,
    endTeamSession,
    refetch: fetchWorkspaces,
  };
}
