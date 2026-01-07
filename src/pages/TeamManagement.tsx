import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Mail, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import TeamInvitationModal from '@/components/TeamInvitationModal';
import DashboardLayout from '@/components/DashboardLayout';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function TeamManagement() {
  const { user, hasGlobalRole } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isAdmin = hasGlobalRole('admin');

  useEffect(() => {
    if (isAdmin) {
      fetchTenants();
    } else {
      fetchTeamMembers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedTenant) {
      fetchTeamMembers(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/admin/tenants');
      setTenants(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (tenantId?: string) => {
    try {
      const params = tenantId ? { tenant_id: tenantId } : {};
      const response = await api.get('/tenant/members', { params });
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'tenant_admin': return 'bg-blue-100 text-blue-800';
      case 'tenant_user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Team Management
            </h1>
            <p className="text-gray-600">Manage team members in your organization</p>
          </div>
          {!isAdmin && (
            <Button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Team Member
            </Button>
          )}
        </div>

        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Tenant</CardTitle>
              <CardDescription>Choose a tenant to view their team members</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {isAdmin && selectedTenant 
                ? `Team members for selected tenant`
                : 'Current team members and their roles'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (isAdmin && !selectedTenant) ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Please select a tenant to view team members</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No team members found</p>
                {!isAdmin && (
                  <p className="text-sm text-gray-500">Use the button above to invite your first team member</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          Joined: {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getRoleColor(member.role)}>
                      {member.role === 'tenant_admin' ? 'Tenant Admin' :
                       member.role === 'tenant_user' ? 'User' : 
                       member.role === 'admin' ? 'Admin' : member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!isAdmin && (
          <TeamInvitationModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => {
              fetchTeamMembers();
              alert('Team member invitation sent successfully!');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
