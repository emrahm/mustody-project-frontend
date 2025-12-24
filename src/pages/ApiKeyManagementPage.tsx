import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import ApiKeyManagement from '@/components/ApiKeyManagement';

export default function ApiKeyManagementPage() {
  return (
    <RoleGuard allowedRoles={['tenant_admin']}>
      <ApiKeyManagement />
    </RoleGuard>
  );
}
