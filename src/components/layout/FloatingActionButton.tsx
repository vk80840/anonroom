import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Hash, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onNewGroup?: () => void;
  onNewChannel?: () => void;
  onNewDM?: () => void;
}

const FloatingActionButton = ({ onNewGroup, onNewChannel, onNewDM }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: Users, label: 'New Group', onClick: onNewGroup, color: 'bg-blue-500' },
    { icon: Hash, label: 'New Channel', onClick: onNewChannel, color: 'bg-green-500' },
    { icon: MessageCircle, label: 'New Chat', onClick: onNewDM, color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-3">
      {/* Action buttons */}
      {actions.map((action, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-3 transition-all duration-300',
            isOpen 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
          style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
        >
          <span className="bg-card text-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg">
            {action.label}
          </span>
          <button
            onClick={() => {
              action.onClick?.();
              setIsOpen(false);
            }}
            className={cn(
              'w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95',
              action.color
            )}
          >
            <action.icon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl',
          isOpen && 'rotate-45 bg-muted text-muted-foreground'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default FloatingActionButton;
