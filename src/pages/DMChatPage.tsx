import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { AnonUser, DirectMessage } from '@/types/database';
import GameSelector, { GameDisplay } from '@/components/games/GameSelector';
import MessageBubble from '@/components/chat/MessageBubble';
import ReplyPreview from '@/components/chat/ReplyPreview';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface DMWithReply extends DirectMessage {
  reply_to_id?: string | null;
  replyTo?: { content: string; username: string } | null;
}

const DMChatPage = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { playSend, playNotification } = useSoundEffects();
  
  const [recipient, setRecipient] = useState<AnonUser | null>(null);
  const [messages, setMessages] = useState<DMWithReply[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DMWithReply | null>(null);
  const [activeGame, setActiveGame] = useState<'none' | 'tictactoe' | 'rps' | 'memory'>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth?mode=login'); return; }
    if (!recipientId) { navigate('/'); return; }
    
    fetchData();
    
    const channel = supabase
      .channel(`dm-${[user.id, recipientId].sort().join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as DirectMessage & { reply_to_id?: string };
            if ((newMsg.sender_id === user.id && newMsg.receiver_id === recipientId) ||
                (newMsg.sender_id === recipientId && newMsg.receiver_id === user.id)) {
              setMessages((prev) => {
                let replyTo = null;
                if (newMsg.reply_to_id) {
                  const replyMsg = prev.find(m => m.id === newMsg.reply_to_id);
                  if (replyMsg) {
                    replyTo = { content: replyMsg.content, username: replyMsg.sender_id === user.id ? user.username : (recipient?.username || 'Unknown') };
                  }
                }
                return [...prev, { ...newMsg, replyTo }];
              });
              if (newMsg.sender_id !== user.id) playNotification();
              if (newMsg.receiver_id === user.id) markAsRead(newMsg.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, content: payload.new.content } : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, recipientId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    if (!recipientId || !user) return;

    try {
      const { data: recipientData, error: recipientError } = await supabase.from('anon_users_public').select('*').eq('id', recipientId).single();
      if (recipientError) { toast({ title: "User not found", variant: "destructive" }); navigate('/'); return; }
      setRecipient(recipientData as AnonUser);

      const { data: messagesData } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      const messagesWithReplies = (messagesData || []).map((m: any) => {
        let replyTo = null;
        if (m.reply_to_id) {
          const replyMsg = messagesData?.find((msg: any) => msg.id === m.reply_to_id);
          if (replyMsg) {
            replyTo = { content: replyMsg.content, username: replyMsg.sender_id === user.id ? user.username : recipientData.username };
          }
        }
        return { ...m, replyTo };
      });

      setMessages(messagesWithReplies);

      const unreadIds = messagesData?.filter(m => m.receiver_id === user.id && !m.read_at).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).eq('id', messageId);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !recipientId || sending) return;
    setSending(true);
    try {
      const insertData: any = { sender_id: user.id, receiver_id: recipientId, content: newMessage.trim() };
      if (replyingTo) insertData.reply_to_id = replyingTo.id;
      
      const { error } = await supabase.from('direct_messages').insert(insertData);
      if (error) throw error;
      playSend();
      setNewMessage('');
      setReplyingTo(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    const { error } = await supabase.from('direct_messages').update({ content: newContent }).eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!recipient) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
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

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Start a conversation with {recipient.username}</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                id={message.id}
                content={message.content}
                username={message.sender_id === user.id ? user.username : recipient.username}
                createdAt={message.created_at}
                isOwn={message.sender_id === user.id}
                replyTo={message.replyTo}
                onReply={() => setReplyingTo(message)}
                onEdit={(newContent) => handleEdit(message.id, newContent)}
                onDelete={() => handleDelete(message.id)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Game Display Area - Above input */}
      {activeGame !== 'none' && (
        <GameDisplay
          playerName={user.username}
          onSendMessage={(msg) => { supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: recipientId, content: msg }); }}
          activeGame={activeGame}
          setActiveGame={setActiveGame as any}
        />
      )}

      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        {replyingTo && (
          <ReplyPreview 
            username={replyingTo.sender_id === user.id ? user.username : recipient.username} 
            content={replyingTo.content} 
            onCancel={() => setReplyingTo(null)} 
          />
        )}
        <div className="p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <GameSelector 
              playerName={user.username} 
              onSendMessage={(msg) => { supabase.from('direct_messages').insert({ sender_id: user.id, receiver_id: recipientId, content: msg }); }}
              onGameStart={() => {}}
              onGameEnd={() => {}}
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
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 chat-glow">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMChatPage;
