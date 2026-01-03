import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Users,
  Hash,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  Bookmark,
  Phone,
  HelpCircle,
  Shield,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface TelegramSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const TelegramSidebar = ({ isOpen, onClose }: TelegramSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: Users, label: 'New Group', action: () => navigate('/?action=newgroup') },
    { icon: Hash, label: 'New Channel', action: () => navigate('/?action=newchannel') },
    { icon: User, label: 'Contacts', action: () => navigate('/') },
    { icon: Plus, label: 'Add Account', action: () => navigate('/auth?mode=login'), badge: undefined },
    { icon: Settings, label: 'Settings', action: () => navigate('/settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth?mode=login');
    onClose();
  };

  const handleNavigation = (action: () => void) => {
    action();
    onClose();
  };

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-card z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with user info */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-primary-foreground hover:bg-white/20"
            >
              {mounted && (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
            </Button>
          </div>

          {/* User avatar */}
          <button
            onClick={() => handleNavigation(() => navigate(`/profile/${user.id}`))}
            className="flex items-center gap-4 w-full text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{user.username}</p>
              <p className="text-sm opacity-80 truncate">@{user.username.toLowerCase()}</p>
            </div>
          </button>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.action)}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-foreground hover:bg-primary/10 transition-colors"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="h-px bg-border my-2 mx-4" />

          <button
            onClick={() => {
              navigator.clipboard.writeText('https://anonroom.lovable.app');
              onClose();
            }}
            className="w-full flex items-center gap-4 px-6 py-3.5 text-foreground hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">Invite Friends</span>
          </button>
          
          <a
            href="https://t.me/Anonroom_robot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-4 px-6 py-3.5 text-foreground hover:bg-primary/10 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-sm font-medium">Get Notifications (TG)</span>
          </a>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>

          <div className="mt-4 px-4">
            <p className="text-xs text-muted-foreground text-center">
              AnonChat v1.0.0 • Made with 💜
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TelegramSidebar;
