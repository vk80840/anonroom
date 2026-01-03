import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signup';
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        title: "Error",
        description: "Username must be 3-20 characters",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Call the secure auth edge function
      const { data, error } = await supabase.functions.invoke('auth', {
        body: {
          action: isLogin ? 'login' : 'signup',
          username: username.trim(),
          password: password,
        },
      });

      if (error) {
        console.error('Auth error:', error);
        throw new Error('An error occurred. Please try again.');
      }

      if (data.error) {
        // Don't expose internal errors - show user-friendly messages
        let userMessage = data.error;
        if (data.error.includes('password') || data.error.includes('Password')) {
          userMessage = 'Incorrect password';
        } else if (data.error.includes('not found') || data.error.includes('Not found')) {
          userMessage = 'Username not found';
        } else if (data.error.includes('taken') || data.error.includes('exists')) {
          userMessage = 'Username already taken';
        } else if (data.error.includes('Internal') || data.error.includes('error')) {
          userMessage = 'An error occurred. Please try again.';
        }
        toast({
          title: "Error",
          description: userMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        setUser(data.user);
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: `${isLogin ? 'Logged in as' : 'Welcome,'} ${data.user.username}`,
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center chat-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {isLogin ? 'Welcome back' : 'Create your identity'}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isLogin ? 'Enter your credentials' : 'No email required. Just username and password.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a unique username"
                className="bg-input border-border focus:border-primary"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-input border-border focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground chat-glow"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your password is securely hashed. No tracking, no analytics.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
