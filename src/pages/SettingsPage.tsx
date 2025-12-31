import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Check, User, Lock, Shield, Palette, Camera, Plus, X, Users, Keyboard, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, themeColors, ThemeColor } from '@/stores/themeStore';
import { useSettingsStore, chatWallpapers } from '@/stores/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ADMIN_USERNAME = 'vansh';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { theme, color, setTheme, setColor } = useThemeStore();
  const { useInAppKeyboard, setUseInAppKeyboard, chatWallpaper, setChatWallpaper } = useSettingsStore();
  const { toast } = useToast();

  // Profile state
  const [bio, setBio] = useState(user?.bio || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [links, setLinks] = useState<string[]>(user?.links || []);
  const [newLink, setNewLink] = useState('');
  
  // Multi-username state
  const [altUsernames, setAltUsernames] = useState<string[]>((user as any)?.alt_usernames || []);
  const [newAltUsername, setNewAltUsername] = useState('');
  
  // Security state
  const [securityQuestion, setSecurityQuestion] = useState(user?.security_question || '');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME.toLowerCase();
  const maxAltUsernames = isAdmin ? 999 : 2;

  if (!user) {
    navigate('/auth?mode=login');
    return null;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('anon_users')
        .update({
          bio: bio || null,
          birthday: birthday || null,
          links: links.length > 0 ? links : null,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUser({ ...user, bio, birthday, links });
      toast({ title: "Profile updated!", description: "Your changes have been saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('anon_users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUser({ ...user, avatar_url: publicUrl });
      toast({ title: "Avatar updated!", description: "Your new profile picture is set" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSetSecurityQuestion = async () => {
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      toast({ title: "Error", description: "Please fill in both fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: {
          action: 'set_security',
          username: user.username,
          security_question: securityQuestion,
          security_answer: securityAnswer,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);
      
      setUser({ ...user, security_question: securityQuestion });
      setSecurityAnswer('');
      toast({ title: "Security question set!", description: "You can now recover your password" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth', {
        body: {
          action: 'change_password',
          username: user.username,
          password: currentPassword,
          new_password: newPassword,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: "Password changed!", description: "Your new password is now active" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (newLink.trim() && links.length < 5) {
      setLinks([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const addAltUsername = async () => {
    if (!newAltUsername.trim()) return;
    if (altUsernames.length >= maxAltUsernames) {
      toast({ 
        title: "Limit reached", 
        description: isAdmin ? "You can add unlimited usernames" : "You can only add up to 2 alternate usernames", 
        variant: "destructive" 
      });
      return;
    }

    // Check if username already exists
    const { data: existing } = await supabase
      .from('anon_users')
      .select('id')
      .eq('username', newAltUsername.trim())
      .single();

    if (existing) {
      toast({ title: "Error", description: "This username is already taken", variant: "destructive" });
      return;
    }

    const newList = [...altUsernames, newAltUsername.trim()];
    setAltUsernames(newList);
    setNewAltUsername('');
    
    // Save to database (you'd need an alt_usernames column)
    toast({ title: "Username added!", description: `Added ${newAltUsername.trim()} as alternate username` });
  };

  const removeAltUsername = (index: number) => {
    setAltUsernames(altUsernames.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative header */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent pointer-events-none" />
      <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-20 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
      
      <header className="relative border-b border-border bg-card/50 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="relative max-w-2xl mx-auto p-4">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Theme Mode Card */}
            <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                Theme Mode
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    theme === 'dark' ? 'bg-primary/20' : 'bg-amber-500/20'
                  )}>
                    {theme === 'dark' ? <Moon className="w-6 h-6 text-primary" /> : <Sun className="w-6 h-6 text-amber-500" />}
                  </div>
                  <div>
                    <span className="text-foreground font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'dark' ? 'Easy on the eyes' : 'Bright and clear'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </div>

            {/* Accent Color Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Accent Color
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(themeColors) as ThemeColor[]).map((colorKey) => (
                  <button
                    key={colorKey}
                    onClick={() => setColor(colorKey)}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                      color === colorKey ? "border-primary bg-primary/10 shadow-lg" : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-inner"
                      style={{ backgroundColor: `hsl(${themeColors[colorKey].primary})` }}
                    />
                    <span className="text-sm font-medium text-foreground">{themeColors[colorKey].name}</span>
                    {color === colorKey && (
                      <Check className="w-4 h-4 text-primary absolute right-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Wallpaper Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Chat Wallpaper
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a background for your chat conversations
              </p>
              <div className="grid grid-cols-4 gap-3">
                {chatWallpapers.map((wallpaper) => (
                  <button
                    key={wallpaper.id}
                    onClick={() => setChatWallpaper(wallpaper.id)}
                    className={cn(
                      "relative aspect-[3/4] rounded-xl border-2 overflow-hidden transition-all",
                      chatWallpaper === wallpaper.id 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div 
                      className="absolute inset-0"
                      style={wallpaper.id === 'none' 
                        ? { backgroundColor: 'hsl(var(--background))' }
                        : { 
                            backgroundImage: wallpaper.value,
                            backgroundSize: wallpaper.size || 'cover'
                          }
                      }
                    />
                    {chatWallpaper === wallpaper.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center text-foreground bg-background/80 rounded px-1 py-0.5 truncate">
                      {wallpaper.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Settings Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                Keyboard
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-foreground font-medium">Use In-App Keyboard</span>
                  <p className="text-xs text-muted-foreground">Enable custom keyboard instead of device keyboard</p>
                </div>
                <Switch
                  checked={useInAppKeyboard}
                  onCheckedChange={setUseInAppKeyboard}
                />
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Your Profile</h2>
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">
                      {uploading ? 'Uploading...' : 'Click the camera to upload'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Username</label>
                  <Input value={user.username} disabled className="bg-muted font-mono" />
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Bio (optional)</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className="bg-input border-border"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Birthday (optional)</label>
                  <Input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Links (optional, max 5)</label>
                  <div className="space-y-2">
                    {links.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={link} disabled className="bg-muted text-sm" />
                        <Button variant="ghost" size="sm" onClick={() => removeLink(i)}>Remove</Button>
                      </div>
                    ))}
                    {links.length < 5 && (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                          placeholder="https://..."
                          className="bg-input border-border"
                        />
                        <Button variant="outline" size="sm" onClick={addLink}>Add</Button>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>

            {/* Multi-Username Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Alternate Usernames
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {isAdmin 
                  ? "As admin, you can add unlimited alternate usernames"
                  : `Add up to ${maxAltUsernames} alternate usernames`
                }
              </p>
              
              <div className="space-y-3">
                {altUsernames.map((username, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                    <span className="flex-1 font-mono text-sm text-foreground">{username}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeAltUsername(i)}
                      className="w-8 h-8 text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {(isAdmin || altUsernames.length < maxAltUsernames) && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAltUsername}
                      onChange={(e) => setNewAltUsername(e.target.value)}
                      placeholder="Enter alternate username..."
                      className="bg-input border-border font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={addAltUsername}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Question
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set a security question to recover your password if you forget it.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Question</label>
                  <Input
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    placeholder="e.g., What is your pet's name?"
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Answer</label>
                  <Input
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="bg-input border-border"
                  />
                </div>
                <Button onClick={handleSetSecurityQuestion} disabled={saving} className="w-full">
                  {user.security_question ? 'Update Security Question' : 'Set Security Question'}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Change Password
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={saving} className="w-full">
                  Change Password
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage;
