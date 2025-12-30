import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Shield, Hash, Zap, Lock, UserCircle, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Channel, Group } from '@/types/database';

interface DMConversation {
  recipientId: string;
  recipientUsername: string;
  lastMessage: string;
  lastMessageAt: string;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dmConversations, setDmConversations] = useState<DMConversation[]>([]);

  useEffect(() => {
    fetchChannels();
    if (user) {
      fetchGroups();
      fetchDMs();
    }
  }, [user]);

  const fetchChannels = async () => {
    const { data } = await supabase
      .from('channels')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(4);
    setChannels(data || []);
  };

  const fetchGroups = async () => {
    if (!user) return;
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    
    if (memberData?.length) {
      const groupIds = memberData.map(m => m.group_id);
      const { data } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .limit(4);
      setGroups(data || []);
    }
  };

  const fetchDMs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    if (data) {
      const convMap = new Map<string, DMConversation>();
      for (const msg of data) {
        const recipientId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(recipientId)) {
          convMap.set(recipientId, {
            recipientId,
            recipientUsername: '',
            lastMessage: msg.content,
            lastMessageAt: msg.created_at
          });
        }
      }
      
      const ids = Array.from(convMap.keys());
      if (ids.length) {
        const { data: users } = await supabase
          .from('anon_users')
          .select('id, username')
          .in('id', ids);
        
        users?.forEach(u => {
          const conv = convMap.get(u.id);
          if (conv) conv.recipientUsername = u.username;
        });
      }
      
      setDmConversations(Array.from(convMap.values()).slice(0, 4));
    }
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
              </Button>
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
        <div className="container mx-auto px-4 py-12 sm:py-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Chat Without <span className="text-primary">Identity</span>
            </h1>
            <p className="text-muted-foreground mb-6">No email. No phone. Just a username and password.</p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="chat-glow">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth?mode=login')}>
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Groups, DMs, Channels */}
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Groups Section */}
        <Section
          title="Groups"
          icon={Users}
          viewAllPath="/groups"
          emptyText={user ? "No groups yet" : "Login to see your groups"}
        >
          {groups.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {groups.map(group => (
                <ItemCard
                  key={group.id}
                  icon={Users}
                  iconColor="text-blue-500"
                  iconBg="bg-blue-500/10"
                  title={group.name}
                  subtitle={group.description || 'Private group'}
                  onClick={() => navigate(`/chat/${group.id}`)}
                />
              ))}
            </div>
          ) : user ? (
            <EmptyState icon={Users} text="Join or create a group" action={() => navigate('/groups')} />
          ) : null}
        </Section>

        {/* Direct Messages Section */}
        <Section
          title="Direct Messages"
          icon={MessageCircle}
          viewAllPath="/dm"
          emptyText={user ? "No messages yet" : "Login to see messages"}
        >
          {dmConversations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dmConversations.map(conv => (
                <ItemCard
                  key={conv.recipientId}
                  icon={UserCircle}
                  iconColor="text-purple-500"
                  iconBg="bg-purple-500/10"
                  title={conv.recipientUsername}
                  subtitle={conv.lastMessage.slice(0, 30) + (conv.lastMessage.length > 30 ? '...' : '')}
                  onClick={() => navigate(`/dm/${conv.recipientId}`)}
                />
              ))}
            </div>
          ) : user ? (
            <EmptyState icon={MessageCircle} text="Start a conversation" action={() => navigate('/dm')} />
          ) : null}
        </Section>

        {/* Channels Section */}
        <Section
          title="Channels"
          icon={Hash}
          viewAllPath="/channels"
          emptyText="Explore public channels"
        >
          {channels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {channels.map(channel => (
                <ItemCard
                  key={channel.id}
                  icon={Hash}
                  iconColor="text-green-500"
                  iconBg="bg-green-500/10"
                  title={`#${channel.name}`}
                  subtitle={`${channel.member_count || 0} members`}
                  onClick={() => navigate(`/channel/${channel.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Hash} text="No channels yet" action={() => navigate('/channels')} />
          )}
        </Section>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FeatureCard icon={Lock} title="Secure" description="Encrypted passwords" />
          <FeatureCard icon={Zap} title="Real-time" description="Instant delivery" />
          <FeatureCard icon={Shield} title="Private" description="No tracking" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Anonymous Chat • No tracking</p>
        </div>
      </footer>
    </div>
  );
};

const Section = ({ title, icon: Icon, viewAllPath, children, emptyText }: {
  title: string;
  icon: any;
  viewAllPath: string;
  children: React.ReactNode;
  emptyText: string;
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate(viewAllPath)}>
          View All
        </Button>
      </div>
      {children}
    </div>
  );
};

const ItemCard = ({ icon: Icon, iconColor, iconBg, title, subtitle, onClick }: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-start p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors text-left w-full"
  >
    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <p className="font-medium text-foreground text-sm truncate w-full">{title}</p>
    <p className="text-xs text-muted-foreground truncate w-full">{subtitle}</p>
  </button>
);

const EmptyState = ({ icon: Icon, text, action }: { icon: any; text: string; action: () => void }) => (
  <button
    onClick={action}
    className="w-full p-6 border border-dashed border-border rounded-xl hover:border-primary/30 transition-colors flex flex-col items-center gap-2"
  >
    <Icon className="w-6 h-6 text-muted-foreground" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </button>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="bg-card border border-border rounded-xl p-4 text-center">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <h3 className="font-medium text-foreground text-sm">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

export default HomePage;
