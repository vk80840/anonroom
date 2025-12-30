import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Hash, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'user' | 'group' | 'channel';
  id: string;
  name: string;
  description?: string;
}

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const searchResults: SearchResult[] = [];
      const searchTerm = query.toLowerCase().trim();

      // Search users
      const { data: users } = await supabase
        .from('anon_users_public')
        .select('id, username')
        .ilike('username', `%${searchTerm}%`)
        .neq('id', user?.id || '')
        .limit(5);

      users?.forEach(u => {
        searchResults.push({ type: 'user', id: u.id, name: u.username, description: 'User' });
      });

      // Search groups by invite code or custom code
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, invite_code, custom_code, description')
        .or(`invite_code.ilike.%${searchTerm}%,custom_code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(5);

      groups?.forEach(g => {
        searchResults.push({ 
          type: 'group', 
          id: g.id, 
          name: g.name, 
          description: `Code: ${g.custom_code || g.invite_code}` 
        });
      });

      // Search channels
      const { data: channels } = await supabase
        .from('channels')
        .select('id, name, description')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      channels?.forEach(c => {
        searchResults.push({ type: 'channel', id: c.id, name: `#${c.name}`, description: c.description || 'Channel' });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (result: SearchResult) => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to continue", variant: "destructive" });
      navigate('/auth?mode=login');
      return;
    }

    setOpen(false);
    setQuery('');

    if (result.type === 'user') {
      navigate(`/dm/${result.id}`);
    } else if (result.type === 'group') {
      // Check if member, if not join
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', result.id)
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        await supabase.from('group_members').insert({ group_id: result.id, user_id: user.id });
        toast({ title: "Joined group!", description: result.name });
      }
      navigate(`/chat/${result.id}`);
    } else if (result.type === 'channel') {
      // Check if member, if not join
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', result.id)
        .eq('user_id', user.id)
        .limit(1);

      if (!membership || membership.length === 0) {
        await supabase.from('channel_members').insert({ channel_id: result.id, user_id: user.id });
        toast({ title: "Joined channel!", description: result.name });
      }
      navigate(`/channel/${result.id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user': return User;
      case 'group': return Users;
      case 'channel': return Hash;
      default: return MessageCircle;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Everything</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Username, group code, channel..."
                className="pl-10 pr-10 bg-input border-border"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Searching...</p>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, i) => {
                    const Icon = getIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          result.type === 'user' && "bg-accent/20",
                          result.type === 'group' && "bg-primary/20",
                          result.type === 'channel' && "bg-green-500/20"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4",
                            result.type === 'user' && "text-accent",
                            result.type === 'group' && "text-primary",
                            result.type === 'channel' && "text-green-500"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query.length >= 2 ? (
                <p className="text-center text-muted-foreground py-4">No results found</p>
              ) : (
                <p className="text-center text-muted-foreground py-4">Type to search users, groups, or channels</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
