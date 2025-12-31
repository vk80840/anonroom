import { useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutedChats } from '@/hooks/useMutedChats';
import { useToast } from '@/hooks/use-toast';

interface MuteButtonProps {
  chatType: 'dm' | 'group' | 'channel';
  chatId: string;
}

const MuteButton = ({ chatType, chatId }: MuteButtonProps) => {
  const { isMuted, muteChat, unmuteChat } = useMutedChats();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const muted = isMuted(chatType, chatId);

  const handleMute = async (duration: 'forever' | '1h' | '8h' | '1d' | '1w') => {
    setLoading(true);
    const success = await muteChat(chatType, chatId, duration);
    setLoading(false);
    
    if (success) {
      const durationText = duration === 'forever' ? 'indefinitely' : 
        duration === '1h' ? 'for 1 hour' :
        duration === '8h' ? 'for 8 hours' :
        duration === '1d' ? 'for 1 day' : 'for 1 week';
      toast({ 
        title: "Chat muted", 
        description: `Notifications muted ${durationText}` 
      });
    }
  };

  const handleUnmute = async () => {
    setLoading(true);
    await unmuteChat(chatType, chatId);
    setLoading(false);
    toast({ title: "Chat unmuted", description: "You will receive notifications again" });
  };

  if (muted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleUnmute}
        disabled={loading}
        className="text-muted-foreground hover:text-foreground"
      >
        <BellOff className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={loading}
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleMute('1h')} className="gap-2">
          <Clock className="w-4 h-4" />
          Mute for 1 hour
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMute('8h')} className="gap-2">
          <Clock className="w-4 h-4" />
          Mute for 8 hours
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMute('1d')} className="gap-2">
          <Clock className="w-4 h-4" />
          Mute for 1 day
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMute('1w')} className="gap-2">
          <Clock className="w-4 h-4" />
          Mute for 1 week
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleMute('forever')} className="gap-2">
          <BellOff className="w-4 h-4" />
          Mute forever
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MuteButton;
