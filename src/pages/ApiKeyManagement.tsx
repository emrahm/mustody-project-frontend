import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  lastUsed: string;
  expiresAt: string;
}

export default function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'mk_live_1234567890abcdef',
      permissions: ['read', 'write', 'admin'],
      status: 'active',
      createdAt: '2024-01-15',
      lastUsed: '2 hours ago',
      expiresAt: '2024-12-31'
    },
    {
      id: '2',
      name: 'Development API',
      key: 'mk_test_abcdef1234567890',
      permissions: ['read', 'write'],
      status: 'active',
      createdAt: '2024-02-01',
      lastUsed: '1 day ago',
      expiresAt: '2024-12-31'
    },
    {
      id: '3',
      name: 'Analytics API',
      key: 'mk_live_fedcba0987654321',
      permissions: ['read'],
      status: 'inactive',
      createdAt: '2024-01-10',
      lastUsed: '1 week ago',
      expiresAt: '2024-06-30'
    }
  ]);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: ''
  });

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  const handleCreateKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyForm.name,
      key: `mk_live_${Math.random().toString(36).substring(2, 18)}`,
      permissions: newKeyForm.permissions,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      expiresAt: newKeyForm.expiresAt
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewKeyForm({ name: '', permissions: [], expiresAt: '' });
    setIsCreateDialogOpen(false);
  };

  const deleteKey = (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-success">Active</Badge>;
      case 'inactive':
        return <Badge className="badge-warning">Inactive</Badge>;
      case 'expired':
        return <Badge className="badge-danger">Expired</Badge>;
      default:
        return <Badge className="badge-gray">{status}</Badge>;
    }
  };

  const getPermissionBadges = (permissions: string[]) => {
    return permissions.map(permission => (
      <Badge key={permission} variant="outline" className="text-xs">
        {permission}
      </Badge>
    ));
  };

  return (
    <Layout currentPage="api-keys">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="page-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-title flex items-center">
                  <Key className="h-8 w-8 mr-3 text-blue-600" />
                  API Key Management
                </h1>
                <p className="page-description">
                  Manage your API keys for secure access to Mustody services
                </p>
              </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for your application
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="form-group">
                    <Label htmlFor="keyName" className="form-label">
                      Key Name
                    </Label>
                    <Input
                      id="keyName"
                      placeholder="e.g., Production API"
                      value={newKeyForm.name}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <Label className="form-label">Permissions</Label>
                    <div className="space-y-2">
                      {['read', 'write', 'admin'].map(permission => (
                        <label key={permission} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={newKeyForm.permissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyForm({
                                  ...newKeyForm,
                                  permissions: [...newKeyForm.permissions, permission]
                                });
                              } else {
                                setNewKeyForm({
                                  ...newKeyForm,
                                  permissions: newKeyForm.permissions.filter(p => p !== permission)
                                });
                              }
                            }}
                          />
                          <span className="ml-2 text-sm capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="expiresAt" className="form-label">
                      Expires At
                    </Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={newKeyForm.expiresAt}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, expiresAt: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="btn-primary"
                      onClick={handleCreateKey}
                      disabled={!newKeyForm.name || newKeyForm.permissions.length === 0}
                    >
                      Create Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Security Notice */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Security Best Practices</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Keep your API keys secure. Never share them in public repositories or client-side code. 
                  Rotate keys regularly and use the minimum required permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{apiKey.name}</h3>
                      {getStatusBadge(apiKey.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">API Key</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Permissions</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getPermissionBadges(apiKey.permissions)}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Last Used</p>
                        <p className="text-sm font-medium mt-1">{apiKey.lastUsed}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Expires</p>
                        <p className="text-sm font-medium mt-1">{apiKey.expiresAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {apiKey.createdAt}
                      </div>
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {apiKey.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Statistics</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-semibold">1,247,892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="font-semibold">142ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate Limit Hits</span>
                  <span className="font-semibold text-yellow-600">23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Recent security-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">API key created</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Permissions updated</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rate limit exceeded</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </Layout>
  );
}
