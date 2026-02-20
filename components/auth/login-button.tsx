'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('[v0] Sign-in error:', error);
      toast({
        title: 'Sign-in Failed',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={isLoading} size="lg" className="gap-2">
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
