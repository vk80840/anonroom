import { useState } from 'react';
import { MoreVertical, Reply, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SwipeableMessage from './SwipeableMessage';
import MentionText from './MentionText';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuthStore } from '@/stores/authStore';

interface MessageBubbleProps {
  id: string;
  content: string;
  username: string;
  createdAt: string;
  isOwn: boolean;
  replyTo?: {
    content: string;
    username: string;
  } | null;
  onReply: () => void;
  onEdit: (newContent: string) => void;
  onDelete: () => void;
}

const MessageBubble = ({
  id,
  content,
  username,
  createdAt,
  isOwn,
  replyTo,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const { playClick, playSuccess } = useSoundEffects();
  const { user } = useAuthStore();

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit(editContent.trim());
      playSuccess();
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleReply = () => {
    playClick();
    onReply();
  };

  const handleDelete = () => {
    playClick();
    onDelete();
  };

  const messageContent = (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[75%] message-appear group',
        isOwn ? 'ml-auto items-end' : 'items-start'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('font-mono text-xs', isOwn ? 'text-primary' : 'text-accent')}>
          {username}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(createdAt), 'HH:mm')}
        </span>
      </div>

      <div className="flex items-start gap-1">
        {!isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleReply}>
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl relative',
            isOwn
              ? 'bg-message-own border border-primary/20 rounded-br-md'
              : 'bg-message-other border border-border rounded-bl-md'
          )}
        >
          {replyTo && (
            <div className="mb-2 pl-2 border-l-2 border-primary/50 text-xs">
              <p className="font-mono text-primary/70">{replyTo.username}</p>
              <p className="text-muted-foreground truncate max-w-[200px]">{replyTo.content}</p>
            </div>
          )}
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 bg-transparent border-b border-primary/50 focus:outline-none text-sm text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleSaveEdit}>
                <Check className="w-3 h-3 text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleCancelEdit}>
                <X className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed break-words">
              <MentionText content={content} currentUserId={user?.id} />
            </p>
          )}
        </div>

        {isOwn && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReply}>
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { playClick(); setIsEditing(true); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <SwipeableMessage onSwipeReply={onReply}>
      {messageContent}
    </SwipeableMessage>
  );
};

export default MessageBubble;
