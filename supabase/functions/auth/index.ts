import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple token generator
const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// In-memory reset tokens (expire after 10 minutes)
const resetTokens = new Map<string, { username: string; expires: number }>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, username } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get security question
    if (action === 'get_security_question') {
      if (!username) {
        return new Response(
          JSON.stringify({ error: 'Username is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users } = await supabase
        .from('anon_users')
        .select('security_question')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Username not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ security_question: users[0].security_question }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify security answer
    if (action === 'verify_security_answer') {
      const { answer } = body;
      if (!username || !answer) {
        return new Response(
          JSON.stringify({ error: 'Username and answer are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users } = await supabase
        .from('anon_users')
        .select('security_answer_hash')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (!users || users.length === 0 || !users[0].security_answer_hash) {
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const valid = await bcrypt.compare(answer.toLowerCase().trim(), users[0].security_answer_hash);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Incorrect answer' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate reset token
      const token = generateToken();
      resetTokens.set(token, { username: username.toLowerCase(), expires: Date.now() + 600000 });

      return new Response(
        JSON.stringify({ reset_token: token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset password with token
    if (action === 'reset_password') {
      const { reset_token, new_password } = body;
      if (!reset_token || !new_password) {
        return new Response(
          JSON.stringify({ error: 'Token and new password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = resetTokens.get(reset_token);
      if (!tokenData || tokenData.expires < Date.now() || tokenData.username !== username?.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired reset token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      const { error } = await supabase
        .from('anon_users')
        .update({ password_hash: hashedPassword })
        .eq('username', tokenData.username);

      if (error) throw error;

      resetTokens.delete(reset_token);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set security question
    if (action === 'set_security') {
      const { security_question, security_answer } = body;
      if (!username || !security_question || !security_answer) {
        return new Response(
          JSON.stringify({ error: 'All fields are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const answerHash = await bcrypt.hash(security_answer.toLowerCase().trim(), salt);

      const { error } = await supabase
        .from('anon_users')
        .update({
          security_question: security_question.trim(),
          security_answer_hash: answerHash,
        })
        .eq('username', username.toLowerCase());

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Change password
    if (action === 'change_password') {
      const { password, new_password } = body;
      if (!username || !password || !new_password) {
        return new Response(
          JSON.stringify({ error: 'All fields are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users } = await supabase
        .from('anon_users')
        .select('id, password_hash')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = users[0];
      let passwordValid = false;

      if (user.password_hash.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, user.password_hash);
      } else {
        passwordValid = user.password_hash === password;
      }

      if (!passwordValid) {
        return new Response(
          JSON.stringify({ error: 'Current password is incorrect' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      const { error } = await supabase
        .from('anon_users')
        .update({ password_hash: hashedPassword })
        .eq('id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Original signup/login
    const { password } = body;
    
    if (action === 'signup' || action === 'login') {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (username.length < 3 || username.length > 20) {
        return new Response(
          JSON.stringify({ error: 'Username must be 3-20 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'signup') {
      console.log('Processing signup for:', username);
      
      const { data: existing } = await supabase
        .from('anon_users')
        .select('id')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { data: newUser, error } = await supabase
        .from('anon_users')
        .insert({ username: username.toLowerCase(), password_hash: hashedPassword })
        .select('id, username, created_at, last_seen_at, bio, birthday, links, security_question')
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ user: newUser }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'login') {
      console.log('Processing login for:', username);
      
      const { data: users, error } = await supabase
        .from('anon_users')
        .select('id, username, password_hash, created_at, last_seen_at, bio, birthday, links, security_question')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Username not found' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = users[0];
      let passwordValid = false;
      
      if (user.password_hash.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, user.password_hash);
      } else {
        passwordValid = user.password_hash === password;
        if (passwordValid) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          await supabase.from('anon_users').update({ password_hash: hashedPassword }).eq('id', user.id);
        }
      }

      if (!passwordValid) {
        return new Response(
          JSON.stringify({ error: 'Incorrect password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('anon_users').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);

      return new Response(
        JSON.stringify({ 
          user: {
            id: user.id,
            username: user.username,
            created_at: user.created_at,
            last_seen_at: user.last_seen_at,
            bio: user.bio,
            birthday: user.birthday,
            links: user.links,
            security_question: user.security_question,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
