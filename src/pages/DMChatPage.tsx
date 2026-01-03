import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Send, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, chatWallpapers } from '@/stores/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { AnonUser, DirectMessage } from '@/types/database';
import MessageBubble from '@/components/chat/MessageBubble';
import ReplyPreview from '@/components/chat/ReplyPreview';
import GameMessageCard from '@/components/chat/GameMessageCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import InAppKeyboard from '@/components/keyboard/InAppKeyboard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import MuteButton from '@/components/chat/MuteButton';
import { useMutedChats } from '@/hooks/useMutedChats';
import { useNotifications } from '@/hooks/useNotifications';
import { useTelegramNotifications } from '@/hooks/useTelegramNotifications';

interface DMWithReply extends DirectMessage {
  reply_to_id?: string | null;
  replyTo?: { content: string; username: string } | null;
}

interface GameSession {
  id: string;
  game_type: 'tictactoe' | 'rps' | 'memory';
  player1_id: string;
  player2_id: string | null;
  game_state: any;
  winner_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
  context_type: string;
  context_id: string;
}

const games = [
  { id: 'tictactoe' as const, name: 'Tic Tac Toe', emoji: '⭕' },
  { id: 'rps' as const, name: 'Rock Paper Scissors', emoji: '✂️' },
  { id: 'memory' as const, name: 'Memory Match', emoji: '🧠' },
];

