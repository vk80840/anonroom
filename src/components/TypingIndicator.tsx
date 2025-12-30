interface TypingIndicatorProps {
  username: string;
}

const TypingIndicator = ({ username }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 message-appear">
      <span className="text-xs text-muted-foreground font-mono">{username}</span>
      <div className="typing-indicator flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      </div>
    </div>
  );
};

export default TypingIndicator;
