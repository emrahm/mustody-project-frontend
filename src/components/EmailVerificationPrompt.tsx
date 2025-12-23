import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface EmailVerificationPromptProps {
  onResendVerification?: () => void;
}

export function EmailVerificationPrompt({ onResendVerification }: EmailVerificationPromptProps) {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <span>Please verify your email address to access admin features.</span>
          {onResendVerification && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onResendVerification}
              className="ml-4"
            >
              Resend Verification
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
