import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm"
            maxLength={500}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
            {message.length}/500
          </span>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all chat-glow"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
