import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle, Loader2, UserCheck, XCircle, Shield, Zap, Sparkles } from 'lucide-react';
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

interface VerifiedUser {
  username: string;
  id: string;
  serverId?: string;
  accountName?: string;
}

const TopupPage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { games, paymentMethods, settings, isLoading } = useSite();
  const { addToCart } = useCart();
  
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
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Auto-fill cached IDs when available
  useEffect(() => {
    if (hasCachedData && !userId) {
      setUserId(cachedUserId);
      setServerId(cachedServerId);
    }
  }, [hasCachedData, cachedUserId, cachedServerId]);

  // Show loading state while data is being fetched
  if (isLoading) {
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

  // Game-specific ID field configurations based on real game requirements
  const getGameIdConfig = (gameName: string) => {
    const normalizedName = gameName.toLowerCase().trim();
    
    // Mobile Legends variants - require User ID + Server ID
    if (normalizedName.includes('mobile legends') || normalizedName === 'mlbb') {
      return {
        fields: [
          { key: 'userId', label: 'User ID', placeholder: 'បញ្ចូល User ID' },
          { key: 'serverId', label: 'Server ID', placeholder: 'Server ID', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល User ID និង Server ID',
        example: 'ឧទាហរណ៍: 123456789 (1234)'
      };
    }
    
    // Free Fire variants - require Player ID (no server needed for most regions)
    if (normalizedName.includes('freefire') || normalizedName.includes('free fire') || normalizedName === 'ff') {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Valorant - Riot ID format
    if (normalizedName.includes('valorant')) {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: PlayerName#1234'
      };
    }
    
    // League of Legends - Riot ID format
    if (normalizedName.includes('league of legends') || normalizedName === 'lol') {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: Summoner#1234'
      };
    }
    
    // Teamfight Tactics - Riot ID format
    if (normalizedName.includes('teamfight tactics') || normalizedName === 'tft') {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: Player#1234'
      };
    }
    
    // Legends of Runeterra - Riot ID
    if (normalizedName.includes('legends of runeterra') || normalizedName === 'lor') {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: Player#1234'
      };
    }
    
    // Call of Duty Mobile - Player UID
    if (normalizedName.includes('call of duty') || normalizedName.includes('cod')) {
      return {
        fields: [
          { key: 'userId', label: 'Player UID', placeholder: 'បញ្ចូល Player UID' }
        ],
        validation: 'សូមបញ្ចូល Player UID',
        example: 'ឧទាហរណ៍: 6742123456789'
      };
    }
    
    // PUBG Mobile - Character ID
    if (normalizedName.includes('pubg')) {
      return {
        fields: [
          { key: 'userId', label: 'Character ID', placeholder: 'បញ្ចូល Character ID' }
        ],
        validation: 'សូមបញ្ចូល Character ID',
        example: 'ឧទាហរណ៍: 5123456789'
      };
    }
    
    // Blood Strike / Bloodstrike - Player ID
    if (normalizedName.includes('blood strike') || normalizedName.includes('bloodstrike')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Delta Force - Player ID
    if (normalizedName.includes('delta force')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Identity V - Player ID + Server
    if (normalizedName.includes('identity v')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (Asia)'
      };
    }
    
    // Sausage Man - Player ID
    if (normalizedName.includes('sausage man')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Undawn - Player ID + Server
    if (normalizedName.includes('undawn')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (SEA-01)'
      };
    }
    
    // EAFC / EA FC / FIFA - EA ID or Player ID
    if (normalizedName.includes('eafc') || normalizedName.includes('ea fc') || normalizedName.includes('fifa')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Yalla Ludo - Player ID
    if (normalizedName.includes('yalla ludo')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Zepeto - ZEPETO ID
    if (normalizedName.includes('zepeto')) {
      return {
        fields: [
          { key: 'userId', label: 'ZEPETO ID', placeholder: 'បញ្ចូល ZEPETO ID' }
        ],
        validation: 'សូមបញ្ចូល ZEPETO ID',
        example: 'ឧទាហរណ៍: abc123xyz'
      };
    }
    
    // Poppo Live - User ID
    if (normalizedName.includes('poppo live')) {
      return {
        fields: [
          { key: 'userId', label: 'User ID', placeholder: 'បញ្ចូល User ID' }
        ],
        validation: 'សូមបញ្ចូល User ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Blockman Go - Player ID
    if (normalizedName.includes('blockman go')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Pixel Gun 3D - Player ID
    if (normalizedName.includes('pixel gun')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Bullet Echo - Player ID
    if (normalizedName.includes('bullet echo')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Ragnarok games - Character ID + Server
    if (normalizedName.includes('ragnarok')) {
      return {
        fields: [
          { key: 'userId', label: 'Character ID', placeholder: 'បញ្ចូល Character ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល Character ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (Prontera)'
      };
    }
    
    // Solo Leveling: Arise - Player ID
    if (normalizedName.includes('solo leveling')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // AFK Journey - Player ID
    if (normalizedName.includes('afk journey')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Age of Empires Mobile - Player ID
    if (normalizedName.includes('age of empire')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // State of Survival - Player ID + State
    if (normalizedName.includes('state of survival')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'State', placeholder: 'State #', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង State',
        example: 'ឧទាហរណ៍: 12345678 (State 123)'
      };
    }
    
    // Puzzles and Survival - Player ID + State
    if (normalizedName.includes('puzzles and survival')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'State', placeholder: 'State #', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង State',
        example: 'ឧទាហរណ៍: 12345678 (State 123)'
      };
    }
    
    // Lord of the Rings - Player ID
    if (normalizedName.includes('lord of the rings')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Love and Deepspace - UID
    if (normalizedName.includes('love and deepspace')) {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' }
        ],
        validation: 'សូមបញ្ចូល UID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Love Nikki / Shining Nikki - Player ID
    if (normalizedName.includes('nikki')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Life Makeover - Player ID
    if (normalizedName.includes('life makeover')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Crystal of Atlan - Player ID
    if (normalizedName.includes('crystal of atlan')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Devil May Cry - Player ID
    if (normalizedName.includes('devil may cry')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Metal Slug - Player ID
    if (normalizedName.includes('metal slug')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Marvel Duel - Player ID
    if (normalizedName.includes('marvel duel')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // One Punch Man World - Player ID
    if (normalizedName.includes('one punch man')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Path to Nowhere - Player ID + Server
    if (normalizedName.includes('path to nowhere')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (SEA)'
      };
    }
    
    // Moonlight Blade - Character ID + Server
    if (normalizedName.includes('moonlight blade')) {
      return {
        fields: [
          { key: 'userId', label: 'Character ID', placeholder: 'បញ្ចូល Character ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល Character ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (Server)'
      };
    }
    
    // Heaven Burns Red - Player ID
    if (normalizedName.includes('heaven burns red')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Star Resonance - Player ID
    if (normalizedName.includes('star resonance')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Deadly Dudes - Player ID
    if (normalizedName.includes('deadly dudes')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Rememento - Player ID
    if (normalizedName.includes('rememento')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Valorant Global / Valorant SEA - Riot ID format
    if (normalizedName.includes('valorant')) {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: PlayerName#1234'
      };
    }
    
    // Wild Rift - Riot ID + Region
    if (normalizedName.includes('wild rift')) {
      return {
        fields: [
          { key: 'userId', label: 'Riot ID', placeholder: 'Name#Tag' }
        ],
        validation: 'សូមបញ្ចូល Riot ID',
        example: 'ឧទាហរណ៍: Player#SEA1'
      };
    }
    
    // Zenless Zone Zero - UID + Server
    if (normalizedName.includes('zenless zone zero') || normalizedName === 'zzz') {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 1234567890 (Asia)'
      };
    }
    
    // Wuthering Waves - UID + Server
    if (normalizedName.includes('wuthering waves')) {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 1234567890 (SEA)'
      };
    }
    
    // TikTok Coins - TikTok Username
    if (normalizedName.includes('tiktok')) {
      return {
        fields: [
          { key: 'userId', label: 'TikTok Username', placeholder: '@username' }
        ],
        validation: 'សូមបញ្ចូល TikTok Username',
        example: 'ឧទាហរណ៍: @yourusername'
      };
    }
    
    // Tower of Fantasy - UID + Server
    if (normalizedName.includes('tower of fantasy') || normalizedName === 'tof') {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 1234567890 (SEA-Fantasia)'
      };
    }
    
    // Honkai Star Rail - UID + Server
    if (normalizedName.includes('honkai star rail') || normalizedName === 'hsr') {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 8001234567 (Asia)'
      };
    }
    
    // Genshin Impact - UID + Server
    if (normalizedName.includes('genshin impact') || normalizedName === 'genshin') {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 8001234567 (Asia)'
      };
    }
    
    // Honkai Impact 3rd - UID + Server
    if (normalizedName.includes('honkai impact') || normalizedName === 'hi3') {
      return {
        fields: [
          { key: 'userId', label: 'UID', placeholder: 'បញ្ចូល UID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល UID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (SEA)'
      };
    }
    
    // Clash of Clans - Player Tag
    if (normalizedName.includes('clash of clans') || normalizedName === 'coc') {
      return {
        fields: [
          { key: 'userId', label: 'Player Tag', placeholder: '#ABC123' }
        ],
        validation: 'សូមបញ្ចូល Player Tag',
        example: 'ឧទាហរណ៍: #ABC123XY'
      };
    }
    
    // Clash Royale - Player Tag
    if (normalizedName.includes('clash royale')) {
      return {
        fields: [
          { key: 'userId', label: 'Player Tag', placeholder: '#ABC123' }
        ],
        validation: 'សូមបញ្ចូល Player Tag',
        example: 'ឧទាហរណ៍: #ABC123XY'
      };
    }
    
    // Brawl Stars - Player Tag
    if (normalizedName.includes('brawl stars')) {
      return {
        fields: [
          { key: 'userId', label: 'Player Tag', placeholder: '#ABC123' }
        ],
        validation: 'សូមបញ្ចូល Player Tag',
        example: 'ឧទាហរណ៍: #ABC123XY'
      };
    }
    
    // Steam Wallet - Steam ID
    if (normalizedName.includes('steam')) {
      return {
        fields: [
          { key: 'userId', label: 'Steam ID', placeholder: 'បញ្ចូល Steam ID' }
        ],
        validation: 'សូមបញ្ចូល Steam ID',
        example: 'ឧទាហរណ៍: 76561198012345678'
      };
    }
    
    // Discord Nitro - Discord Username
    if (normalizedName.includes('discord')) {
      return {
        fields: [
          { key: 'userId', label: 'Discord Username', placeholder: 'username#0000' }
        ],
        validation: 'សូមបញ្ចូល Discord Username',
        example: 'ឧទាហរណ៍: player#1234 ឬ @player'
      };
    }
    
    // Roblox - Roblox Username
    if (normalizedName.includes('roblox')) {
      return {
        fields: [
          { key: 'userId', label: 'Roblox Username', placeholder: 'បញ្ចូល Username' }
        ],
        validation: 'សូមបញ្ចូល Roblox Username',
        example: 'ឧទាហរណ៍: YourRobloxName'
      };
    }
    
    // Fortnite - Epic Games ID
    if (normalizedName.includes('fortnite')) {
      return {
        fields: [
          { key: 'userId', label: 'Epic Games ID', placeholder: 'បញ្ចូល Epic ID' }
        ],
        validation: 'សូមបញ្ចូល Epic Games ID',
        example: 'ឧទាហរណ៍: EpicUsername'
      };
    }
    
    // Arena of Valor / Liên Quân - Player ID + Server
    if (normalizedName.includes('arena of valor') || normalizedName === 'aov' || normalizedName.includes('liên quân')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (SEA)'
      };
    }
    
    // Stumble Guys - Player ID
    if (normalizedName.includes('stumble guys')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }
        ],
        validation: 'សូមបញ្ចូល Player ID',
        example: 'ឧទាហរណ៍: 123456789'
      };
    }
    
    // Whiteout Survival - Player ID + State
    if (normalizedName.includes('whiteout survival')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'State', placeholder: 'State #', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង State',
        example: 'ឧទាហរណ៍: 12345678 (State 123)'
      };
    }
    
    // Last War: Survival - Player ID + Server
    if (normalizedName.includes('last war')) {
      return {
        fields: [
          { key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' },
          { key: 'serverId', label: 'Server', placeholder: 'Server', width: 'w-24 sm:w-32' }
        ],
        validation: 'សូមបញ្ចូល Player ID និង Server',
        example: 'ឧទាហរណ៍: 12345678 (S123)'
      };
    }

    // Default configuration for other games
    return {
      fields: [{ key: 'userId', label: 'Player ID', placeholder: 'បញ្ចូល Player ID' }],
      validation: 'សូមបញ្ចូល Player ID',
      example: 'ឧទាហរណ៍: 123456789'
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

  const handleSubmit = () => {
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
          
          {/* Modern Game Header Card */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />
            </div>
            
            {/* Banner gradient overlay */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/5"
              style={{
                backgroundImage: settings.topupBannerImage ? `url(${settings.topupBannerImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            <div className="relative p-6 sm:p-8 flex items-center gap-4 sm:gap-6">
              {/* Game Image */}
              <div className="relative">
                <img 
                  src={game.image} 
                  alt={game.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-gold/50 shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-card">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Game Info */}
              <div className="flex-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2 gold-text">
                  {game.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Secure
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    Instant
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step 1: Enter ID - Modern Card Style */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                1
              </div>
              <div>
                <h2 className="font-bold text-lg">Enter Your ID</h2>
                <p className="text-xs text-muted-foreground">សុំបញ្ចូល ID របស់អ្នក</p>
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
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">Special Offers</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {game.specialPackages.length} packages
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                2
              </div>
              <div>
                <h2 className="font-bold text-lg">Select Package</h2>
                <p className="text-xs text-muted-foreground">{game.packages.length} packages available</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                3
              </div>
              <div>
                <h2 className="font-bold text-lg">Payment Method</h2>
                <p className="text-xs text-muted-foreground">ជ្រើសរើសធនាគារបង់ប្រាក់</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
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
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{method.icon}</span>
                  )}
                  <span className="text-xs font-medium">{method.name}</span>
                  {selectedPayment === method.id && (
                    <CheckCircle className="w-4 h-4 text-gold" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Step 4: Confirm & Pay */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                4
              </div>
              <div>
                <h2 className="font-bold text-lg">Confirm & Pay</h2>
                <p className="text-xs text-muted-foreground">យកព្រមទទួលលក្ខខណ្ឌ</p>
              </div>
            </div>
            
            <label className="flex items-center gap-3 mb-6 cursor-pointer group">
              <button
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  agreedToTerms 
                    ? "bg-gold border-gold" 
                    : "border-border group-hover:border-gold/50"
                )}
              >
                {agreedToTerms && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
              </button>
              <span className="text-sm">
                I agree to the <span className="text-gold cursor-pointer hover:underline">Terms and Conditions</span>
              </span>
            </label>
            
            {/* Order Summary */}
            {selectedPackage && (
              <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Selected Package:</span>
                  <span className="font-bold">
                    {(game.packages.find(p => p.id === selectedPackage) || game.specialPackages.find(p => p.id === selectedPackage))?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold gold-text">
                    {settings.packageCurrencySymbol || '$'}
                    {((game.packages.find(p => p.id === selectedPackage) || game.specialPackages.find(p => p.id === selectedPackage))?.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !agreedToTerms || !selectedPackage || !selectedPayment || !verifiedUser}
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-primary-foreground shadow-lg shadow-gold/20 disabled:opacity-50 disabled:shadow-none rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
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
