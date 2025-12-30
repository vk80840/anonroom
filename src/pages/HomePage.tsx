import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Shield, Hash, Zap, Lock, UserCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Channel } from '@/types/database';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [popularChannels, setPopularChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchPopularChannels();
  }, []);

  const fetchPopularChannels = async () => {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(3);
    setPopularChannels(data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">AnonChat</span>
          </div>
          
          <div className="flex items-center gap-2">
            <GlobalSearch />
            {user ? (
              <Button size="sm" onClick={() => navigate('/groups')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">100% Anonymous</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Chat Without
              <span className="text-primary"> Identity</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              No email. No phone. Just a username and password.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Button size="lg" onClick={() => navigate('/groups')} className="chat-glow">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="chat-glow">
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/auth?mode=login')}>
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links for logged in users */}
      {user && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickLink icon={Users} title="My Groups" onClick={() => navigate('/groups')} />
            <QuickLink icon={UserCircle} title="Direct Messages" onClick={() => navigate('/dm')} />
            <QuickLink icon={Hash} title="Channels" onClick={() => navigate('/channels')} />
            <QuickLink icon={Zap} title="Settings" onClick={() => navigate('/settings')} />
          </div>
        </div>
      )}

      {/* Popular Channels */}
      {popularChannels.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Popular Channels
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/channels')}>
              View All
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-3">
            {popularChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => navigate('/channels')}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">#{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.member_count} members</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-8">
          Everything for private communication
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={Users} title="Private Groups" description="Invite-only groups with custom codes" />
          <FeatureCard icon={Hash} title="Public Channels" description="Discover and join communities" />
          <FeatureCard icon={MessageCircle} title="Direct Messages" description="Message anyone by username" />
          <FeatureCard icon={Lock} title="Secure Passwords" description="Bcrypt hashed with recovery" />
          <FeatureCard icon={Zap} title="Real-time Chat" description="Instant message delivery" />
          <FeatureCard icon={Shield} title="Your Control" description="Themes, profile, privacy" />
        </div>
      </div>

      {/* CTA */}
      {!user && (
        <div className="container mx-auto px-4 py-12">
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to chat anonymously?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              No tracking, no analytics, no data selling.
            </p>
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
              Create Free Account
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Anonymous Chat • No tracking • No data collection</p>
        </div>
      </footer>
    </div>
  );
};

const QuickLink = ({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
  >
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <span className="text-sm font-medium text-foreground">{title}</span>
  </button>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default HomePage;
