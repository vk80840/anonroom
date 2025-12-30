import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyPreviewProps {
  username: string;
  content: string;
  onCancel: () => void;
}

const ReplyPreview = ({ username, content, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-l-2 border-primary">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-primary">Replying to {username}</p>
        <p className="text-sm text-muted-foreground truncate">{content}</p>
      </div>
      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ReplyPreview;
