import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { AnonUser, DirectMessage } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import GameSelector from '@/components/games/GameSelector';

const DMChatPage = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState<AnonUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    if (!recipientId) {
      navigate('/dm');
      return;
    }
    
    fetchData();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`dm-${[user.id, recipientId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage;
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            
            // Mark as read if we're the receiver
            if (newMsg.receiver_id === user.id) {
              markAsRead(newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    if (!recipientId || !user) return;

    try {
      // Fetch recipient info
      const { data: recipientData, error: recipientError } = await supabase
        .from('anon_users_public')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (recipientError) {
        toast({
          title: "User not found",
          description: "This user doesn't exist",
          variant: "destructive",
        });
        navigate('/dm');
        return;
      }

      setRecipient(recipientData);

      // Fetch messages between the two users
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark unread messages as read
      const unreadIds = messagesData
        ?.filter(m => m.receiver_id === user.id && !m.read_at)
        .map(m => m.id) || [];
      
      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds);
      }
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

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !recipientId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
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

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!recipient) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dm')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
          <User className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="font-mono font-semibold text-foreground">{recipient.username}</h1>
          <p className="text-xs text-muted-foreground">Direct message</p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Start a conversation with {recipient.username}</p>
              <p className="text-sm text-muted-foreground">Your messages are anonymous</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user.id;
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
                      {isOwn ? 'You' : recipient.username}
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
          <GameSelector 
            playerName={user.username} 
            onSendMessage={(msg) => {
              supabase.from('direct_messages').insert({
                sender_id: user.id,
                receiver_id: recipientId,
                content: msg,
              });
            }}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Message ${recipient.username}...`}
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

export default DMChatPage;
