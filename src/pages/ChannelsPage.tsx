import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Plus, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Channel } from '@/types/database';

const ChannelsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [myChannels, setMyChannels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    fetchChannels();
  }, [user, navigate]);

  const fetchChannels = async () => {
    if (!user) return;

    try {
      // Get all channels
      const { data: channelsData, error } = await supabase
        .from('channels')
        .select('*')
        .order('member_count', { ascending: false });

      if (error) throw error;
      setChannels(channelsData || []);

      // Get channels user is a member of
      const { data: memberships } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      setMyChannels(memberships?.map(m => m.channel_id) || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!user || !newChannelName.trim()) return;

    setCreating(true);
    try {
      const { data: channel, error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName.trim(),
          description: newChannelDesc.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator
      await supabase.from('channel_members').insert({
        channel_id: channel.id,
        user_id: user.id,
      });

      toast({ title: "Channel created!", description: `#${channel.name} is ready` });
      setNewChannelName('');
      setNewChannelDesc('');
      setCreateOpen(false);
      fetchChannels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('channel_members').insert({
        channel_id: channelId,
        user_id: user.id,
      });

      if (error) throw error;
      setMyChannels([...myChannels, channelId]);
      toast({ title: "Joined!", description: "You're now a member" });
      fetchChannels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/groups')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Public Channels</h1>
            <p className="text-xs text-muted-foreground">Discover and join communities</p>
          </div>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Channel Name</label>
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="general"
                  className="bg-input border-border"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                <Input
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="bg-input border-border"
                  maxLength={100}
                />
              </div>
              <Button
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim() || creating}
                className="w-full"
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="pl-10 bg-input border-border"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No channels found</p>
            <p className="text-sm text-muted-foreground">Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChannels.map((channel) => {
              const isMember = myChannels.includes(channel.id);
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => isMember && navigate(`/channel/${channel.id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">#{channel.name}</p>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{channel.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        {channel.member_count} members
                      </p>
                    </div>
                  </div>
                  
                  {isMember ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/channel/${channel.id}`)}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoinChannel(channel.id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChannelsPage;
