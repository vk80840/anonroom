import { Shield, Users } from 'lucide-react';

interface ChatHeaderProps {
  username: string;
  onlineCount: number;
}

const ChatHeader = ({ username, onlineCount }: ChatHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center chat-glow">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-mono font-semibold text-lg text-foreground">
            anon<span className="text-primary">chat</span>
          </h1>
          <p className="text-xs text-muted-foreground">No trace. No identity.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-online pulse-online" />
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground font-mono">{onlineCount}</span>
        </div>
        
        <div className="px-3 py-1.5 rounded-md bg-secondary border border-border">
          <span className="text-xs text-muted-foreground">You are </span>
          <span className="font-mono text-sm text-primary">{username}</span>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
