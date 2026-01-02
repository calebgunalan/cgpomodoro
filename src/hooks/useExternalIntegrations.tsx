import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export type IntegrationProvider = 'todoist' | 'asana' | 'notion';

interface Integration {
  id: string;
  provider: IntegrationProvider;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ExternalTask {
  id: string;
  name: string;
  provider: IntegrationProvider;
  externalId: string;
  project?: string;
  dueDate?: string;
  priority?: number;
}

export function useExternalIntegrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [externalTasks, setExternalTasks] = useState<ExternalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('external_integrations')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setIntegrations(data as Integration[]);
    }
    setLoading(false);
  };

  const connectIntegration = useCallback(async (provider: IntegrationProvider, apiKey: string, settings: Record<string, any> = {}) => {
    if (!user) return false;

    // Validate API key by making a test request
    const isValid = await validateApiKey(provider, apiKey);
    if (!isValid) {
      toast({
        title: "Invalid API Key",
        description: `The ${provider} API key is invalid or expired`,
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase
      .from('external_integrations')
      .upsert({
        user_id: user.id,
        provider,
        access_token: apiKey,
        settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save integration",
        variant: "destructive",
      });
      return false;
    }

    await fetchIntegrations();
    toast({
      title: "Connected",
      description: `Successfully connected to ${provider}`,
    });
    return true;
  }, [user, toast]);

  const disconnectIntegration = useCallback(async (provider: IntegrationProvider) => {
    if (!user) return false;

    const { error } = await supabase
      .from('external_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      });
      return false;
    }

    setIntegrations(prev => prev.filter(i => i.provider !== provider));
    setExternalTasks(prev => prev.filter(t => t.provider !== provider));
    
    toast({
      title: "Disconnected",
      description: `Disconnected from ${provider}`,
    });
    return true;
  }, [user, toast]);

  const validateApiKey = async (provider: IntegrationProvider, apiKey: string): Promise<boolean> => {
    try {
      switch (provider) {
        case 'todoist':
          const todoistRes = await fetch('https://api.todoist.com/rest/v2/projects', {
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          return todoistRes.ok;
        
        case 'asana':
          const asanaRes = await fetch('https://app.asana.com/api/1.0/users/me', {
            headers: { Authorization: `Bearer ${apiKey}` }
          });
          return asanaRes.ok;
        
        case 'notion':
          const notionRes = await fetch('https://api.notion.com/v1/users/me', {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Notion-Version': '2022-06-28'
            }
          });
          return notionRes.ok;
        
        default:
          return false;
      }
    } catch {
      return false;
    }
  };

  const syncTasks = useCallback(async () => {
    if (!user) return;
    setSyncing(true);

    const allTasks: ExternalTask[] = [];

    for (const integration of integrations) {
      try {
        const tasks = await fetchTasksFromProvider(integration);
        allTasks.push(...tasks);
      } catch (error) {
        console.error(`Error syncing ${integration.provider}:`, error);
      }
    }

    setExternalTasks(allTasks);
    setSyncing(false);

    toast({
      title: "Tasks Synced",
      description: `Fetched ${allTasks.length} tasks from external providers`,
    });
  }, [user, integrations, toast]);

  const fetchTasksFromProvider = async (integration: Integration): Promise<ExternalTask[]> => {
    const { data } = await supabase
      .from('external_integrations')
      .select('access_token')
      .eq('id', integration.id)
      .single();

    if (!data?.access_token) return [];

    const apiKey = data.access_token;

    switch (integration.provider) {
      case 'todoist':
        return await fetchTodoistTasks(apiKey);
      case 'asana':
        return await fetchAsanaTasks(apiKey, integration.settings?.workspaceId);
      case 'notion':
        return await fetchNotionTasks(apiKey, integration.settings?.databaseId);
      default:
        return [];
    }
  };

  const fetchTodoistTasks = async (apiKey: string): Promise<ExternalTask[]> => {
    try {
      const res = await fetch('https://api.todoist.com/rest/v2/tasks', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      
      if (!res.ok) return [];
      
      const data = await res.json();
      return data.map((task: any) => ({
        id: `todoist-${task.id}`,
        name: task.content,
        provider: 'todoist' as IntegrationProvider,
        externalId: task.id,
        project: task.project_id,
        dueDate: task.due?.date,
        priority: task.priority
      }));
    } catch {
      return [];
    }
  };

  const fetchAsanaTasks = async (apiKey: string, workspaceId?: string): Promise<ExternalTask[]> => {
    try {
      let url = 'https://app.asana.com/api/1.0/tasks';
      if (workspaceId) {
        url += `?workspace=${workspaceId}&assignee=me`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      
      if (!res.ok) return [];
      
      const data = await res.json();
      return (data.data || []).map((task: any) => ({
        id: `asana-${task.gid}`,
        name: task.name,
        provider: 'asana' as IntegrationProvider,
        externalId: task.gid,
        dueDate: task.due_on
      }));
    } catch {
      return [];
    }
  };

  const fetchNotionTasks = async (apiKey: string, databaseId?: string): Promise<ExternalTask[]> => {
    if (!databaseId) return [];
    
    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!res.ok) return [];
      
      const data = await res.json();
      return (data.results || []).map((page: any) => {
        const title = page.properties?.Name?.title?.[0]?.text?.content ||
                     page.properties?.Title?.title?.[0]?.text?.content ||
                     'Untitled';
        return {
          id: `notion-${page.id}`,
          name: title,
          provider: 'notion' as IntegrationProvider,
          externalId: page.id
        };
      });
    } catch {
      return [];
    }
  };

  const importTask = useCallback(async (externalTask: ExternalTask) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        name: externalTask.name,
        category: externalTask.provider
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to import task",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Task Imported",
      description: `${externalTask.name} added to your tasks`,
    });
    return data;
  }, [user, toast]);

  const isConnected = (provider: IntegrationProvider) => 
    integrations.some(i => i.provider === provider);

  return {
    integrations,
    externalTasks,
    loading,
    syncing,
    isConnected,
    connectIntegration,
    disconnectIntegration,
    syncTasks,
    importTask,
    refetch: fetchIntegrations,
  };
}
