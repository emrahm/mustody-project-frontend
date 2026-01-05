import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import TeamInvitationModal from '@/components/TeamInvitationModal';
import DashboardLayout from '@/components/DashboardLayout';

interface TeamMember {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_at: string;
  accepted_at?: string;
}

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/tenant/team-members');
      setTeamMembers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
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
              Takım Yönetimi
            </h1>
            <p className="text-gray-600">Organizasyonunuzdaki takım üyelerini yönetin</p>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Takım Üyesi Davet Et
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Takım Üyeleri</CardTitle>
            <CardDescription>
              Mevcut takım üyeleri ve davet durumları
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Yükleniyor...</div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz takım üyesi yok</p>
                <p className="text-sm text-gray-500">İlk takım üyenizi davet etmek için yukarıdaki butonu kullanın</p>
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
                        <p className="font-medium">{member.email}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          Davet: {new Date(member.invited_at).toLocaleDateString('tr-TR')}
                          {member.accepted_at && (
                            <>
                              <span>•</span>
                              Kabul: {new Date(member.accepted_at).toLocaleDateString('tr-TR')}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(member.status)}
                      <Badge className={getStatusColor(member.status)}>
                        {member.status === 'accepted' ? 'Kabul Edildi' :
                         member.status === 'pending' ? 'Bekliyor' : 'Süresi Doldu'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TeamInvitationModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            fetchTeamMembers();
            alert('Takım üyesi daveti başarıyla gönderildi!');
          }}
        />
      </div>
    </DashboardLayout>
  );
}
