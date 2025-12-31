import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, MessageSquare, Calendar, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  birthday?: string;
  links?: string[];
  created_at: string;
  last_seen_at?: string;
}

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('anon_users')
        .select('id, username, bio, avatar_url, birthday, links, created_at, last_seen_at')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-4">This profile doesn't exist</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-foreground">Profile</h1>
      </header>

      {/* Cover gradient */}
      <div className="h-32 bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Profile content */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar */}
        <div className="flex items-end gap-4 mb-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-card border-4 border-background flex items-center justify-center overflow-hidden shadow-xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            {isOnline(profile.last_seen_at) && (
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-background pulse-online" />
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <h2 className="text-2xl font-bold font-mono text-foreground">@{profile.username}</h2>
            <p className="text-sm text-muted-foreground">
              {isOnline(profile.last_seen_at) ? 'Online' : profile.last_seen_at 
                ? `Last seen ${new Date(profile.last_seen_at).toLocaleDateString()}`
                : 'Offline'
              }
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && currentUser && (
          <div className="flex gap-3 mb-6">
            <Button 
              className="flex-1 gap-2"
              onClick={() => navigate(`/dm/${profile.id}`)}
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </Button>
          </div>
        )}

        {isOwnProfile && (
          <div className="flex gap-3 mb-6">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/settings')}
            >
              Edit Profile
            </Button>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
            <p className="text-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold">Joined</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {profile.birthday && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-lg">🎂</span>
                <span className="text-xs font-semibold">Birthday</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {new Date(profile.birthday).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <LinkIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">Links</span>
            </div>
            <div className="space-y-2">
              {profile.links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.replace(/^https?:\/\//, '').slice(0, 40)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
