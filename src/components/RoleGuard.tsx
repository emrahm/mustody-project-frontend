import { useAuth } from '@/_core/hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
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
