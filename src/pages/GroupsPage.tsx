import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Copy, MessageCircle, Settings, Hash, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Group } from '@/types/database';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<(Group & { member_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    fetchGroups();
  }, [user, navigate]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return { ...group, member_count: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    
    setCreating(true);
    try {
      const insertData: any = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || null,
        created_by: user.id,
      };
      
      if (customCode.trim()) {
        insertData.custom_code = customCode.trim().toLowerCase();
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert(insertData)
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });

      toast({ title: "Group created!", description: `Share code: ${group.custom_code || group.invite_code}` });
      setNewGroupName('');
      setNewGroupDesc('');
      setCustomCode('');
      setCreateOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyInviteCode = (group: Group) => {
    const code = group.custom_code || group.invite_code;
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied" });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono font-semibold text-xl text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dm')} className="hidden sm:flex">
              <UserCircle className="w-4 h-4 mr-2" />
              DMs
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/channels')} className="hidden sm:flex">
              <Hash className="w-4 h-4 mr-2" />
              Channels
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/join')} className="hidden sm:flex">
              Join
            </Button>
            
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Group Name</label>
                    <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Enter group name" className="bg-input border-border" maxLength={50} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Description (optional)</label>
                    <Input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What's this group about?" className="bg-input border-border" maxLength={200} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Custom Code (optional)</label>
                    <Input value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder="e.g., mygroup123" className="bg-input border-border font-mono" maxLength={20} />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for auto-generated code</p>
                  </div>
                  <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating} className="w-full">
                    {creating ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dm')} className="sm:hidden">Direct Messages</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/channels')} className="sm:hidden">Channels</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">Welcome, <span className="text-primary font-mono">{user.username}</span></p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No groups yet</h2>
            <p className="text-muted-foreground mb-6">Create a new group or join one with an invite code</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/join')}>Join with Code</Button>
              <Button onClick={() => setCreateOpen(true)}>Create Group</Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => navigate(`/chat/${group.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyInviteCode(group); }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    {group.custom_code || group.invite_code}
                  </button>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{group.name}</h3>
                {group.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GroupsPage;
