import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building, Users, Key, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TenantWelcome() {
  const { user } = useAuth();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    try {
      const response = await api.get('/tenant/info');
      setTenantInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch tenant info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hoş Geldiniz, {tenantInfo?.name}!
          </h1>
          <p className="text-lg text-gray-600">
            Tenant başvurunuz onaylandı. Artık organizasyonunuzu yönetmeye başlayabilirsiniz.
          </p>
        </div>

        {/* Tenant Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizasyon Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Organizasyon Adı</p>
                <p className="font-medium">{tenantInfo?.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tenant Admin</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                <p className="font-medium">
                  {tenantInfo?.created_at ? new Date(tenantInfo.created_at).toLocaleDateString('tr-TR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durum</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aktif
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Takım Üyesi Davet Et</h3>
                  <p className="text-sm text-gray-600">İlk takım üyenizi davet edin</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">API Anahtarı Oluştur</h3>
                  <p className="text-sm text-gray-600">Entegrasyonlar için API anahtarı</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Dashboard'a Git</h3>
                  <p className="text-sm text-gray-600">Ana yönetim paneline erişin</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Sonraki Adımlar</CardTitle>
            <CardDescription>
              Organizasyonunuzu kurmak için önerilen adımlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Takım Üyelerini Davet Edin</h4>
                  <p className="text-sm text-gray-600">Organizasyonunuza takım üyelerini davet ederek işbirliğini başlatın.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">API Anahtarlarını Yapılandırın</h4>
                  <p className="text-sm text-gray-600">Uygulamalarınızla entegrasyon için gerekli API anahtarlarını oluşturun.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Güvenlik Ayarlarını Gözden Geçirin</h4>
                  <p className="text-sm text-gray-600">Organizasyonunuzun güvenliğini sağlamak için ayarları kontrol edin.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/team">
            <Button className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Takım Yönetimi
            </Button>
          </Link>
          <Link href="/tenant-admin/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Dashboard'a Git
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
