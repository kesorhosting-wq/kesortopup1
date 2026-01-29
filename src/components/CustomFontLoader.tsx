import React, { useEffect } from 'react';
import { useSite } from '@/contexts/SiteContext';

/**
 * Component that dynamically loads custom fonts from settings
 * and applies them to the document
 */
const CustomFontLoader: React.FC = () => {
  const { settings } = useSite();

  useEffect(() => {
    // Remove existing custom font styles
    const existingStyle = document.getElementById('custom-fonts-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    let fontFaceRules = '';
    let fontFamilyOverrides = '';

    // Load custom Khmer font
    if (settings.customFontKhmer) {
      fontFaceRules += `
        @font-face {
          font-family: 'CustomKhmer';
          src: url('${settings.customFontKhmer}') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `;
      fontFamilyOverrides += `
        .font-khmer, [lang="km"], :lang(km) {
          font-family: 'CustomKhmer', 'Battambang', 'Noto Sans Khmer', sans-serif !important;
        }
      `;
    }

    // Load custom English font
    if (settings.customFontEnglish) {
      fontFaceRules += `
        @font-face {
          font-family: 'CustomEnglish';
          src: url('${settings.customFontEnglish}') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'CustomEnglish';
          src: url('${settings.customFontEnglish}') format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
      `;
      fontFamilyOverrides += `
        body {
          font-family: 'CustomEnglish', 'Noto Sans', system-ui, sans-serif !important;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'CustomEnglish', 'Cinzel', serif !important;
        }
      `;
    }

    if (fontFaceRules || fontFamilyOverrides) {
      const styleEl = document.createElement('style');
      styleEl.id = 'custom-fonts-style';
      styleEl.textContent = fontFaceRules + fontFamilyOverrides;
      document.head.appendChild(styleEl);
    }
  }, [settings.customFontKhmer, settings.customFontEnglish]);

  return null;
};

export default CustomFontLoader;
