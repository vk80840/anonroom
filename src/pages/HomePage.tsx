import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Shield, Hash, Plus, Settings, Search, User, Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { AnonUser, DirectMessage } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface Conversation {
  id: string;
  type: 'group' | 'dm' | 'channel';
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  avatarUrl?: string;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { playClick } = useSoundEffects();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnonUser[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Create dialogs
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    fetchAllConversations();
  }, [user, navigate]);

  const fetchAllConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const allConversations: Conversation[] = [];

      // Fetch groups user is member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberships?.length) {
        const groupIds = memberships.map(m => m.group_id);
        const { data: groups } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        // Fetch last message for each group
        for (const group of groups || []) {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          allConversations.push({
            id: group.id,
            type: 'group',
            name: group.name,
            lastMessage: lastMsg?.content || 'No messages yet',
            lastMessageAt: lastMsg?.created_at,
          });
        }
      }

      // Fetch DM conversations
      const { data: dms } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (dms?.length) {
        const dmMap = new Map<string, { msg: DirectMessage; unread: number }>();
        dms.forEach(msg => {
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (!dmMap.has(partnerId)) {
            dmMap.set(partnerId, { msg, unread: 0 });
          }
          if (msg.receiver_id === user.id && !msg.read_at) {
            const entry = dmMap.get(partnerId);
            if (entry) entry.unread++;
          }
        });

        const partnerIds = Array.from(dmMap.keys());
        if (partnerIds.length) {
          const { data: users } = await supabase
            .from('anon_users')
            .select('id, username, avatar_url')
            .in('id', partnerIds);

          users?.forEach(u => {
            const entry = dmMap.get(u.id);
            if (entry) {
              allConversations.push({
                id: u.id,
                type: 'dm',
                name: u.username,
                lastMessage: entry.msg.content.slice(0, 50),
                lastMessageAt: entry.msg.created_at,
                unreadCount: entry.unread,
                avatarUrl: u.avatar_url || undefined,
              });
            }
          });
        }
      }

      // Fetch channels user is member of
      const { data: channelMemberships } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      if (channelMemberships?.length) {
        const channelIds = channelMemberships.map(m => m.channel_id);
        const { data: channels } = await supabase
          .from('channels')
          .select('*')
          .in('id', channelIds);

        // Fetch last message for each channel
        for (const channel of channels || []) {
          const { data: lastMsg } = await supabase
            .from('channel_messages')
            .select('content, created_at')
            .eq('channel_id', channel.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          allConversations.push({
            id: channel.id,
            type: 'channel',
            name: `#${channel.name}`,
            lastMessage: lastMsg?.content || 'No messages yet',
            lastMessageAt: lastMsg?.created_at,
          });
        }
      }

      // Sort by last message time
      allConversations.sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt) {
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        return 0;
      });

      setConversations(allConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('anon_users_public')
        .select('*')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user?.id)
        .limit(10);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => handleSearch(), 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    setCreating(true);
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .insert({ name: newGroupName.trim(), description: newGroupDesc.trim() || null, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
      setNewGroupName('');
      setNewGroupDesc('');
      setCreateGroupOpen(false);
      fetchAllConversations();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!user || !newChannelName.trim()) return;
    setCreating(true);
    try {
      const { data: channel, error } = await supabase
        .from('channels')
        .insert({ name: newChannelName.trim(), description: newChannelDesc.trim() || null, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.from('channel_members').insert({ channel_id: channel.id, user_id: user.id });
      setNewChannelName('');
      setNewChannelDesc('');
      setCreateChannelOpen(false);
      fetchAllConversations();
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !joinCode.trim()) return;
    setCreating(true);
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .or(`invite_code.eq.${joinCode.trim()},custom_code.eq.${joinCode.trim().toLowerCase()}`)
        .single();
      
      if (!group) {
        alert('Group not found');
        return;
      }

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
      }
      
      setJoinCode('');
      setJoinGroupOpen(false);
      navigate(`/chat/${group.id}`);
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setCreating(false);
    }
  };

  const navigateToConversation = (conv: Conversation) => {
    switch (conv.type) {
      case 'group':
        navigate(`/chat/${conv.id}`);
        break;
      case 'dm':
        navigate(`/dm/${conv.id}`);
        break;
      case 'channel':
        navigate(`/channel/${conv.id}`);
        break;
    }
  };

  const getIcon = (type: Conversation['type']) => {
    switch (type) {
      case 'group': return Users;
      case 'dm': return User;
      case 'channel': return Hash;
    }
  };

  const getIconBg = (type: Conversation['type']) => {
    switch (type) {
      case 'group': return 'bg-primary/20 text-primary';
      case 'dm': return 'bg-accent/20 text-accent';
      case 'channel': return 'bg-green-500/20 text-green-500';
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-foreground">AnonChat</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { 
              playClick(); 
              logout(); 
              navigate('/auth?mode=login'); 
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or users..."
            className="pl-10 bg-input border-border"
          />
        </div>
      </div>

      {/* User Search Results */}
      {searchQuery.length >= 2 && searchResults.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Users</p>
          <div className="space-y-1">
            {searchResults.map(u => (
              <button
                key={u.id}
                onClick={() => navigate(`/dm/${u.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <span className="font-mono text-sm text-foreground">{u.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Create or join a group, channel, or start a DM</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map(conv => {
              const Icon = getIcon(conv.type);
              return (
                <button
                  key={`${conv.type}-${conv.id}`}
                  onClick={() => navigateToConversation(conv)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center relative overflow-hidden', getIconBg(conv.type))}>
                    {conv.avatarUrl ? (
                      <img src={conv.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground font-medium">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground truncate">{conv.name}</p>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.lastMessageAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex justify-center gap-3">
          <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Group Avatar Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Add photo</p>
                  </div>
                </div>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" className="bg-input" />
                <Input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Description (optional)" className="bg-input" />
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating} className="w-full">
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Join
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Join Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter invite code" className="bg-input font-mono" />
                <Button onClick={handleJoinGroup} disabled={!joinCode.trim() || creating} className="w-full">
                  {creating ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createChannelOpen} onOpenChange={setCreateChannelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Hash className="w-4 h-4" />
                New Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Channel Avatar Upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-dashed border-border">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Add photo</p>
                  </div>
                </div>
                <Input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="Channel name" className="bg-input" />
                <Input value={newChannelDesc} onChange={(e) => setNewChannelDesc(e.target.value)} placeholder="Description (optional)" className="bg-input" />
                <Button onClick={handleCreateChannel} disabled={!newChannelName.trim() || creating} className="w-full">
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
