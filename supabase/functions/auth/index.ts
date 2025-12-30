import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, username, password } = await req.json();
    
    if (!username || !password) {
      console.error('Missing username or password');
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for auth operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'signup') {
      console.log('Processing signup for:', username);
      
      // Check if username exists
      const { data: existing } = await supabase
        .from('anon_users')
        .select('id')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('Username already taken:', username);
        return new Response(
          JSON.stringify({ error: 'Username already taken' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      console.log('Creating user with hashed password');

      // Create user with hashed password
      const { data: newUser, error } = await supabase
        .from('anon_users')
        .insert({
          username: username.toLowerCase(),
          password_hash: hashedPassword,
        })
        .select('id, username, created_at, last_seen_at')
        .single();

      if (error) {
        console.error('Signup error:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully:', newUser.username);
      return new Response(
        JSON.stringify({ user: newUser }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'login') {
      console.log('Processing login for:', username);
      
      // Find user by username
      const { data: users, error } = await supabase
        .from('anon_users')
        .select('id, username, password_hash, created_at, last_seen_at')
        .eq('username', username.toLowerCase())
        .limit(1);

      if (error) {
        console.error('Login query error:', error);
        return new Response(
          JSON.stringify({ error: 'Login failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!users || users.length === 0) {
        console.log('Username not found:', username);
        return new Response(
          JSON.stringify({ error: 'Username not found' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const user = users[0];
      
      // Verify password using bcrypt
      let passwordValid = false;
      
      // Check if password is already hashed (starts with $2a$ or $2b$)
      if (user.password_hash.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, user.password_hash);
      } else {
        // Legacy plaintext comparison (for migration period)
        passwordValid = user.password_hash === password;
        
        // If valid, upgrade to hashed password
        if (passwordValid) {
          console.log('Upgrading plaintext password to bcrypt hash');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          await supabase
            .from('anon_users')
            .update({ password_hash: hashedPassword })
            .eq('id', user.id);
        }
      }

      if (!passwordValid) {
        console.log('Invalid password for:', username);
        return new Response(
          JSON.stringify({ error: 'Incorrect password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last_seen_at
      await supabase
        .from('anon_users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      console.log('Login successful for:', username);
      
      // Return user without password_hash
      return new Response(
        JSON.stringify({ 
          user: {
            id: user.id,
            username: user.username,
            created_at: user.created_at,
            last_seen_at: user.last_seen_at
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "login" or "signup"' }),
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
