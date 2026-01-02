import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeamWorkspace } from '@/hooks/useTeamWorkspace';
import { 
  Users, 
  Plus, 
  Play, 
  Pause, 
  UserPlus,
  Crown,
  Clock,
  Zap
} from 'lucide-react';

export function TeamWorkspacePanel() {
  const {
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
    endTeamSession
  } = useTeamWorkspace();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sessionDuration, setSessionDuration] = useState('25');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Calculate time remaining for active session
  useEffect(() => {
    if (!activeSession) {
      setTimeRemaining(null);
      return;
    }

    const updateTime = () => {
      const now = new Date().getTime();
      const endsAt = new Date(activeSession.ends_at).getTime();
      const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0 && isSessionCreator) {
        endTeamSession();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isSessionCreator, endTeamSession]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    await createWorkspace(newWorkspaceName);
    setNewWorkspaceName('');
    setCreateDialogOpen(false);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const success = await inviteMember(inviteEmail);
    if (success) {
      setInviteEmail('');
      setInviteDialogOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sessionProgress = activeSession && timeRemaining !== null
    ? ((activeSession.duration_minutes * 60 - timeRemaining) / (activeSession.duration_minutes * 60)) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Workspaces
          </h2>
          <p className="text-muted-foreground">
            Collaborate with your team in synchronized focus sessions
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              />
              <Button className="w-full" onClick={handleCreateWorkspace}>
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a workspace to start collaborating with your team
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workspace Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => selectWorkspace(workspace)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        currentWorkspace?.id === workspace.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="font-medium">{workspace.name}</span>
                      {workspace.owner_id === currentWorkspace?.owner_id && isOwner && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Active Session */}
          {currentWorkspace && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentWorkspace.name}</CardTitle>
                    <CardDescription>
                      {members.length + 1} member{members.length !== 0 && 's'}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            type="email"
                            placeholder="Email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                          <Button className="w-full" onClick={handleInviteMember}>
                            Send Invitation
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeSession ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-500 animate-pulse" />
                        <span className="font-medium">Team Session Active</span>
                      </div>
                      <Badge variant="secondary">
                        {participants.length} focusing
                      </Badge>
                    </div>

                    <div className="text-center py-6">
                      <div className="text-5xl font-mono font-bold mb-4">
                        {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                      </div>
                      <Progress value={sessionProgress} className="h-2 mb-4" />
                      <div className="flex items-center justify-center gap-4">
                        {participants.slice(0, 5).map((p, i) => (
                          <Avatar key={p.id} className="border-2 border-background">
                            <AvatarFallback>U{i + 1}</AvatarFallback>
                          </Avatar>
                        ))}
                        {participants.length > 5 && (
                          <span className="text-sm text-muted-foreground">
                            +{participants.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isParticipant ? (
                        <Button variant="outline" className="flex-1" onClick={leaveSession}>
                          Leave Session
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={() => joinSession()}>
                          <Play className="h-4 w-4 mr-2" />
                          Join Session
                        </Button>
                      )}
                      {isSessionCreator && (
                        <Button variant="destructive" onClick={endTeamSession}>
                          <Pause className="h-4 w-4 mr-2" />
                          End Session
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>No active session</span>
                    </div>

                    <div className="flex gap-2">
                      <Select value={sessionDuration} onValueChange={setSessionDuration}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="25">25 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        className="flex-1"
                        onClick={() => startTeamSession(parseInt(sessionDuration))}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Team Session
                      </Button>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Team Members</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      Owner (You)
                    </Badge>
                    {members.map((member) => (
                      <Badge key={member.id} variant="outline">
                        Member
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