const DMChatPage = () => {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { useInAppKeyboard, chatWallpaper, chatWallpaperSize } = useSettingsStore();
  const { toast } = useToast();
  const { playSend, playNotification, playClick } = useSoundEffects();
  const { isMuted } = useMutedChats();
  const { showLocalNotification, preferences } = useNotifications();
  const { sendNotification: sendTelegramNotification } = useTelegramNotifications();
  
  const [recipient, setRecipient] = useState<AnonUser | null>(null);
  const [messages, setMessages] = useState<DMWithReply[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DMWithReply | null>(null);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get wallpaper style
  const getWallpaperStyle = () => {
    const wallpaper = chatWallpapers.find(w => w.id === chatWallpaper);
    if (!wallpaper || wallpaper.id === 'none') return {};
    return {
      backgroundImage: wallpaper.value,
      backgroundSize: chatWallpaperSize || 'cover',
    };
  };

  // Create a consistent context ID for DM games
  const getContextId = () => {
    if (!user || !recipientId) return '';
    return [user.id, recipientId].sort().join('-');
  };

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
              if (newMsg.sender_id !== user.id) {
                playNotification();
                // Show push notification if app is in background and chat is not muted
                if (document.hidden && !isMuted('dm', recipientId) && preferences.messages_enabled) {
                  showLocalNotification(
                    recipient?.username || 'New Message',
                    newMsg.content,
                    `/dm/${recipientId}`
                  );
                }
              }
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

    // Subscribe to game sessions for this DM
    const contextId = getContextId();
    const gameChannel = supabase
      .channel(`games-dm-${contextId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' },
        (payload) => {
          const game = payload.new as GameSession;
          if (game && game.context_type === 'dm' && game.context_id === contextId) {
            if (payload.eventType === 'INSERT') {
              setGameSessions((prev) => [...prev, game]);
            } else if (payload.eventType === 'UPDATE') {
              setGameSessions((prev) => prev.map(g => g.id === game.id ? game : g));
            }
          }
          if (payload.eventType === 'DELETE') {
            setGameSessions((prev) => prev.filter(g => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel);
      supabase.removeChannel(gameChannel);
    };
  }, [user, recipientId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, gameSessions]);

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

      // Fetch game sessions for this DM
      const contextId = getContextId();
      const { data: gamesData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('context_type', 'dm')
        .eq('context_id', contextId)
        .order('created_at', { ascending: true });
      setGameSessions((gamesData as GameSession[]) || []);
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
      const insertData: any = { 
        sender_id: user.id, 
        receiver_id: recipientId, 
        content: newMessage.trim()
      };
      if (replyingTo) insertData.reply_to_id = replyingTo.id;
      
      const { error } = await supabase.from('direct_messages').insert(insertData);
      if (error) throw error;
      
      // Send Telegram notification to recipient
      sendTelegramNotification(
        recipientId,
        `📩 Message from ${user.username}`,
        newMessage.trim()
      );
      
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
    const { error } = await supabase.from('direct_messages').update({ content: newContent }).eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleDelete = async (messageId: string) => {
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const startGame = async (gameType: 'tictactoe' | 'rps' | 'memory') => {
    playClick();
    setShowGameMenu(false);
    
    const contextId = getContextId();
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        game_type: gameType,
        player1_id: user!.id,
        player2_id: recipientId,
        context_type: 'dm',
        context_id: contextId,
        status: 'playing',
        game_state: {}
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    const gameName = games.find(g => g.id === gameType)?.name;
    await supabase.from('direct_messages').insert({ sender_id: user!.id, receiver_id: recipientId, content: `🎮 Started a ${gameName} game! Tap to play.` });
  };

  const handleGameUpdate = async (gameId: string, gameState: any, winnerId?: string, status?: string) => {
    const updateData: any = { game_state: gameState };
    if (winnerId) updateData.winner_id = winnerId;
    if (status) updateData.status = status;
    
    await supabase.from('game_sessions').update(updateData).eq('id', gameId);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!recipient) return null;

  // Combine messages and games chronologically
  const allItems = [
    ...messages.map(m => ({ type: 'message' as const, data: m, time: new Date(m.created_at).getTime() })),
    ...gameSessions.map(g => ({ type: 'game' as const, data: g, time: new Date(g.created_at).getTime() }))
  ].sort((a, b) => a.time - b.time);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')} 
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <button 
          onClick={() => navigate(`/profile/${recipientId}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {recipient.avatar_url ? (
              <img src={recipient.avatar_url} alt={recipient.username} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="text-left">
            <h1 className="font-mono font-semibold text-foreground">{recipient.username}</h1>
            <p className="text-xs text-muted-foreground">Tap for profile</p>
          </div>
        </button>
        <div className="ml-auto">
          <MuteButton chatType="dm" chatId={recipientId || ''} />
        </div>
      </header>

      {/* Chat area with wallpaper */}
      <main 
        className="flex-1 overflow-y-auto p-4"
        style={getWallpaperStyle()}
      >
        <div className="max-w-3xl mx-auto space-y-3">
          {allItems.length === 0 ? (
            <div className="text-center py-12 bg-background/60 backdrop-blur-sm rounded-2xl">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">Start a conversation with {recipient.username}</p>
            </div>
          ) : (
            allItems.map((item) => 
              item.type === 'message' ? (
                <MessageBubble
                  key={item.data.id}
                  id={item.data.id}
                  content={item.data.content}
                  username={item.data.sender_id === user.id ? user.username : recipient.username}
                  createdAt={item.data.created_at}
                  isOwn={item.data.sender_id === user.id}
                  replyTo={item.data.replyTo}
                  onReply={() => setReplyingTo(item.data)}
                  onEdit={(newContent) => handleEdit(item.data.id, newContent)}
                  onDelete={() => handleDelete(item.data.id)}
                />
              ) : (
                <GameMessageCard
                  key={item.data.id}
                  gameSession={item.data}
                  currentUserId={user.id}
                  player1Name={item.data.player1_id === user.id ? user.username : recipient.username}
                  player2Name={item.data.player2_id === user.id ? user.username : recipient.username}
                  onGameUpdate={(gameState, winnerId, status) => handleGameUpdate(item.data.id, gameState, winnerId, status)}
                />
              )
            )
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        {replyingTo && (
          <ReplyPreview 
            username={replyingTo.sender_id === user.id ? user.username : recipient.username} 
            content={replyingTo.content} 
            onCancel={() => setReplyingTo(null)} 
          />
        )}
        
        {showKeyboard && useInAppKeyboard ? (
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
                  <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl p-3 shadow-lg min-w-48 z-50 animate-scale-in">
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

              {/* Input area */}
              {useInAppKeyboard ? (
                <div 
                  onClick={() => setShowKeyboard(true)}
                  className="flex-1 px-4 py-3 bg-input border border-border rounded-xl text-foreground cursor-text min-h-[48px] flex items-center"
                >
                  {newMessage ? (
                    <span className="font-mono text-sm">{newMessage}</span>
                  ) : (
                    <span className="text-muted-foreground font-mono text-sm">Message {recipient.username}...</span>
                  )}
                </div>
              ) : (
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Message ${recipient.username}...`}
                  className="flex-1 bg-input border-border rounded-xl font-mono text-sm"
                />
              )}
              
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

export default DMChatPage;
