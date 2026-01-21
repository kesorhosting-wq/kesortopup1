import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wallet, History, LogOut, Loader2, Mail, Calendar, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSite } from '@/contexts/SiteContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import KhmerFrame from '@/components/KhmerFrame';

interface Profile {
  display_name: string;
  email: string;
  wallet_balance: number;
  created_at: string;
}

interface Order {
  id: string;
  game_name: string;
  package_name: string;
  amount: number;
  status: string;
  created_at: string;
  player_id: string;
}

const UserProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile({
          display_name: profileData.display_name || '',
          email: profileData.email || user.email || '',
          wallet_balance: profileData.wallet_balance || 0,
          created_at: profileData.created_at
        });
        setDisplayName(profileData.display_name || '');
      }

      // Get orders
      const { data: ordersData } = await supabase
        .from('topup_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setOrders((ordersData as Order[]) || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, display_name: displayName } : null);
      setIsEditing(false);
      toast({ title: 'Profile updated!' });
    } catch (error: any) {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({ title: 'Signed out successfully' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/20';
      case 'failed': return 'text-red-500 bg-red-500/20';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account - {settings.siteName}</title>
      </Helmet>

      <Header />

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Profile Header */}
        <KhmerFrame className="mb-6">
          <div className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="max-w-xs border-gold/50"
                  />
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setDisplayName(profile?.display_name || ''); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{profile?.display_name || 'User'}</h1>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {profile?.email}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </KhmerFrame>

        {/* Wallet Quick View */}
        <Card className="border-gold/30 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold">${(profile?.wallet_balance || 0).toFixed(2)}</p>
                </div>
              </div>
              <Link to="/wallet">
                <Button className="bg-gold hover:bg-gold-dark text-primary-foreground">
                  Manage Wallet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Orders Tab */}
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-gold" />
              Order History
            </CardTitle>
            <CardDescription>Your past game top-up orders</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders yet</p>
                <Link to="/">
                  <Button className="mt-4 bg-gold hover:bg-gold-dark text-primary-foreground">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="font-medium">{order.game_name}</p>
                      <p className="text-sm text-muted-foreground">{order.package_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Player: {order.player_id} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${order.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UserProfilePage;
