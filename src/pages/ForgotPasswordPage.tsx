import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'username' | 'question' | 'reset'>('username');
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleCheckUsername = async () => {
    if (!username.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'get_security_question', username: username.trim() },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      if (!data.security_question) {
        toast({
          title: "No security question",
          description: "This account doesn't have a security question set",
          variant: "destructive",
        });
        return;
      }

      setSecurityQuestion(data.security_question);
      setStep('question');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: { action: 'verify_security_answer', username, answer: answer.trim() },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      setResetToken(data.reset_token);
      setStep('reset');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: {
          action: 'reset_password',
          username,
          reset_token: resetToken,
          new_password: newPassword,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      toast({ title: "Password reset!", description: "You can now login with your new password" });
      navigate('/auth?mode=login');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth?mode=login')}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Button>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center chat-glow">
              <Key className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {step === 'username' && 'Forgot Password'}
            {step === 'question' && 'Security Question'}
            {step === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {step === 'username' && 'Enter your username to recover your account'}
            {step === 'question' && 'Answer your security question'}
            {step === 'reset' && 'Create a new password'}
          </p>

          {step === 'username' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleCheckUsername}
                disabled={!username.trim() || loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Continue'}
              </Button>
            </div>
          )}

          {step === 'question' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Your security question:</p>
                <p className="font-medium text-foreground">{securityQuestion}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Your Answer</label>
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleVerifyAnswer}
                disabled={!answer.trim() || loading}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify Answer'}
              </Button>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500">Identity verified!</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-input border-border"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || loading}
                className="w-full"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
