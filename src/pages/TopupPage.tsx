import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle, Loader2, UserCheck, XCircle, Shield, Zap, Sparkles, Wallet, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import ModernPackageCard from '@/components/ModernPackageCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSite } from '@/contexts/SiteContext';
import { useCart } from '@/contexts/CartContext';
import { useFavicon } from '@/hooks/useFavicon';
import { useGameIdCache } from '@/hooks/useGameIdCache';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VerifiedUser {
  username: string;
  id: string;
  serverId?: string;
  accountName?: string;
}

interface GameVerificationConfig {
  requires_zone: boolean;
  default_zone: string | null;
}

const TopupPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { games, paymentMethods, settings, isLoading } = useSite();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  // Update favicon dynamically
  useFavicon(settings.siteIcon);
  
  const game = games.find(g => g.id === gameId);
  
  // Auto-load cached game IDs (24h cache)
  const { cachedUserId, cachedServerId, saveToCache, hasCachedData } = useGameIdCache(gameId);
  
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Database config for zone requirement
  const [gameVerificationConfig, setGameVerificationConfig] = useState<GameVerificationConfig | null>(null);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Fetch game verification config from database
  useEffect(() => {
    const fetchVerificationConfig = async () => {
      if (!game?.name) return;
      
      try {
        // Try exact match first, then fuzzy match
        let { data, error } = await supabase
          .from('game_verification_configs')
          .select('requires_zone, default_zone')
          .eq('is_active', true)
          .ilike('game_name', game.name)
          .maybeSingle();
        
        // If no exact match, try partial match
        if (!data) {
          const result = await supabase
            .from('game_verification_configs')
            .select('requires_zone, default_zone, game_name')
            .eq('is_active', true)
            .ilike('game_name', `%${game.name.split(' ')[0]}%`)
            .limit(10);
          
          if (result.data && result.data.length > 0) {
            // Find best match
            const exactMatch = result.data.find(
              r => r.game_name.toLowerCase() === game.name.toLowerCase()
            );
            const partialMatch = result.data.find(
              r => r.game_name.toLowerCase().includes(game.name.toLowerCase()) ||
                   game.name.toLowerCase().includes(r.game_name.toLowerCase())
            );
            data = exactMatch || partialMatch || result.data[0];
          }
        }
        
        if (data) {
          console.log(`[TopupPage] Loaded config for "${game.name}": requires_zone=${data.requires_zone}`);
          setGameVerificationConfig({ requires_zone: data.requires_zone, default_zone: data.default_zone });
        } else {
          // Default: no zone required
          console.log(`[TopupPage] No config found for "${game.name}", defaulting to no zone`);
          setGameVerificationConfig({ requires_zone: false, default_zone: null });
        }
      } catch (error) {
        console.error('Failed to fetch verification config:', error);
        setGameVerificationConfig({ requires_zone: false, default_zone: null });
      }
    };
    
    fetchVerificationConfig();
  }, [game?.name]);
  
  // Auto-fill cached IDs when available
  useEffect(() => {
    if (hasCachedData && !userId) {
      setUserId(cachedUserId);
      setServerId(cachedServerId);
    }
  }, [hasCachedData, cachedUserId, cachedServerId]);

  // Fetch wallet balance when user is logged in
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', user.id)
          .single();
        setWalletBalance(profile?.wallet_balance || 0);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };
    fetchWalletBalance();
  }, [user]);

  // Show loading state while data is being fetched
  if (isLoading || (game && gameVerificationConfig === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game not found</h1>
          <Link to="/" className="text-gold hover:underline">Go back home</Link>
        </div>
      </div>
    );
  }

  // Game-specific ID field configurations - uses database config for zone requirement
  const getGameIdConfig = (gameName: string) => {
    const normalizedName = gameName.toLowerCase().trim();
    
    // Check database config for zone requirement (this is the source of truth)
    const requiresZone = gameVerificationConfig?.requires_zone ?? false;
    
    // Get label configuration based on game type
    const getFieldLabels = () => {
      // Riot games use Riot ID
      if (normalizedName.includes('valorant') || normalizedName.includes('league of legends') || 
          normalizedName === 'lol' || normalizedName.includes('wild rift') ||
          normalizedName.includes('teamfight tactics') || normalizedName === 'tft' ||
          normalizedName.includes('legends of runeterra') || normalizedName === 'lor') {
        return { userLabel: 'Riot ID', userPlaceholder: 'Name#Tag', example: 'ឧទាហរណ៍: PlayerName#1234' };
      }
      
      // Mobile Legends uses User ID + Server ID
      if (normalizedName.includes('mobile legends') || normalizedName === 'mlbb' || normalizedName.includes('magic chess')) {
        return { userLabel: 'User ID', userPlaceholder: 'បញ្ចូល User ID', serverLabel: 'Server ID', example: 'ឧទាហរណ៍: 123456789 (1234)' };
      }
      
      // Genshin/Honkai/miHoYo games use UID
      if (normalizedName.includes('genshin') || normalizedName.includes('honkai') || 
          normalizedName.includes('zenless zone zero') || normalizedName === 'zzz' ||
          normalizedName.includes('wuthering waves') || normalizedName.includes('tower of fantasy')) {
        return { userLabel: 'UID', userPlaceholder: 'បញ្ចូល UID', serverLabel: 'Server', example: 'ឧទាហរណ៍: 8001234567' };
      }
      
      // PUBG uses Character ID
      if (normalizedName.includes('pubg')) {
        return { userLabel: 'Character ID', userPlaceholder: 'បញ្ចូល Character ID', example: 'ឧទាហរណ៍: 5123456789' };
      }
      
      // COD uses Player UID
      if (normalizedName.includes('call of duty') || normalizedName.includes('cod')) {
        return { userLabel: 'Player UID', userPlaceholder: 'បញ្ចូល Player UID', example: 'ឧទាហរណ៍: 6742123456789' };
      }
      
      // Supercell games use Player Tag
      if (normalizedName.includes('clash of clans') || normalizedName === 'coc' ||
          normalizedName.includes('clash royale') || normalizedName.includes('brawl stars')) {
        return { userLabel: 'Player Tag', userPlaceholder: '#ABC123', example: 'ឧទាហរណ៍: #ABC123XY' };
      }
      
      // TikTok uses Username
      if (normalizedName.includes('tiktok')) {
        return { userLabel: 'TikTok Username', userPlaceholder: '@username', example: 'ឧទាហរណ៍: @yourusername' };
      }
      
      // Zepeto
      if (normalizedName.includes('zepeto')) {
        return { userLabel: 'ZEPETO ID', userPlaceholder: 'បញ្ចូល ZEPETO ID', example: 'ឧទាហរណ៍: abc123xyz' };
      }
      
      // Roblox uses Username
      if (normalizedName.includes('roblox')) {
        return { userLabel: 'Roblox Username', userPlaceholder: 'បញ្ចូល Username', example: 'ឧទាហរណ៍: YourRobloxName' };
      }
      
      // Steam uses Steam ID
      if (normalizedName.includes('steam')) {
        return { userLabel: 'Steam ID', userPlaceholder: 'បញ្ចូល Steam ID', example: 'ឧទាហរណ៍: 76561198012345678' };
      }
      
      // Discord
      if (normalizedName.includes('discord')) {
        return { userLabel: 'Discord Username', userPlaceholder: 'username#0000', example: 'ឧទាហរណ៍: player#1234' };
      }
      
      // Fortnite
      if (normalizedName.includes('fortnite')) {
        return { userLabel: 'Epic Games ID', userPlaceholder: 'បញ្ចូល Epic ID', example: 'ឧទាហរណ៍: EpicUsername' };
      }
      
      // Ragnarok
      if (normalizedName.includes('ragnarok')) {
        return { userLabel: 'Character ID', userPlaceholder: 'បញ្ចូល Character ID', serverLabel: 'Server', example: 'ឧទាហរណ៍: 12345678' };
      }
      
      // State/Survival games
      if (normalizedName.includes('state of survival') || normalizedName.includes('whiteout survival') ||
          normalizedName.includes('puzzles and survival')) {
        return { userLabel: 'Player ID', userPlaceholder: 'បញ្ចូល Player ID', serverLabel: 'State', example: 'ឧទាហរណ៍: 12345678' };
      }
      
      // Default
      return { userLabel: 'Player ID', userPlaceholder: 'បញ្ចូល Player ID', serverLabel: 'Server', example: 'ឧទាហរណ៍: 123456789' };
    };
    
    const labels = getFieldLabels();
    
    // Build fields based on database requires_zone setting
    if (requiresZone) {
      return {
        fields: [
          { key: 'userId', label: labels.userLabel, placeholder: labels.userPlaceholder },
          { key: 'serverId', label: labels.serverLabel || 'Server', placeholder: labels.serverLabel || 'Server', width: 'w-24 sm:w-32' }
        ],
        validation: `សូមបញ្ចូល ${labels.userLabel} និង ${labels.serverLabel || 'Server'}`,
        example: labels.example
      };
    }
    
    // Single field - no zone required
    return {
      fields: [{ key: 'userId', label: labels.userLabel, placeholder: labels.userPlaceholder }],
      validation: `សូមបញ្ចូល ${labels.userLabel}`,
      example: labels.example
    };
  };

  const gameIdConfig = game ? getGameIdConfig(game.name) : null;
  const hasMultipleFields = gameIdConfig && gameIdConfig.fields.length > 1;

  // Handle ID verification using real API
  const handleVerify = async () => {
    if (!userId.trim()) {
      toast({ title: gameIdConfig?.validation || "សូមបញ្ចូល Game ID", variant: "destructive" });
      return;
    }
    
    // For games with server ID, check if it's required
    if (hasMultipleFields && !serverId.trim()) {
      toast({ title: gameIdConfig?.validation || "សូមបញ្ចូល Server ID", variant: "destructive" });
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerifiedUser(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-game-id', {
        body: {
          gameName: game?.name,
          userId: userId.trim(),
          serverId: serverId.trim() || undefined,
        },
      });

      console.log('Verification response:', data, error);

      if (error) {
        let msg = error.message || 'Verification failed';

        // Try to read backend error body when the function returns non-2xx
        const anyErr = error as any;
        if (anyErr?.context && typeof anyErr.context.json === 'function') {
          try {
            const body = await anyErr.context.json();
            msg = body?.error || body?.message || msg;
          } catch {
            // ignore JSON parse failures
          }
        }

        throw new Error(msg);
      }

      if (data?.success) {
        // Enforce real verification only (no placeholder/manual fallbacks)
        if (data?.manualVerification) {
          const errorMsg = data?.message || "Automatic verification is unavailable. Please try again.";
          setVerificationError(errorMsg);
          toast({
            title: "ផ្ទៀងផ្ទាត់បរាជ័យ",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }

        const username = data.username || data.accountName;
        setVerifiedUser({
          username,
          id: userId,
          serverId: serverId || undefined,
          accountName: data.accountName,
        });

        // Save to cache for 24 hours
        saveToCache(userId, serverId);

        toast({
          title: "✓ ផ្ទៀងផ្ទាត់ដោយជោគជ័យ",
          description: `Username: ${username}`,
        });
      } else {
        const errorMsg = data?.error || 'មិនអាចផ្ទៀងផ្ទាត់ ID បានទេ។';
        setVerificationError(errorMsg);
        toast({
          title: "ផ្ទៀងផ្ទាត់បរាជ័យ",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMsg = error?.message || "មិនអាចផ្ទៀងផ្ទាត់ ID បានទេ។ សូមពិនិត្យម្តងទៀត។";
      setVerificationError(errorMsg);
      toast({ 
        title: "ផ្ទៀងផ្ទាត់បរាជ័យ", 
        description: errorMsg,
        variant: "destructive" 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset verification when ID changes
  const handleUserIdChange = (value: string) => {
    setUserId(value);
    setVerifiedUser(null);
    setVerificationError(null);
  };

  const handleServerIdChange = (value: string) => {
    setServerId(value);
    setVerifiedUser(null);
    setVerificationError(null);
  };

  // Render dynamic ID input fields based on game
  const renderIdInputs = () => {
    if (!gameIdConfig) return null;
    
    const fields = gameIdConfig.fields;
    
    return (
      <div className="space-y-2">
        <div className={hasMultipleFields ? 'flex gap-2 sm:gap-4' : ''}>
          {fields.map((field, index) => (
            <div key={field.key} className={field.width || (hasMultipleFields && index === 0 ? 'flex-1' : '')}>
              <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block" style={{ color: settings.frameColor || 'hsl(30 30% 35%)' }}>
                {field.label}
              </label>
              <Input 
                placeholder={field.placeholder}
                value={field.key === 'userId' ? userId : serverId}
                onChange={(e) => field.key === 'userId' ? handleUserIdChange(e.target.value) : handleServerIdChange(e.target.value)}
                className="bg-white/80 border-0 rounded-full h-10 sm:h-12 px-4 sm:px-5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
                disabled={isVerifying}
              />
            </div>
          ))}
        </div>
        {gameIdConfig.example && (
          <p className="text-xs text-muted-foreground pl-1" style={{ color: settings.frameColor ? `${settings.frameColor}99` : 'hsl(30 30% 50%)' }}>
            {gameIdConfig.example}
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast({ title: "Please enter your Game ID", variant: "destructive" });
      return;
    }
    if (!verifiedUser) {
      toast({ title: "សូមផ្ទៀងផ្ទាត់ ID របស់អ្នកជាមុនសិន", variant: "destructive" });
      return;
    }
    if (!selectedPackage) {
      toast({ title: "Please select a package", variant: "destructive" });
      return;
    }
    if (!selectedPayment) {
      toast({ title: "Please select a payment method", variant: "destructive" });
      return;
    }
    if (!agreedToTerms) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }

    const pkg = game.packages.find(p => p.id === selectedPackage) || 
                game.specialPackages.find(p => p.id === selectedPackage);
    
    if (!pkg) return;

    // Handle Wallet payment directly
    if (selectedPayment === 'wallet') {
      if (!user) {
        toast({ title: "សូមចូលគណនីជាមុនសិន", description: "Please login to use wallet payment", variant: "destructive" });
        navigate('/auth');
        return;
      }

      // Check if wallet has enough balance
      if (walletBalance < pkg.price) {
        toast({ 
          title: "សមតុល្យមិនគ្រប់គ្រាន់", 
          description: `Your wallet balance ($${walletBalance.toFixed(2)}) is less than the package price ($${pkg.price.toFixed(2)}). Please top up your wallet first.`,
          variant: "destructive" 
        });
        return;
      }

      setIsSubmitting(true);

      try {
        // Create order first
        const { data: orderData, error: orderError } = await supabase.functions.invoke('process-topup', {
          body: {
            game_name: game.name,
            package_name: pkg.name,
            player_id: userId.trim(),
            server_id: serverId.trim() || null,
            player_name: verifiedUser.username,
            amount: pkg.price,
            currency: settings.packageCurrency || 'USD',
            payment_method: 'Wallet',
            g2bulk_product_id: pkg.g2bulkProductId || null,
          },
        });

        if (orderError) throw orderError;
        
        const orderId = orderData?.order_id;
        if (!orderId) throw new Error('Failed to create order');

        // Deduct from wallet
        const { data: walletResult, error: walletError } = await supabase.functions.invoke('wallet-topup', {
          body: {
            action: 'purchase',
            amount: pkg.price,
            orderId: orderId,
          },
        });

        if (walletError) throw walletError;
        if (walletResult?.error) throw new Error(walletResult.error);

        // Order status is now updated server-side by the wallet-topup edge function
        // This prevents client-side manipulation of order status

        toast({
          title: "✓ បង់ប្រាក់បានជោគជ័យ!",
          description: `Paid $${pkg.price.toFixed(2)} from wallet. New balance: $${walletResult.newBalance.toFixed(2)}`,
        });

        // Navigate to invoice
        navigate(`/invoice/${orderId}`);
      } catch (error: any) {
        console.error('Wallet payment error:', error);
        toast({
          title: "កំហុសក្នុងការបង់ប្រាក់",
          description: error.message || "Failed to process wallet payment",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const paymentMethod = paymentMethods.find(p => p.id === selectedPayment);

    // Add to cart with verified player info and G2Bulk product ID
    addToCart({
      id: `${pkg.id}-${userId}-${Date.now()}`,
      packageId: pkg.id,
      gameId: game.id,
      gameName: game.name,
      gameIcon: game.image || '',
      packageName: pkg.name,
      amount: pkg.amount,
      price: pkg.price,
      playerId: userId.trim(),
      serverId: serverId.trim() || undefined,
      playerName: verifiedUser.username,
      paymentMethodId: selectedPayment,
      paymentMethodName: paymentMethod?.name || 'Unknown',
      g2bulkProductId: pkg.g2bulkProductId,
      g2bulkTypeId: pkg.g2bulkTypeId,
    });

    toast({
      title: "✓ បានបន្ថែមទៅកន្ត្រក!",
      description: `${pkg.name} សម្រាប់ ${verifiedUser.username}`,
    });

    // Navigate to cart
    navigate('/cart');
  };

  return (
    <>
      <Helmet>
        <title>{game.name} Topup - {settings.siteName}</title>
        <meta name="description" content={`Top up ${game.name} instantly. Choose from various packages and payment methods.`} />
      </Helmet>
      
      <div 
        className="min-h-screen pb-8"
        style={{
          backgroundColor: settings.topupBackgroundColor || undefined,
          backgroundImage: settings.topupBackgroundImage ? `url(${settings.topupBackgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <Header />
        
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
          {/* Back button */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រលប់ក្រោយ</span>
          </Link>
          
          {/* Hero Section - Cover Image with Overlapping Game Info */}
          <div className="relative mb-8 rounded-2xl overflow-hidden">
            {/* Cover Image */}
            <div className="relative w-full h-40 sm:h-52 md:h-64">
              {game.coverImage ? (
                <img 
                  src={game.coverImage} 
                  alt={`${game.name} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold/20 via-background to-gold/10" />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
            
            {/* Overlapping Game Info */}
            <div className="relative -mt-12 sm:-mt-14 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-end gap-3 sm:gap-4">
                {/* Game Icon */}
                <div className="relative shrink-0">
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover border-3 sm:border-4 border-card shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-card shadow-md">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                
                {/* Game Name & Badges */}
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 gold-text truncate">
                    {game.name}
                  </h1>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Safety guarantees
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-gold/20 text-gold text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Instant Top-up
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 1: Enter ID - Modern Card Style */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Header */}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg text-sm sm:text-base">
                1
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">Enter Your ID</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">សុំបញ្ចូល ID របស់អ្នក</p>
              </div>
            </div>
            
            {/* Dynamic ID inputs based on game */}
            <div className="mb-4 relative">
              {renderIdInputs()}
            </div>
            
            {/* Verification Status Display */}
            {verifiedUser && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                  <span className="font-bold">Verified Successfully!</span>
                </div>
                <div className="mt-2 text-emerald-300/80 text-sm">
                  <p className="break-all">
                    <strong>Username:</strong> {verifiedUser.username}
                  </p>
                  <p><strong>ID:</strong> {verifiedUser.id}</p>
                  {verifiedUser.serverId && (
                    <p><strong>Server:</strong> {verifiedUser.serverId}</p>
                  )}
                </div>
              </div>
            )}

            {verificationError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm">{verificationError}</span>
                </div>
              </div>
            )}

            {!verifiedUser && (
              <p className="text-xs text-muted-foreground mt-3">
                Enter your ID and click "Verify" to continue
              </p>
            )}
            
            {/* Verify Button */}
            <div className="flex justify-center mt-6 relative">
              <Button 
                onClick={handleVerify}
                disabled={isVerifying || !userId.trim() || !!verifiedUser}
                className={cn(
                  "rounded-xl px-8 py-3 h-auto flex items-center gap-2 font-bold transition-all",
                  verifiedUser 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                    : "bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-primary-foreground"
                )}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : verifiedUser ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified</span>
                  </>
                ) : (
                  <span>Verify ID</span>
                )}
              </Button>
            </div>
          </div>

          {/* Special Offers Section */}
          {game.specialPackages && game.specialPackages.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <span className="text-white font-bold text-xs sm:text-sm">Special Offers</span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {game.specialPackages.length} packages
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {[...game.specialPackages].sort((a, b) => a.price - b.price).map((pkg) => (
                  <ModernPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={selectedPackage === pkg.id}
                    onSelect={() => setSelectedPackage(pkg.id)}
                    variant="featured"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Step 2: Select Package - Modern Grid */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg text-sm sm:text-base">
                2
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">Select Package</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{game.packages.length} packages available</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {[...game.packages].sort((a, b) => a.price - b.price).map((pkg) => (
                <ModernPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={selectedPackage === pkg.id}
                  onSelect={() => setSelectedPackage(pkg.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Step 3: Payment Method - Modern Card */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg text-sm sm:text-base">
                3
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">Payment Method</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">ជ្រើសរើសធនាគារបង់ប្រាក់</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Wallet Payment Option with Balance */}
              <button
                onClick={() => setSelectedPayment('wallet')}
                className={cn(
                  "p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2 relative",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  selectedPayment === 'wallet'
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                    : "border-border/50 bg-card hover:border-emerald-500/50"
                )}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium">Wallet</span>
                {user && (
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold",
                    walletBalance > 0 ? "text-emerald-400" : "text-muted-foreground"
                  )}>
                    ${walletBalance.toFixed(2)}
                  </span>
                )}
                {selectedPayment === 'wallet' && (
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                )}
              </button>
              
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    selectedPayment === method.id
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                      : "border-border/50 bg-card hover:border-gold/50"
                  )}
                >
                  {method.icon.startsWith('http') ? (
                    <img 
                      src={method.icon} 
                      alt={method.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl">{method.icon}</span>
                  )}
                  <span className="text-[10px] sm:text-xs font-medium line-clamp-1">{method.name}</span>
                  {selectedPayment === method.id && (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Step 4: Confirm & Pay */}
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg text-sm sm:text-base">
                4
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">Confirm & Pay</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">យកព្រមទទួលលក្ខខណ្ឌ</p>
              </div>
            </div>
            
            <label className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 cursor-pointer group">
              <button
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                  agreedToTerms 
                    ? "bg-gold border-gold" 
                    : "border-border group-hover:border-gold/50"
                )}
              >
                {agreedToTerms && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />}
              </button>
              <span className="text-xs sm:text-sm">
                I agree to the <span className="text-gold cursor-pointer hover:underline">Terms and Conditions</span>
              </span>
            </label>
            
            {/* Order Summary */}
            {selectedPackage && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Selected Package:</span>
                  <span className="font-bold text-sm sm:text-base">
                    {(game.packages.find(p => p.id === selectedPackage) || game.specialPackages.find(p => p.id === selectedPackage))?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1.5 sm:mt-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold gold-text">
                    {settings.packageCurrencySymbol || '$'}
                    {((game.packages.find(p => p.id === selectedPackage) || game.specialPackages.find(p => p.id === selectedPackage))?.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedToTerms || !selectedPackage || !selectedPayment || !verifiedUser}
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-primary-foreground shadow-lg shadow-gold/20 disabled:opacity-50 disabled:shadow-none rounded-lg sm:rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  Pay Now
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopupPage;
