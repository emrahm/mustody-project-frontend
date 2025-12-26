import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Send, Plus, Edit, Trash2 } from 'lucide-react';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'notification';
  subject?: string;
  body: string;
  variables: string[];
  isPredefined: boolean;
}

export default function MessagingPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'notification',
    subject: '',
    body: '',
  });

  const [sendData, setSendData] = useState({
    recipient: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/message-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const createTemplate = async () => {
    setLoading(true);
    try {
      await api.post('/message-templates', newTemplate);
      setIsCreateModalOpen(false);
      setNewTemplate({ name: '', type: 'email', subject: '', body: '' });
      fetchTemplates();
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
      await api.post('/messages/send-template', {
        templateId: selectedTemplate.id,
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

  const deleteTemplate = async (templateId: string) => {
    try {
      await api.delete(`/message-templates/${templateId}`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const predefinedTemplates = templates.filter(t => t.isPredefined);
  const customTemplates = templates.filter(t => !t.isPredefined);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Messaging</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
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
              <Button onClick={createTemplate} disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Predefined Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Predefined Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary">{template.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.body}</p>
                {template.variables.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
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
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{template.type}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.body}</p>
                {template.variables.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
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
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
                selectedTemplate?.type === 'sms' ? 'Phone Number' : 'Webhook URL'
              }
              value={sendData.recipient}
              onChange={(e) => setSendData({ ...sendData, recipient: e.target.value })}
            />
            
            {selectedTemplate?.variables.map((variable) => (
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
