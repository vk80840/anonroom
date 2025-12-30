import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const JoinGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      // Store invite code and redirect to auth
      sessionStorage.setItem('pendingInviteCode', inviteCode.trim());
      navigate('/auth?mode=signup');
      return;
    }

    setLoading(true);
    try {
      // Find the group
      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.trim().toLowerCase())
        .limit(1);

      if (groupError) throw groupError;

      if (!groups || groups.length === 0) {
        toast({
          title: "Error",
          description: "Invalid invite code",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const group = groups[0];

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: "Already a member",
          description: "You're already in this group",
        });
        navigate(`/chat/${group.id}`);
        return;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (joinError) throw joinError;

      toast({
        title: "Joined!",
        description: `Welcome to ${group.name}`,
      });
      navigate(`/chat/${group.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          onClick={() => navigate(user ? '/groups' : '/')}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center chat-glow">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            Join a Group
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter the invite code shared with you
          </p>

          <div className="space-y-4">
            <Input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              className="bg-input border-border focus:border-primary text-center font-mono text-lg tracking-wider"
              maxLength={8}
            />

            <Button
              onClick={handleJoin}
              disabled={loading || !inviteCode.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground chat-glow"
            >
              {loading ? 'Joining...' : user ? 'Join Group' : 'Continue'}
            </Button>
          </div>

          {!user && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              You'll need to create an account to join
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
