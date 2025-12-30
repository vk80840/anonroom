import { format } from 'date-fns';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[75%] message-appear',
        isOwn ? 'self-end items-end' : 'self-start items-start'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-mono text-xs',
          isOwn ? 'text-primary' : 'text-accent'
        )}>
          {isOwn ? 'You' : message.username}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
      
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl',
          isOwn
            ? 'bg-message-own border border-primary/20 rounded-br-md'
            : 'bg-message-other border border-border rounded-bl-md'
        )}
      >
        <p className="text-sm text-foreground leading-relaxed break-words">
          {message.text}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
