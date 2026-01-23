import React from "react";
import { Link } from "react-router-dom";
import { useSite, SocialLink } from "@/contexts/SiteContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface FooterProps {
  backgroundColor?: string;
  textColor?: string;
  copyrightText?: string;
  socialIcons?: { telegram?: string; tiktok?: string; facebook?: string };
  socialUrls?: { telegram?: string; tiktok?: string; facebook?: string };
  socialLinks?: SocialLink[];
  textLines?: string[];
  paymentIcons?: string[];
  paymentIconSize?: number;
}

const Footer: React.FC<FooterProps> = ({
  backgroundColor,
  textColor,
  copyrightText,
  socialIcons,
  socialUrls,
  socialLinks = [],
  textLines = [],
  paymentIcons,
  paymentIconSize = 32,
}) => {
  const { settings, games } = useSite();
  const { t } = useLanguage();

  // Combine legacy social icons with new dynamic social links
  const allSocialLinks: SocialLink[] = [
    ...(socialIcons?.telegram
      ? [{ id: "telegram", icon: socialIcons.telegram, url: socialUrls?.telegram || "#", name: "Telegram" }]
      : []),
    ...(socialIcons?.tiktok
      ? [{ id: "tiktok", icon: socialIcons.tiktok, url: socialUrls?.tiktok || "#", name: "TikTok" }]
      : []),
    ...(socialIcons?.facebook
      ? [{ id: "facebook", icon: socialIcons.facebook, url: socialUrls?.facebook || "#", name: "Facebook" }]
      : []),
    ...socialLinks,
  ];

  return (
    <footer className="mt-auto">
      {/* Main Footer */}
      <div
        className="py-6 sm:py-10"
        style={{
          backgroundColor: backgroundColor || "hsl(var(--muted))",
          color: textColor || "hsl(var(--muted-foreground))",
        }}
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {/* Brand Section */}
            <div className="col-span-2 sm:col-span-1 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2">
                {(settings.footerLogoUrl || settings.logoUrl) && (
                  <img
                    src={settings.footerLogoUrl || settings.logoUrl}
                    alt="Logo"
                    style={{ height: `${settings.footerLogoSize || 32}px` }}
                    className="w-auto object-contain"
                  />
                )}
                <h3 className="font-bold text-sm sm:text-lg uppercase tracking-wide" style={{ color: textColor }}>
                  {settings.siteName}
                </h3>
              </div>
              <p className="text-xs sm:text-sm opacity-80" style={{ color: textColor }}>
                High-quality products with unique designs.
              </p>
            </div>

            {/* Products Section */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-xs sm:text-sm" style={{ color: textColor }}>
                Products
              </h4>
              <ul className="space-y-1 sm:space-y-2">
                {games.slice(0, 5).map((game) => (
                  <li key={game.id}>
                    <Link
                      to={`/topup/${game.id}`}
                      className="text-xs sm:text-sm opacity-80 hover:opacity-100 transition-opacity uppercase"
                      style={{ color: textColor }}
                    >
                      {game.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Section */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-xs sm:text-sm" style={{ color: textColor }}>
                Company
              </h4>
              <ul className="space-y-1 sm:space-y-2">
                <li>
                  <span
                    className="text-xs sm:text-sm opacity-80 hover:opacity-100 cursor-pointer uppercase"
                    style={{ color: textColor }}
                  >
                    About Us
                  </span>
                </li>
              </ul>
            </div>

            {/* Follow Us Section */}
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-bold uppercase tracking-wide text-xs sm:text-sm" style={{ color: textColor }}>
                Follow Us
              </h4>

              {/* Optional text lines */}
              {textLines && textLines.length > 0 && (
                <div className="space-y-1">
                  {textLines
                    .filter((line) => line.trim())
                    .map((line, index) => (
                      <p key={index} className="text-xs sm:text-sm opacity-80" style={{ color: textColor }}>
                        {line}
                      </p>
                    ))}
                </div>
              )}

              {/* Social icons */}
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {allSocialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                    title={social.name}
                  >
                    <img src={social.icon} alt={social.name} className="w-full h-full object-cover" />
                  </a>
                ))}
                {allSocialLinks.length === 0 && (
                  <p className="text-xs sm:text-sm opacity-60" style={{ color: textColor }}>
                    No social icons set
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div
        className="py-3 sm:py-4 border-t"
        style={{
          backgroundColor: backgroundColor ? `color-mix(in srgb, ${backgroundColor} 80%, black)` : "hsl(var(--muted))",
          borderColor: textColor ? `${textColor}20` : "hsl(var(--border))",
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <p className="text-xs sm:text-sm" style={{ color: textColor }}>
            {copyrightText || `© ${new Date().getFullYear()} ${settings.siteName}. Built & Maintained by: Ahnajak Team`}
          </p>
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: textColor }}>
              Accept Payment
            </p>
            {paymentIcons &&
              paymentIcons.length > 0 &&
              paymentIcons.map((icon, index) => (
                <img
                  key={index}
                  src={icon}
                  alt={`Payment method ${index + 1}`}
                  style={{ height: `${Math.min(paymentIconSize, window.innerWidth < 640 ? 24 : paymentIconSize)}px` }}
                  className="w-auto object-contain"
                />
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
