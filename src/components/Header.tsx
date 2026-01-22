import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Receipt, ShoppingCart, Wallet, Plus, Menu, LogIn, LogOut, User, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSite } from '@/contexts/SiteContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const { settings } = useSite();
  const { user, isAdmin, signOut } = useAuth();
  const { items } = useCart();
  const { t } = useLanguage();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch wallet balance for logged-in users
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setWalletBalance(null);
        return;
      }
      
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

    fetchBalance();

    // Subscribe to realtime wallet updates
    if (user) {
      const channel = supabase
        .channel('header-wallet-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new && 'balance_after' in payload.new) {
              setWalletBalance((payload.new as any).balance_after);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    toast({ title: t('header.signedOut') || 'Signed out successfully' });
  };

  const headerHeight = isMobile 
    ? (settings.headerHeightMobile || 56) 
    : (settings.headerHeightDesktop || 96);

  const MobileMenuItem = ({ to, icon: Icon, label, onClick }: { to?: string; icon: React.ElementType; label: string; onClick?: () => void }) => {
    if (onClick) {
      return (
        <button
          onClick={onClick}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-card/50 hover:bg-gold/20 border border-gold/20 transition-colors text-left"
        >
          <Icon className="w-5 h-5 text-gold" />
          <span className="text-foreground font-medium">{label}</span>
        </button>
      );
    }
    return (
      <Link
        to={to!}
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-card/50 hover:bg-gold/20 border border-gold/20 transition-colors"
      >
        <Icon className="w-5 h-5 text-gold" />
        <span className="text-foreground font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <header 
      className="relative px-3 sm:px-4 flex items-center"
      style={{
        height: `${headerHeight}px`,
        backgroundImage: settings.headerImage ? `url(${settings.headerImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background overlay for readability when image is present */}
      {settings.headerImage && (
        <div className="absolute inset-0 bg-background/70" />
      )}
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent z-10" />
      
      <div className="container mx-auto flex items-center justify-between relative z-10">
        {/* Left section - Wallet Balance (desktop) or Hamburger (mobile) */}
        <div className="flex items-center gap-2 relative z-30 shrink-0">
          {/* Mobile hamburger menu */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg border-2 border-gold/50 bg-card hover:bg-gold/20 transition-colors">
                  <Menu className="w-5 h-5 text-gold" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-background border-gold/20">
                <SheetHeader className="border-b border-gold/20 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt={settings.siteName} className="h-8 object-contain" />
                    ) : (
                      <span className="gold-text font-display text-xl">{settings.siteName}</span>
                    )}
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-3 mt-6">
                  {/* Wallet Balance */}
                  {user && walletBalance !== null && (
                    <Link
                      to="/wallet"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">{t('header.wallet')}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">${walletBalance.toFixed(2)}</span>
                    </Link>
                  )}

                  {/* Navigation Items */}
                  <MobileMenuItem to="/cart" icon={ShoppingCart} label={t('header.cart')} />
                  
                  {user && (
                    <>
                      <MobileMenuItem to="/orders" icon={Receipt} label={t('header.orders')} />
                      <MobileMenuItem to="/profile" icon={User} label={t('header.profile') || 'Profile'} />
                    </>
                  )}
                  
                  {user && isAdmin && (
                    <MobileMenuItem to="/admin" icon={Settings} label={t('header.admin')} />
                  )}

                  {/* Language Switcher in menu */}
                  <div className="px-4 py-3 rounded-lg bg-card/50 border border-gold/20">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{t('header.language') || 'Language'}</span>
                      <LanguageSwitcher />
                    </div>
                  </div>

                  {/* Auth Actions */}
                  <div className="mt-4 pt-4 border-t border-gold/20">
                    {user ? (
                      <MobileMenuItem icon={LogOut} label={t('header.signOut') || 'Sign Out'} onClick={handleSignOut} />
                    ) : (
                      <MobileMenuItem to="/auth" icon={LogIn} label={t('header.login')} />
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop wallet balance */}
          {!isMobile && user && walletBalance !== null && (
            <Link
              to="/wallet"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 hover:border-emerald-400 transition-all group"
            >
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-bold text-emerald-400">
                ${walletBalance.toFixed(2)}
              </span>
              <Plus className="w-4 h-4 text-emerald-400/70 group-hover:text-emerald-300 transition-colors" />
            </Link>
          )}
          {/* Desktop ornament */}
          <div className="hidden lg:block w-20 h-12">
            <svg viewBox="0 0 80 48" className="w-full h-full text-gold fill-current">
              <path d="M0 24c0-8 5-16 15-20s25-2 35 4c-10-2-25 2-30 8s-8 12-5 18c-10-2-15-6-15-10z" opacity="0.8"/>
              <path d="M20 20c5-8 20-12 35-8s25 12 25 20c-5-8-20-12-35-12s-25 4-25 0z" opacity="0.6"/>
            </svg>
          </div>
        </div>

        {/* Logo - centered */}
        <Link 
          to="/" 
          className="flex flex-col items-center group absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
          style={{
            left: isMobile ? `${settings.logoMobilePosition}%` : '50%',
          }}
        >
          {/* Mobile logo */}
          <div className="md:hidden">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.siteName}
                style={{ height: `${Math.min(settings.logoSize || 48, 48)}px` }}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <h1 className="font-display text-lg font-bold tracking-wider gold-text drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                {settings.siteName}
              </h1>
            )}
          </div>
          {/* Desktop logo */}
          <div className="hidden md:flex flex-col items-center">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.siteName}
                style={{ height: `${settings.logoSize || 64}px` }}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider gold-text drop-shadow-lg transition-transform duration-300 group-hover:scale-105">
                {settings.siteName}
              </h1>
            )}
            <div className="mt-1 w-32 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-1 sm:gap-3 relative z-30 shrink-0">
          <div className="hidden lg:block w-20 h-12 transform scale-x-[-1]">
            <svg viewBox="0 0 80 48" className="w-full h-full text-gold fill-current">
              <path d="M0 24c0-8 5-16 15-20s25-2 35 4c-10-2-25 2-30 8s-8 12-5 18c-10-2-15-6-15-10z" opacity="0.8"/>
              <path d="M20 20c5-8 20-12 35-8s25 12 25 20c-5-8-20-12-35-12s-25 4-25 0z" opacity="0.6"/>
            </svg>
          </div>

          {/* Desktop Language Switcher */}
          {!isMobile && <LanguageSwitcher />}
          
          {/* Cart Icon - always visible */}
          <Link 
            to="/cart" 
            className="relative p-1.5 sm:p-2 rounded-lg border-2 border-gold/50 bg-card hover:bg-gold/20 transition-colors"
            title={t('header.cart')}
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Link>

          {/* Desktop-only navigation items */}
          {!isMobile && (
            <>
              {/* Order History - only for logged in users */}
              {user && (
                <Link 
                  to="/orders" 
                  className="p-2 rounded-lg border-2 border-gold/50 bg-card hover:bg-gold/20 transition-colors"
                  title={t('header.orders')}
                >
                  <Receipt className="w-5 h-5 text-gold" />
                </Link>
              )}

              {/* Admin Panel */}
              {user && isAdmin && (
                <Link 
                  to="/admin" 
                  className="p-2 rounded-lg border-2 border-gold/50 bg-card hover:bg-gold/20 transition-colors"
                  title={t('header.admin')}
                >
                  <Settings className="w-5 h-5 text-gold" />
                </Link>
              )}

              {/* Login link for non-logged in users */}
              {!user && (
                <Link 
                  to="/auth" 
                  className="p-2 rounded-lg border-2 border-gold/50 bg-card hover:bg-gold/20 transition-colors"
                  title={t('header.login')}
                >
                  <LogIn className="w-5 h-5 text-gold" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent z-10" />
    </header>
  );
};

export default Header;
