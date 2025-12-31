import { useState } from 'react';
import { Play, X, Maximize2 } from 'lucide-react';

interface MediaMessageProps {
  url: string;
  type: 'image' | 'video';
  className?: string;
}

const MediaMessage = ({ url, type, className = '' }: MediaMessageProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        {type === 'image' ? (
          <img
            src={url}
            alt="Shared image"
            className={`max-w-xs max-h-64 object-cover rounded-lg cursor-pointer transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setFullscreen(true)}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="relative max-w-xs">
            <video
              src={url}
              className="max-w-xs max-h-64 rounded-lg"
              controls
              preload="metadata"
            />
          </div>
        )}
        
        {type === 'image' && loaded && (
          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="w-4 h-4 text-foreground" />
          </button>
        )}
        
        {!loaded && type === 'image' && (
          <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && type === 'image' && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={url}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};

export default MediaMessage;
