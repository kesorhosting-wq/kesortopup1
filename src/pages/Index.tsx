import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import ModernHeroBanner from '@/components/ModernHeroBanner';
import FeaturedGamesSection from '@/components/FeaturedGamesSection';
import AllGamesSection from '@/components/AllGamesSection';
import Footer from '@/components/Footer';
import { useSite } from '@/contexts/SiteContext';
import { useFavicon } from '@/hooks/useFavicon';
import { Loader2, Gamepad2 } from 'lucide-react';

const Index: React.FC = () => {
  const { settings, games, isLoading } = useSite();
  
  // Update favicon dynamically
  useFavicon(settings.siteIcon);

  return (
    <>
      <Helmet>
        <title>{settings.browserTitle || `${settings.siteName} - Game Topup Cambodia`}</title>
        <meta name="description" content="Top up your favorite games instantly. Mobile Legends, Free Fire, PUBG, and more. Fast, secure, and affordable." />
      </Helmet>
      
      <div 
        className="min-h-screen flex flex-col"
        style={{
          backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {settings.backgroundImage && (
          <div className="fixed inset-0 bg-background/80 -z-10" />
        )}
        
        <Header />
        
        {/* Modern Hero Banner - Contained */}
        <div className="container mx-auto px-4 pt-4 sm:pt-6">
          <ModernHeroBanner 
            bannerImage={settings.bannerImage} 
            bannerImages={settings.bannerImages}
            bannerHeight={settings.bannerHeight}
            cornerBorderColor={settings.frameColor}
            cornerBorderWidth={settings.frameBorderWidth}
            imageFit={settings.bannerImageFit}
          />
        </div>
        
        {/* Main Content */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-4 bg-gradient-to-br from-gold to-gold-dark rounded-full">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
              <div className="p-4 bg-muted rounded-full">
                <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center px-4">
                No games available yet.<br />
                <span className="text-sm">Add games from the admin panel.</span>
              </p>
            </div>
          ) : (
            <>
              {/* Featured Games Section - Games with special packages */}
              <FeaturedGamesSection games={games} />
              
              {/* All Games Section */}
              <AllGamesSection games={games} />
            </>
          )}
        </main>
        
        {/* Footer */}
        <Footer 
          backgroundColor={settings.footerBgColor}
          textColor={settings.footerTextColor}
          copyrightText={settings.footerText}
          socialIcons={{
            telegram: settings.footerTelegramIcon,
            tiktok: settings.footerTiktokIcon,
            facebook: settings.footerFacebookIcon
          }}
          socialUrls={{
            telegram: settings.footerTelegramUrl,
            tiktok: settings.footerTiktokUrl,
            facebook: settings.footerFacebookUrl
          }}
          socialLinks={settings.footerSocialLinks}
          textLines={settings.footerTextLines}
          paymentIcons={settings.footerPaymentIcons}
          paymentIconSize={settings.footerPaymentIconSize}
        />
      </div>
    </>
  );
};

export default Index;
