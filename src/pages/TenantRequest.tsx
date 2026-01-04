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
  const [existingRequest, setExistingRequest] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchUserProfile();
    checkExistingRequest();
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

  const checkExistingRequest = async () => {
    try {
      const response = await api.get('/tenant-request/check');
      if (response.data.exists) {
        setExistingRequest(response.data.request);
      }
    } catch (error) {
      // No existing request or error - continue normally
    }
  };

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Name must not exceed 100 characters';
        }
        break;
      case 'company':
        if (!value.trim()) {
          errors.company = 'Company name is required';
        } else if (value.trim().length < 2) {
          errors.company = 'Company name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.company = 'Company name must not exceed 100 characters';
        }
        break;
      case 'purpose':
        if (!value.trim()) {
          errors.purpose = 'Use case is required';
        } else if (value.trim().length < 10) {
          errors.purpose = 'Use case must be at least 10 characters';
        } else if (value.trim().length > 1000) {
          errors.purpose = 'Use case must not exceed 1000 characters';
        }
        break;
    }
    
    return errors;
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    
    // Validate field on blur
    const errors = validateField(name, value);
    if (errors[name]) {
      setFieldErrors({ ...fieldErrors, ...errors });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    Object.keys(formData).forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      Object.assign(errors, fieldErrors);
    });
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      setError('Please complete KYC verification and enable 2FA before submitting tenant request.');
      return;
    }

    if (!validateForm()) {
      setError('Please fix the validation errors before submitting.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/tenant-request', formData);
      setSuccess(true);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        setError('You have already submitted a tenant request. Please wait for review.');
      } else {
        setError(error.response?.data?.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (existingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-600">Request Already Submitted</CardTitle>
            <CardDescription>
              You have already submitted a tenant request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className={`capitalize ${
                  existingRequest.status === 'approved' ? 'text-green-600' :
                  existingRequest.status === 'rejected' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {existingRequest.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Company:</span>
                <span>{existingRequest.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Submitted:</span>
                <span>{new Date(existingRequest.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  className={`pl-10 ${fieldErrors.name ? 'border-red-500' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={!canSubmit}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-red-500 text-sm">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Company name"
                  className={`pl-10 ${fieldErrors.company ? 'border-red-500' : ''}`}
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  onBlur={(e) => handleInputChange('company', e.target.value)}
                  required
                  disabled={!canSubmit}
                />
              </div>
              {fieldErrors.company && (
                <p className="text-red-500 text-sm">{fieldErrors.company}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Use Case</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="purpose"
                  placeholder="How do you plan to use the API? (minimum 10 characters)"
                  className={`pl-10 min-h-[100px] ${fieldErrors.purpose ? 'border-red-500' : ''}`}
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  onBlur={(e) => handleInputChange('purpose', e.target.value)}
                  required
                  disabled={!canSubmit}
                />
              </div>
              {fieldErrors.purpose && (
                <p className="text-red-500 text-sm">{fieldErrors.purpose}</p>
              )}
              <p className="text-gray-500 text-xs">
                {formData.purpose.length}/1000 characters
              </p>
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
