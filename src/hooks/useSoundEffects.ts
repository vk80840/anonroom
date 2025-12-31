import { useCallback, useRef, useEffect } from 'react';

const createOscillator = (
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback(() => {
    const ctx = getAudioContext();
    createOscillator(ctx, 800, 0.05, 'sine', 0.15);
  }, [getAudioContext]);

  const playSuccess = useCallback(() => {
    const ctx = getAudioContext();
    createOscillator(ctx, 523, 0.1, 'sine', 0.2);
    setTimeout(() => createOscillator(ctx, 659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => createOscillator(ctx, 784, 0.15, 'sine', 0.2), 200);
  }, [getAudioContext]);

  const playError = useCallback(() => {
    const ctx = getAudioContext();
    createOscillator(ctx, 200, 0.2, 'square', 0.1);
  }, [getAudioContext]);

  const playNotification = useCallback(() => {
    const ctx = getAudioContext();
    createOscillator(ctx, 880, 0.1, 'sine', 0.15);
    setTimeout(() => createOscillator(ctx, 1047, 0.15, 'sine', 0.15), 100);
  }, [getAudioContext]);

  const playSend = useCallback(() => {
    const ctx = getAudioContext();
    createOscillator(ctx, 600, 0.08, 'triangle', 0.15);
    setTimeout(() => createOscillator(ctx, 800, 0.08, 'triangle', 0.1), 50);
  }, [getAudioContext]);

  const playSwipe = useCallback(() => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, [getAudioContext]);

  return {
    playClick,
    playSuccess,
    playError,
    playNotification,
    playSend,
    playSwipe,
  };
};
