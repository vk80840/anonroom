import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { AnonUser, DirectMessage } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Conversation {
  user: AnonUser;
  lastMessage: DirectMessage | null;
  unreadCount: number;
}

const DirectMessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnonUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all DMs where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, { messages: DirectMessage[]; partnerId: string }>();
      
      messages?.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, { messages: [], partnerId });
        }
        conversationMap.get(partnerId)!.messages.push(msg);
      });

      // Fetch user details for each conversation partner
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length > 0) {
        const { data: users } = await supabase
          .from('anon_users_public')
          .select('*')
          .in('id', partnerIds);

        const convs: Conversation[] = [];
        users?.forEach((partnerUser) => {
          const conv = conversationMap.get(partnerUser.id);
          if (conv) {
            const unreadCount = conv.messages.filter(
              m => m.receiver_id === user.id && !m.read_at
            ).length;
            convs.push({
              user: partnerUser,
              lastMessage: conv.messages[0] || null,
              unreadCount,
            });
          }
        });
        
        // Sort by last message time
        convs.sort((a, b) => {
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
        });
        
        setConversations(convs);
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

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('anon_users_public')
        .select('*')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const startConversation = (targetUser: AnonUser) => {
    navigate(`/dm/${targetUser.id}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/groups')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">Direct Messages</h1>
          <p className="text-xs text-muted-foreground">Chat with anyone anonymously</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="pl-10 bg-input border-border"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              {searching ? 'Searching...' : `Search Results (${searchResults.length})`}
            </h2>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => startConversation(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-foreground">{result.username}</p>
                      <p className="text-xs text-muted-foreground">Click to message</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : !searching ? (
              <p className="text-muted-foreground text-sm">No users found</p>
            ) : null}
          </div>
        )}

        {/* Conversations List */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Recent Conversations
          </h2>
          
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground">Search for a username to start chatting</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => startConversation(conv.user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center relative">
                    <User className="w-5 h-5 text-accent" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-foreground">{conv.user.username}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.lastMessage.created_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={cn(
                        "text-sm truncate",
                        conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {conv.lastMessage.sender_id === user.id ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DirectMessagesPage;
