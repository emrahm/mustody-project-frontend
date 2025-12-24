import React from 'react';
import { Alert, Container } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { canAccess } = useAuth();

  if (!canAccess(allowedRoles)) {
    return fallback || (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. You don't have the required permissions to view this page.
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
}

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function EmailVerificationGuard({ children, fallback = null }: EmailVerificationGuardProps) {
  const { user } = useAuth();

  if (!user || !user.email_verified) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
