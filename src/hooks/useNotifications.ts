import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface NotificationPreferences {
  messages_enabled: boolean;
  games_enabled: boolean;
  mentions_enabled: boolean;
  sound_enabled: boolean;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useNotifications() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages_enabled: true,
    games_enabled: true,
    mentions_enabled: true,
    sound_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load preferences from database
  useEffect(() => {
    if (!user) return;
    
    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        const prefs = data as any;
        setPreferences({
          messages_enabled: prefs.messages_enabled,
          games_enabled: prefs.games_enabled,
          mentions_enabled: prefs.mentions_enabled,
          sound_enabled: prefs.sound_enabled,
        });
      }
      
      // Check if already subscribed
      const { data: subData } = await supabase
        .from('push_subscriptions' as any)
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      setIsSubscribed(!!subData && subData.length > 0);
      setLoading(false);
    };
    
    loadPreferences();
  }, [user]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, user]);

  const subscribeToNotifications = async () => {
    if (!user) return;
    
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Generate a VAPID public key - in production, this should be stored as an environment variable
        // For now, we'll use a placeholder that allows local testing
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }
      
      const subscriptionJson = subscription.toJSON();
      
      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions' as any)
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
        }, {
          onConflict: 'user_id,endpoint',
        });
      
      if (error) throw error;
      setIsSubscribed(true);
      
      // Initialize preferences if not exist
      await supabase
        .from('notification_preferences' as any)
        .upsert({
          user_id: user.id,
          messages_enabled: true,
          games_enabled: true,
          mentions_enabled: true,
          sound_enabled: true,
        }, {
          onConflict: 'user_id',
        });
      
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      await supabase
        .from('push_subscriptions' as any)
        .delete()
        .eq('user_id', user.id);
      
      setIsSubscribed(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    
    await supabase
      .from('notification_preferences' as any)
      .upsert({
        user_id: user.id,
        ...updated,
      }, {
        onConflict: 'user_id',
      });
  };

  // Send a local notification (for testing)
  const showLocalNotification = (title: string, body: string, url?: string) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: 'local-notification',
      });
      
      notification.onclick = () => {
        window.focus();
        if (url) {
          window.location.href = url;
        }
        notification.close();
      };
    }
  };

  return {
    permission,
    isSupported,
    isSubscribed,
    preferences,
    loading,
    requestPermission,
    unsubscribe,
    updatePreferences,
    showLocalNotification,
  };
}
