import { MessageCircle } from 'lucide-react';

const EmptyChat = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center chat-glow">
        <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="font-mono text-lg text-foreground mb-2">
          Welcome to the void
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start chatting anonymously. No registration. No tracking. 
          Your messages disappear when you leave.
        </p>
      </div>
      <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
        <div className="w-2 h-2 rounded-full bg-online pulse-online" />
        <span className="text-xs text-muted-foreground font-mono">
          Encryption enabled
        </span>
      </div>
    </div>
  );
};

export default EmptyChat;
