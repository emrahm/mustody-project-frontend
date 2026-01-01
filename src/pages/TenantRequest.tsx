import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, User, MessageSquare, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TenantRequest() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      setUserProfile(response.data);
      
      // Check if user meets requirements
      const kycVerified = response.data.kyc_status === 'verified';
      const twoFAEnabled = response.data.two_factor_enabled === true;
      setCanSubmit(kycVerified && twoFAEnabled);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      setError('Please complete KYC verification and enable 2FA before submitting tenant request.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/tenant-request', formData);
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Request Submitted</CardTitle>
            <CardDescription>
              Your request has been received. We'll get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Tenant Application
          </CardTitle>
          <CardDescription>
            Request a tenant account for API key management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Requirements Status */}
          <div className="mb-6 space-y-3">
            <h3 className="font-medium text-sm">Requirements Status:</h3>
            
            <div className="flex items-center gap-2">
              {userProfile?.kyc_status === 'verified' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${userProfile?.kyc_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                KYC Verification {userProfile?.kyc_status === 'verified' ? 'Completed' : 'Required'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {userProfile?.two_factor_enabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${userProfile?.two_factor_enabled ? 'text-green-600' : 'text-red-600'}`}>
                Two-Factor Authentication {userProfile?.two_factor_enabled ? 'Enabled' : 'Required'}
              </span>
            </div>
          </div>

          {!canSubmit && (
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                You must complete KYC verification and enable 2FA before submitting a tenant request.
                <div className="mt-2 space-x-2">
                  {userProfile?.kyc_status !== 'verified' && (
                    <Link href="/profile">
                      <Button size="sm" variant="outline">Complete KYC</Button>
                    </Link>
                  )}
                  {!userProfile?.two_factor_enabled && (
                    <Link href="/settings">
                      <Button size="sm" variant="outline">Enable 2FA</Button>
                    </Link>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={!canSubmit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Company name"
                  className="pl-10"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  disabled={!canSubmit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Use Case</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="purpose"
                  placeholder="How do you plan to use the API?"
                  className="pl-10 min-h-[100px]"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  disabled={!canSubmit}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !canSubmit}
            >
              {loading ? 'Submitting...' : canSubmit ? 'Submit Application' : 'Complete Requirements First'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
