import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface UserPreview {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

interface MentionTextProps {
  content: string;
  currentUserId?: string;
}

const MentionText = ({ content, currentUserId }: MentionTextProps) => {
  const navigate = useNavigate();
  const [userCache, setUserCache] = useState<Record<string, UserPreview | null>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});

  const fetchUser = async (username: string) => {
    if (userCache[username] !== undefined || loadingUsers[username]) return;
    
    setLoadingUsers(prev => ({ ...prev, [username]: true }));
    
    try {
      const { data } = await supabase
        .from('anon_users')
        .select('id, username, bio, avatar_url, created_at')
        .ilike('username', username)
        .single();
      
      setUserCache(prev => ({ ...prev, [username]: data as UserPreview | null }));
    } catch {
      setUserCache(prev => ({ ...prev, [username]: null }));
    } finally {
      setLoadingUsers(prev => ({ ...prev, [username]: false }));
    }
  };

  // Parse content for @mentions
  const parts = content.split(/(@\w+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const username = part.slice(1).toLowerCase();
          
          return (
            <HoverCard key={index} openDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  className="text-primary font-semibold hover:underline cursor-pointer inline"
                  onMouseEnter={() => fetchUser(username)}
                  onClick={() => {
                    const user = userCache[username];
                    if (user && user.id !== currentUserId) {
                      navigate(`/dm/${user.id}`);
                    } else if (user) {
                      navigate(`/profile/${user.id}`);
                    }
                  }}
                >
                  {part}
                </button>
              </HoverCardTrigger>
              <HoverCardContent 
                className="w-72 p-0 overflow-hidden bg-card border-border"
                side="top"
              >
                {loadingUsers[username] ? (
                  <div className="p-4 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : userCache[username] ? (
                  <div>
                    {/* Header with gradient */}
                    <div className="h-16 bg-gradient-to-r from-primary/30 to-accent/30" />
                    
                    {/* Avatar overlapping header */}
                    <div className="px-4 -mt-8">
                      <div className="w-16 h-16 rounded-full bg-card border-4 border-card flex items-center justify-center overflow-hidden">
                        {userCache[username]?.avatar_url ? (
                          <img 
                            src={userCache[username]?.avatar_url} 
                            alt={username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {/* User info */}
                    <div className="px-4 pb-4 pt-2">
                      <h4 className="font-mono font-bold text-foreground">
                        @{userCache[username]?.username}
                      </h4>
                      
                      {userCache[username]?.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {userCache[username]?.bio}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {new Date(userCache[username]?.created_at || '').toLocaleDateString()}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {userCache[username]?.id !== currentUserId && (
                          <Button 
                            size="sm" 
                            className="flex-1 gap-1"
                            onClick={() => navigate(`/dm/${userCache[username]?.id}`)}
                          >
                            <MessageSquare className="w-3 h-3" />
                            Message
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => navigate(`/profile/${userCache[username]?.id}`)}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">User not found</p>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default MentionText;
