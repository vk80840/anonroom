import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface MutedChat {
  id: string;
  chat_type: 'dm' | 'group' | 'channel';
  chat_id: string;
  muted_until: string | null;
}

export function useMutedChats() {
  const { user } = useAuthStore();
  const [mutedChats, setMutedChats] = useState<MutedChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchMutedChats = async () => {
      // Use raw query since types might not be updated yet
      const { data, error } = await supabase
        .from('muted_chats' as any)
        .select('*')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setMutedChats(data as unknown as MutedChat[]);
      }
      setLoading(false);
    };
    
    fetchMutedChats();
  }, [user]);

  const isMuted = useCallback((chatType: 'dm' | 'group' | 'channel', chatId: string) => {
    const muted = mutedChats.find(m => m.chat_type === chatType && m.chat_id === chatId);
    if (!muted) return false;
    
    // Check if mute has expired
    if (muted.muted_until) {
      const muteEnd = new Date(muted.muted_until);
      if (muteEnd < new Date()) {
        // Mute has expired, remove it
        unmuteChat(chatType, chatId);
        return false;
      }
    }
    
    return true;
  }, [mutedChats]);

  const muteChat = async (
    chatType: 'dm' | 'group' | 'channel', 
    chatId: string, 
    duration?: 'forever' | '1h' | '8h' | '1d' | '1w'
  ) => {
    if (!user) return;
    
    let mutedUntil: string | null = null;
    
    if (duration && duration !== 'forever') {
      const now = new Date();
      switch (duration) {
        case '1h':
          now.setHours(now.getHours() + 1);
          break;
        case '8h':
          now.setHours(now.getHours() + 8);
          break;
        case '1d':
          now.setDate(now.getDate() + 1);
          break;
        case '1w':
          now.setDate(now.getDate() + 7);
          break;
      }
      mutedUntil = now.toISOString();
    }
    
    const { data, error } = await supabase
      .from('muted_chats' as any)
      .upsert({
        user_id: user.id,
        chat_type: chatType,
        chat_id: chatId,
        muted_until: mutedUntil,
      }, {
        onConflict: 'user_id,chat_type,chat_id',
      })
      .select()
      .single();
    
    if (!error && data) {
      setMutedChats(prev => {
        const filtered = prev.filter(m => !(m.chat_type === chatType && m.chat_id === chatId));
        return [...filtered, data as unknown as MutedChat];
      });
    }
    
    return !error;
  };

  const unmuteChat = async (chatType: 'dm' | 'group' | 'channel', chatId: string) => {
    if (!user) return;
    
    await supabase
      .from('muted_chats' as any)
      .delete()
      .eq('user_id', user.id)
      .eq('chat_type', chatType)
      .eq('chat_id', chatId);
    
    setMutedChats(prev => prev.filter(m => !(m.chat_type === chatType && m.chat_id === chatId)));
  };

  return {
    mutedChats,
    loading,
    isMuted,
    muteChat,
    unmuteChat,
  };
}
