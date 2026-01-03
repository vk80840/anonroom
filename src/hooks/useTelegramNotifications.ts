import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface TelegramConnection {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_username: string | null;
  connected_at: string;
  is_active: boolean;
}

export const useTelegramNotifications = () => {
  const { user } = useAuthStore();
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      checkConnection();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const checkConnection = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'check_connection', user_id: user.id },
      });
      
      if (data?.connected) {
        setConnection(data.connection);
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Error checking telegram connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeConnection = async () => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { action: 'revoke', user_id: user.id },
      });
      
      if (data?.success) {
        setConnection(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error revoking connection:', error);
      return false;
    }
  };

  const sendNotification = async (recipientId: string, title: string, body: string) => {
    try {
      await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'send_notification', 
          user_id: recipientId, 
          title, 
          body 
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return {
    connection,
    loading,
    isConnected: !!connection,
    checkConnection,
    revokeConnection,
    sendNotification,
  };
};
