import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Users, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Channel, ChannelMessage } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import GameSelector from '@/components/games/GameSelector';

const ChannelChatPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<(ChannelMessage & { username: string })[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    if (!channelId) {
      navigate('/channels');
      return;
    }

    fetchData();

    const channelSub = supabase
      .channel(`channel-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChannelMessage;
          const { data: userData } = await supabase
            .from('anon_users_public')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();

          setMessages((prev) => [...prev, { ...newMsg, username: userData?.username || 'Unknown' }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [user, channelId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    if (!channelId || !user) return;

    try {
      // Check membership
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        toast({ title: "Not a member", description: "Join this channel first", variant: "destructive" });
        navigate('/channels');
        return;
      }

      // Fetch channel
      const { data: channelData, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;
      setChannel(channelData);
      setMemberCount(channelData.member_count);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('channel_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: usersData } = await supabase
        .from('anon_users_public')
        .select('id, username')
        .in('id', userIds);

      const usernameMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

      setMessages(
        messagesData?.map(m => ({
          ...m,
          username: usernameMap.get(m.user_id) || 'Unknown',
        })) || []
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !channelId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('channel_messages').insert({
        channel_id: channelId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!channel) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/channels')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Hash className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">#{channel.name}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {memberCount} members
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No messages yet. Be the first!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user_id === user.id;
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1 max-w-[75%] message-appear',
                    isOwn ? 'ml-auto items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-mono text-xs',
                      isOwn ? 'text-primary' : 'text-accent'
                    )}>
                      {isOwn ? 'You' : message.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-2xl',
                      isOwn
                        ? 'bg-message-own border border-primary/20 rounded-br-md'
                        : 'bg-message-other border border-border rounded-bl-md'
                    )}
                  >
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <GameSelector 
            playerName={user.username} 
            onSendMessage={(msg) => {
              supabase.from('channel_messages').insert({
                channel_id: channelId,
                user_id: user.id,
                content: msg,
              });
            }}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Message #${channel.name}...`}
            className="flex-1 px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm"
            maxLength={500}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 chat-glow"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChannelChatPage;
