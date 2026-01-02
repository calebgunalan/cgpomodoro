import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExternalIntegrations, IntegrationProvider } from '@/hooks/useExternalIntegrations';
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'todoist' as IntegrationProvider,
    name: 'Todoist',
    description: 'Sync tasks from your Todoist account',
    color: 'bg-red-500',
    docsUrl: 'https://todoist.com/app/settings/integrations/developer'
  },
  {
    id: 'asana' as IntegrationProvider,
    name: 'Asana',
    description: 'Import tasks from Asana workspaces',
    color: 'bg-pink-500',
    docsUrl: 'https://app.asana.com/0/developer-console'
  },
  {
    id: 'notion' as IntegrationProvider,
    name: 'Notion',
    description: 'Connect to Notion databases',
    color: 'bg-gray-800',
    docsUrl: 'https://www.notion.so/my-integrations',
    needsDatabaseId: true
  }
];

export function IntegrationsPanel() {
  const { 
    integrations, 
    externalTasks, 
    syncing, 
    isConnected,
    connectIntegration,
    disconnectIntegration,
    syncTasks,
    importTask
  } = useExternalIntegrations();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<typeof INTEGRATIONS[0] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedProvider) return;
    
    setConnecting(true);
    const settings: Record<string, string> = {};
    if (selectedProvider.needsDatabaseId && databaseId) {
      settings.databaseId = databaseId;
    }
    
    const success = await connectIntegration(selectedProvider.id, apiKey, settings);
    setConnecting(false);
    
    if (success) {
      setConnectDialogOpen(false);
      setApiKey('');
      setDatabaseId('');
      setSelectedProvider(null);
    }
  };

  const openConnectDialog = (provider: typeof INTEGRATIONS[0]) => {
    setSelectedProvider(provider);
    setConnectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Integrations
          </h2>
          <p className="text-muted-foreground">
            Connect your favorite task managers for two-way sync
          </p>
        </div>
        {integrations.length > 0 && (
          <Button onClick={syncTasks} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Tasks'}
          </Button>
        )}
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {INTEGRATIONS.map((integration) => {
          const connected = isConnected(integration.id);
          
          return (
            <Card key={integration.id} className={connected ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded ${integration.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {integration.name[0]}
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  {connected && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {connected ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => disconnectIntegration(integration.id)}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => openConnectDialog(integration)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* External Tasks */}
      {externalTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">External Tasks</CardTitle>
            <CardDescription>
              Import tasks from your connected integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {externalTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {task.provider}
                      </Badge>
                      <span className="font-medium">{task.name}</span>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {task.dueDate}
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => importTask(task)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {selectedProvider?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <a 
                href={selectedProvider?.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Get your API key <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {selectedProvider?.needsDatabaseId && (
              <div className="space-y-2">
                <Label htmlFor="databaseId">Database ID</Label>
                <Input
                  id="databaseId"
                  placeholder="Enter Notion database ID"
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The ID from your Notion database URL
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setConnectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleConnect}
                disabled={!apiKey || connecting}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
