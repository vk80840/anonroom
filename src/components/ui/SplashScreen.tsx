import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 400);
    const timer2 = setTimeout(() => setPhase('fade'), 1500);
    const timer3 = setTimeout(() => onComplete(), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-all duration-500',
        phase === 'fade' && 'opacity-0 pointer-events-none'
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      {/* Logo container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated shield */}
        <div
          className={cn(
            'relative transition-all duration-500 ease-out',
            phase === 'logo' ? 'scale-150' : 'scale-100'
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" />
          </div>
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Shield className="w-12 h-12 text-primary-foreground animate-bounce" />
          </div>
          {/* Glow ring */}
          <div className="absolute -inset-3 rounded-3xl border-2 border-primary/30 animate-pulse" />
        </div>

        {/* Text */}
        <div
          className={cn(
            'mt-8 text-center transition-all duration-500',
            phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Anon<span className="text-primary">Chat</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Secure • Anonymous • Private</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
