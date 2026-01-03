import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = "8577464849:AAF53VH2vc-yiuLL94Xf9mN4i6xkaaBbEFs";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const data = await response.json();
    console.log('Telegram send result:', data);
    return data;
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // Handle Telegram webhook updates
    if (body.message || body.update_id) {
      const update = body;
      const message = update.message;
      
      if (message?.text) {
        const chatId = message.chat.id;
        const text = message.text;
        const telegramUsername = message.from?.username || '';
        
        // Handle /start command
        if (text === '/start') {
          await sendTelegramMessage(chatId, 
            `🔐 <b>Welcome to AnonRoom Notifications!</b>\n\n` +
            `To receive notifications, login with your AnonRoom credentials:\n\n` +
            `Use: /login &lt;username&gt; &lt;password&gt;\n\n` +
            `Example: /login myuser mypassword\n\n` +
            `🔗 Get AnonRoom: anonroom.lovable.app`
          );
          return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Handle /login command
        if (text.startsWith('/login ')) {
          const parts = text.split(' ');
          if (parts.length < 3) {
            await sendTelegramMessage(chatId, '❌ Usage: /login <username> <password>');
            return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          const username = parts[1].toLowerCase();
          const password = parts.slice(2).join(' ');
          
          // Verify credentials
          const { data: users } = await supabase
            .from('anon_users')
            .select('id, username, password_hash')
            .eq('username', username)
            .limit(1);
          
          if (!users || users.length === 0) {
            await sendTelegramMessage(chatId, '❌ Username not found. Please check and try again.');
            return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          const user = users[0];
          
          // Verify password (simple check for SHA-256 hash)
          let passwordValid = false;
          if (user.password_hash.startsWith('sha256:')) {
            const parts = user.password_hash.split(':');
            if (parts.length === 3) {
              const salt = parts[1];
              const data = new TextEncoder().encode(password + salt);
              const hashBuffer = await crypto.subtle.digest("SHA-256", data);
              const hashArray = new Uint8Array(hashBuffer);
              const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
              passwordValid = `sha256:${salt}:${hashHex}` === user.password_hash;
            }
          } else if (!user.password_hash.startsWith('$2')) {
            // Plain text legacy
            passwordValid = user.password_hash === password;
          }
          
          if (!passwordValid) {
            await sendTelegramMessage(chatId, '❌ Incorrect password. Please try again.');
            return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          // Save telegram connection
          await supabase
            .from('telegram_connections')
            .upsert({
              user_id: user.id,
              telegram_chat_id: chatId,
              telegram_username: telegramUsername,
              is_active: true,
              connected_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          
          await sendTelegramMessage(chatId, 
            `✅ <b>Connected successfully!</b>\n\n` +
            `You will now receive notifications for:\n` +
            `📩 New messages\n` +
            `🎮 Game invites\n` +
            `👥 Mentions\n\n` +
            `Use /disconnect to stop notifications.`
          );
          
          return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Handle /disconnect command
        if (text === '/disconnect') {
          await supabase
            .from('telegram_connections')
            .update({ is_active: false })
            .eq('telegram_chat_id', chatId);
          
          await sendTelegramMessage(chatId, '✅ Disconnected. You will no longer receive notifications.');
          return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Handle /status command
        if (text === '/status') {
          const { data: connection } = await supabase
            .from('telegram_connections')
            .select('*, anon_users:user_id(username)')
            .eq('telegram_chat_id', chatId)
            .eq('is_active', true)
            .single();
          
          if (connection) {
            await sendTelegramMessage(chatId, 
              `✅ <b>Connected</b>\n\n` +
              `Account: @${(connection as any).anon_users?.username || 'Unknown'}\n` +
              `Connected: ${new Date(connection.connected_at).toLocaleDateString()}`
            );
          } else {
            await sendTelegramMessage(chatId, '❌ Not connected. Use /login to connect.');
          }
          return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Default response for unknown commands
        await sendTelegramMessage(chatId, 
          `Available commands:\n` +
          `/start - Get started\n` +
          `/login <user> <pass> - Connect account\n` +
          `/disconnect - Stop notifications\n` +
          `/status - Check connection`
        );
      }
      
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // API actions from the app
    
    // Check connection status
    if (action === 'check_connection') {
      const { user_id } = body;
      
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .single();
      
      return new Response(
        JSON.stringify({ connected: !!connection, connection }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Revoke connection
    if (action === 'revoke') {
      const { user_id } = body;
      
      // Get chat id before deleting
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('telegram_chat_id')
        .eq('user_id', user_id)
        .single();
      
      if (connection) {
        await sendTelegramMessage(connection.telegram_chat_id, '🔓 Your account has been disconnected from AnonRoom.');
      }
      
      await supabase
        .from('telegram_connections')
        .delete()
        .eq('user_id', user_id);
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Send notification
    if (action === 'send_notification') {
      const { user_id, title, body: messageBody } = body;
      
      const { data: connection } = await supabase
        .from('telegram_connections')
        .select('telegram_chat_id')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .single();
      
      if (!connection) {
        return new Response(
          JSON.stringify({ sent: false, reason: 'no_connection' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const result = await sendTelegramMessage(
        connection.telegram_chat_id, 
        `<b>${title}</b>\n${messageBody}`
      );
      
      return new Response(
        JSON.stringify({ sent: !!result?.ok }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Telegram bot error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
