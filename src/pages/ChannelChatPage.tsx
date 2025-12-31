import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Users, Send, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Channel, ChannelMessage } from '@/types/database';
import MessageBubble from '@/components/chat/MessageBubble';
import ReplyPreview from '@/components/chat/ReplyPreview';
import GameMessage from '@/components/chat/GameMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import InAppKeyboard from '@/components/keyboard/InAppKeyboard';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface ChannelMessageWithUser extends ChannelMessage {
  username: string;
  reply_to_id?: string | null;
  replyTo?: { content: string; username: string } | null;
}

type GameType = 'none' | 'tictactoe' | 'rps' | 'memory';

const games = [
  { id: 'tictactoe' as GameType, name: 'Tic Tac Toe', emoji: '⭕' },
  { id: 'rps' as GameType, name: 'Rock Paper Scissors', emoji: '✂️' },
  { id: 'memory' as GameType, name: 'Memory Match', emoji: '🧠' },
];

const ChannelChatPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { playSend, playNotification, playClick } = useSoundEffects();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessageWithUser[]>([]);
  const [members, setMembers] = useState<{ user_id: string; username: string }[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChannelMessageWithUser | null>(null);
  const [activeGame, setActiveGame] = useState<GameType>('none');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/auth?mode=login'); return; }
    if (!channelId) { navigate('/'); return; }

    fetchData();

    const channelSub = supabase
      .channel(`channel-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChannelMessage & { reply_to_id?: string };
            const { data: userData } = await supabase.from('anon_users_public').select('username').eq('id', newMsg.user_id).single();
            
            let replyTo = null;
            if (newMsg.reply_to_id) {
              const { data: replyMsg } = await supabase.from('channel_messages').select('content, user_id').eq('id', newMsg.reply_to_id).single();
              if (replyMsg) {
                const { data: replyUser } = await supabase.from('anon_users_public').select('username').eq('id', replyMsg.user_id).single();
                replyTo = { content: replyMsg.content, username: replyUser?.username || 'Unknown' };
              }
            }
            
            if (newMsg.user_id !== user.id) playNotification();
            setMessages((prev) => [...prev, { ...newMsg, username: userData?.username || 'Unknown', replyTo }]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) => prev.map(m => m.id === payload.new.id ? { ...m, content: payload.new.content } : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channelSub); };
  }, [user, channelId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGame]);

  const fetchData = async () => {
    if (!channelId || !user) return;

    try {
      const { data: membership } = await supabase.from('channel_members').select('id').eq('channel_id', channelId).eq('user_id', user.id).limit(1);
      if (!membership || membership.length === 0) {
        toast({ title: "Not a member", description: "Join this channel first", variant: "destructive" });
        navigate('/');
        return;
      }

      const { data: channelData, error } = await supabase.from('channels').select('*').eq('id', channelId).single();
      if (error) throw error;
      setChannel(channelData);
      setMemberCount(channelData.member_count || 0);

      // Fetch members
      const { data: membersData } = await supabase.from('channel_members').select('user_id').eq('channel_id', channelId);
      if (membersData) {
        const memberIds = membersData.map(m => m.user_id);
        const { data: memberUsersData } = await supabase.from('anon_users_public').select('id, username').in('id', memberIds);
        setMembers(memberUsersData?.map(u => ({ user_id: u.id!, username: u.username! })) || []);
      }

      const { data: messagesData } = await supabase.from('channel_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: true });
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: usersData } = await supabase.from('anon_users_public').select('id, username').in('id', userIds);
      const usernameMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

      const messagesWithReplies = (messagesData || []).map((m: any) => {
        let replyTo = null;
        if (m.reply_to_id) {
          const replyMsg = messagesData?.find((msg: any) => msg.id === m.reply_to_id);
          if (replyMsg) {
            replyTo = { content: replyMsg.content, username: usernameMap.get(replyMsg.user_id) || 'Unknown' };
          }
        }
        return { ...m, username: usernameMap.get(m.user_id) || 'Unknown', replyTo };
      });

      setMessages(messagesWithReplies);
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
      const insertData: any = { channel_id: channelId, user_id: user.id, content: newMessage.trim() };
      if (replyingTo) insertData.reply_to_id = replyingTo.id;
      
      const { error } = await supabase.from('channel_messages').insert(insertData);
      if (error) throw error;
      playSend();
      setNewMessage('');
      setReplyingTo(null);
      setShowKeyboard(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    const { error } = await supabase.from('channel_messages').update({ content: newContent }).eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase.from('channel_messages').delete().eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const startGame = (game: GameType) => {
    playClick();
    setActiveGame(game);
    setShowGameMenu(false);
    const gameName = games.find(g => g.id === game)?.name;
    supabase.from('channel_messages').insert({ channel_id: channelId, user_id: user!.id, content: `🎮 Started playing ${gameName}!` });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!channel) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
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
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                id={message.id}
                content={message.content}
                username={message.username}
                createdAt={message.created_at}
                isOwn={message.user_id === user.id}
                replyTo={message.replyTo}
                onReply={() => setReplyingTo(message)}
                onEdit={(newContent) => handleEdit(message.id, newContent)}
                onDelete={() => handleDelete(message.id)}
              />
            ))
          )}
          
          {/* Game displayed as center-aligned message */}
          {activeGame !== 'none' && (
            <GameMessage
              gameType={activeGame}
              playerName={user.username}
              playerId={user.id}
              currentUserId={user.id}
              members={members}
              onClose={() => setActiveGame('none')}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        {replyingTo && (
          <ReplyPreview username={replyingTo.username} content={replyingTo.content} onCancel={() => setReplyingTo(null)} />
        )}
        
        {showKeyboard ? (
          <InAppKeyboard
            value={newMessage}
            onChange={setNewMessage}
            onSubmit={handleSend}
            onClose={() => setShowKeyboard(false)}
          />
        ) : (
          <div className="p-4">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              {/* Game selector */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { playClick(); setShowGameMenu(!showGameMenu); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Gamepad2 className="w-5 h-5" />
                </Button>
                
                {showGameMenu && (
                  <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl p-3 shadow-lg min-w-48 z-50">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Play a Game</p>
                    <div className="space-y-1">
                      {games.map(game => (
                        <button
                          key={game.id}
                          onClick={() => startGame(game.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground text-sm transition-colors"
                        >
                          <span>{game.emoji}</span>
                          <span>{game.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input area - opens in-app keyboard */}
              <div 
                onClick={() => setShowKeyboard(true)}
                className="flex-1 px-4 py-3 bg-input border border-border rounded-xl text-foreground cursor-text min-h-[48px] flex items-center"
              >
                {newMessage ? (
                  <span className="font-mono text-sm">{newMessage}</span>
                ) : (
                  <span className="text-muted-foreground font-mono text-sm">Message #{channel.name}...</span>
                )}
              </div>
              
              <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 chat-glow">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelChatPage;
