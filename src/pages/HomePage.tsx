import { Shield, Users, MessageCircle, Lock, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center chat-glow">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-mono font-semibold text-xl text-foreground">
              anon<span className="text-primary">chat</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Logged in as <span className="font-mono text-primary">{user.username}</span>
                </span>
                <Button 
                  onClick={() => navigate('/groups')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  My Groups
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth?mode=login')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/auth?mode=signup')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-online pulse-online" />
            <span className="text-sm font-mono text-primary">100% Anonymous</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Chat Without
            <span className="text-primary"> Identity</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
            No email. No phone. No trace. Create groups, invite friends, 
            and communicate with complete anonymity.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg chat-glow"
            >
              Create Account
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/join')}
              className="border-border hover:bg-secondary px-8 py-6 text-lg"
            >
              Join with Code
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="Username Only"
            description="No email, no phone number. Just pick a username and password. That's it."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Private Groups"
            description="Create invite-only groups. Share codes with friends. Control who joins."
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Real-time Chat"
            description="Instant messaging with live updates. See who's typing, who's online."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Lightning Fast"
            description="No bloat, no tracking scripts. Pure speed for pure communication."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Access Anywhere"
            description="Works on any device. No app downloads required. Just open and chat."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Zero Knowledge"
            description="We don't know who you are. We don't want to know. Stay anonymous."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to go ghost?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of users who value their privacy. 
            Create your anonymous identity in seconds.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 chat-glow"
          >
            Start Chatting Anonymously
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>No logs. No traces. No identity.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:chat-glow transition-shadow">
      {icon}
    </div>
    <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

export default HomePage;
