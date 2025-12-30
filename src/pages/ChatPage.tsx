import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Group, Message, AnonUser } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<(Message & { username: string })[]>([]);
  const [members, setMembers] = useState<{ user_id: string; username: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    if (!groupId) {
      navigate('/groups');
      return;
    }
    
    fetchGroupData();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch username for the new message
          const { data: userData } = await supabase
            .from('anon_users')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();
          
          setMessages((prev) => [...prev, { ...newMsg, username: userData?.username || 'Unknown' }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroupData = async () => {
    if (!groupId || !user) return;

    try {
      // Check if user is a member
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        toast({
          title: "Access denied",
          description: "You're not a member of this group",
          variant: "destructive",
        });
        navigate('/groups');
        return;
      }

      // Fetch group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members with usernames
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersData) {
        const userIds = membersData.map(m => m.user_id);
        const { data: usersData } = await supabase
          .from('anon_users')
          .select('id, username')
          .in('id', userIds);
        
        setMembers(usersData?.map(u => ({ user_id: u.id, username: u.username })) || []);
      }

      // Fetch messages with usernames
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Get usernames for all messages
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: usersData } = await supabase
        .from('anon_users')
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !groupId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const copyInviteCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.invite_code);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
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
            <h1 className="font-semibold text-foreground">{group.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={copyInviteCode}
          className="border-border font-mono text-xs"
        >
          <Copy className="w-3 h-3 mr-2" />
          {group.invite_code}
        </Button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
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

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
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

export default ChatPage;
