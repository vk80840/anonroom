import { useState, useRef, ReactNode } from 'react';
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface SwipeableMessageProps {
  children: ReactNode;
  onSwipeReply: () => void;
}

const SwipeableMessage = ({ children, onSwipeReply }: SwipeableMessageProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const { playSwipe } = useSoundEffects();

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Only allow right swipe
    if (diff > 0) {
      setOffsetX(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > 50) {
      playSwipe();
      onSwipeReply();
    }
    setOffsetX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    if (diff > 0) {
      setOffsetX(Math.min(diff, 80));
    }
  };

  const handleMouseUp = () => {
    if (offsetX > 50) {
      playSwipe();
      onSwipeReply();
    }
    setIsDragging(false);
    setOffsetX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Reply indicator */}
      <div 
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity',
          offsetX > 20 ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: offsetX }}
      >
        <div className={cn(
          'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center transition-transform',
          offsetX > 50 ? 'scale-110' : 'scale-100'
        )}>
          <Reply className="w-4 h-4 text-primary" />
        </div>
      </div>
      
      {/* Message content */}
      <div
        className={cn(
          'transition-transform',
          !isDragging && 'transition-all duration-200'
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableMessage;
