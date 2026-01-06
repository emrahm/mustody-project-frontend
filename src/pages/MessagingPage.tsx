import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Send, Plus, Edit, Trash2, Mail, MessageSquare, Bell } from 'lucide-react';

interface MessageTemplate {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'notification';
  subject?: string;
  body: string;
  variables: string;
  is_active: boolean;
  is_custom: boolean;
  tenant_id?: string;
}

export default function MessagingPage() {
  const [adminTemplates, setAdminTemplates] = useState<MessageTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    subject: '',
    body: '',
    variables: '',
  });

  const [sendData, setSendData] = useState({
    recipient: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchAdminTemplates();
    fetchCustomTemplates();
  }, []);

  const fetchAdminTemplates = async () => {
    try {
      const response = await api.get('/messages/admin/templates');
      setAdminTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch admin templates:', error);
      setAdminTemplates([]);
    }
  };

  const fetchCustomTemplates = async () => {
    try {
      const response = await api.get('/messages/custom/templates');
      setCustomTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch custom templates:', error);
      setCustomTemplates([]);
    }
  };

  const createCustomTemplate = async () => {
    setLoading(true);
    try {
      await api.post('/messages/custom/templates', newTemplate);
      setIsCreateModalOpen(false);
      setNewTemplate({ name: '', type: 'email', subject: '', body: '', variables: '' });
      fetchCustomTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTemplate) return;
    
    setLoading(true);
    try {
      await api.post('/messages/custom/send', {
        template_id: selectedTemplate.id,
        recipient: sendData.recipient,
        variables: sendData.variables,
      });
      setIsSendModalOpen(false);
      setSendData({ recipient: '', variables: {} });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseVariables = (variablesStr: string): string[] => {
    try {
      return variablesStr ? JSON.parse(variablesStr) : [];
    } catch {
      return [];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'notification': return <Bell className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const TemplateCard = ({ template, showActions = false }: { template: MessageTemplate; showActions?: boolean }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {getTypeIcon(template.type)}
            {template.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{template.type}</Badge>
            {!template.is_active && <Badge variant="destructive">Inactive</Badge>}
          </div>
        </div>
        {template.subject && (
          <p className="text-sm text-gray-600">Subject: {template.subject}</p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.body}</p>
        {parseVariables(template.variables).length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {parseVariables(template.variables).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button
          size="sm"
          onClick={() => {
            setSelectedTemplate(template);
            setIsSendModalOpen(true);
          }}
          className="w-full"
          disabled={!template.is_active}
        >
          <Send className="w-4 h-4 mr-2" />
          Send
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Message Templates</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Custom Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template Name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <Select
                value={newTemplate.type}
                onValueChange={(value: 'email' | 'sms' | 'notification') =>
                  setNewTemplate({ ...newTemplate, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
              {newTemplate.type === 'email' && (
                <Input
                  placeholder="Subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                />
              )}
              <Textarea
                placeholder="Message body (use {{variable}} for dynamic content)"
                value={newTemplate.body}
                onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                rows={4}
              />
              <Input
                placeholder='Variables (JSON array: ["name", "email"])'
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
              />
              <Button onClick={createCustomTemplate} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admin">System Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
            {adminTemplates.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No system templates available
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} showActions />
            ))}
            {customTemplates.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No custom templates created yet. Click "Create Custom Template" to get started.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Message Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={
                selectedTemplate?.type === 'email' ? 'Email Address' :
                selectedTemplate?.type === 'sms' ? 'Phone Number' : 'Recipient'
              }
              value={sendData.recipient}
              onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
            />
            
            {selectedTemplate && parseVariables(selectedTemplate.variables).map((variable) => (
              <Input
                key={variable}
                placeholder={`Enter ${variable}`}
                value={sendData.variables[variable] || ''}
                onChange={(e) => setSendData({
                  ...sendData,
                  variables: { ...sendData.variables, [variable]: e.target.value }
                })}
              />
            ))}
            
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <p className="text-sm text-gray-600">
                {selectedTemplate?.body.replace(/\{\{(\w+)\}\}/g, (match, variable) => 
                  sendData.variables[variable] || `{{${variable}}}`
                )}
              </p>
            </div>
            
            <Button onClick={sendMessage} disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
