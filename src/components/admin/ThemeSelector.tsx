import React from 'react';
import { Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSite } from '@/contexts/SiteContext';
import { toast } from '@/hooks/use-toast';

export interface Theme {
  id: string;
  name: string;
  nameKh: string;
  preview: {
    primary: string;
    accent: string;
    background: string;
    secondary: string;
  };
  colors: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    secondaryColor: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'khmer-gold',
    name: 'Khmer Gold',
    nameKh: 'មាសខ្មែរ',
    preview: {
      primary: '#D4A84B',
      accent: '#8B4513',
      background: '#F5F0E6',
      secondary: '#9b7bb8',
    },
    colors: {
      primaryColor: '#D4A84B',
      accentColor: '#8B4513',
      backgroundColor: '#F5F0E6',
      secondaryColor: '#9b7bb8',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    nameKh: 'ស្វាយភ្លើង',
    preview: {
      primary: '#7C3AED',
      accent: '#A855F7',
      background: '#FAF5FF',
      secondary: '#EC4899',
    },
    colors: {
      primaryColor: '#7C3AED',
      accentColor: '#A855F7',
      backgroundColor: '#FAF5FF',
      secondaryColor: '#EC4899',
    },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    nameKh: 'សមុទ្រខៀវ',
    preview: {
      primary: '#0EA5E9',
      accent: '#0284C7',
      background: '#F0F9FF',
      secondary: '#06B6D4',
    },
    colors: {
      primaryColor: '#0EA5E9',
      accentColor: '#0284C7',
      backgroundColor: '#F0F9FF',
      secondaryColor: '#06B6D4',
    },
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    nameKh: 'បៃតងមរកត',
    preview: {
      primary: '#10B981',
      accent: '#059669',
      background: '#ECFDF5',
      secondary: '#14B8A6',
    },
    colors: {
      primaryColor: '#10B981',
      accentColor: '#059669',
      backgroundColor: '#ECFDF5',
      secondaryColor: '#14B8A6',
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    nameKh: 'ថ្ងៃលិច',
    preview: {
      primary: '#F97316',
      accent: '#EA580C',
      background: '#FFF7ED',
      secondary: '#FBBF24',
    },
    colors: {
      primaryColor: '#F97316',
      accentColor: '#EA580C',
      backgroundColor: '#FFF7ED',
      secondaryColor: '#FBBF24',
    },
  },
  {
    id: 'cherry-red',
    name: 'Cherry Red',
    nameKh: 'ក្រហមចេរី',
    preview: {
      primary: '#EF4444',
      accent: '#DC2626',
      background: '#FEF2F2',
      secondary: '#F472B6',
    },
    colors: {
      primaryColor: '#EF4444',
      accentColor: '#DC2626',
      backgroundColor: '#FEF2F2',
      secondaryColor: '#F472B6',
    },
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    nameKh: 'រាត្រីងងឹត',
    preview: {
      primary: '#6366F1',
      accent: '#4F46E5',
      background: '#1E1B4B',
      secondary: '#818CF8',
    },
    colors: {
      primaryColor: '#6366F1',
      accentColor: '#4F46E5',
      backgroundColor: '#1E1B4B',
      secondaryColor: '#818CF8',
    },
  },
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    nameKh: 'ផ្កាកុលាប',
    preview: {
      primary: '#EC4899',
      accent: '#DB2777',
      background: '#FDF2F8',
      secondary: '#F472B6',
    },
    colors: {
      primaryColor: '#EC4899',
      accentColor: '#DB2777',
      backgroundColor: '#FDF2F8',
      secondaryColor: '#F472B6',
    },
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    nameKh: 'ព្រៃបៃតង',
    preview: {
      primary: '#84CC16',
      accent: '#65A30D',
      background: '#F7FEE7',
      secondary: '#A3E635',
    },
    colors: {
      primaryColor: '#84CC16',
      accentColor: '#65A30D',
      backgroundColor: '#F7FEE7',
      secondaryColor: '#A3E635',
    },
  },
  {
    id: 'slate-modern',
    name: 'Slate Modern',
    nameKh: 'ទំនើបថ្ម',
    preview: {
      primary: '#64748B',
      accent: '#475569',
      background: '#F8FAFC',
      secondary: '#94A3B8',
    },
    colors: {
      primaryColor: '#64748B',
      accentColor: '#475569',
      backgroundColor: '#F8FAFC',
      secondaryColor: '#94A3B8',
    },
  },
];

interface ThemeSelectorProps {
  currentTheme?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme }) => {
  const { settings, updateSettings } = useSite();

  const getCurrentThemeId = (): string | null => {
    // Find theme that matches current colors
    const matchingTheme = themes.find(
      (theme) =>
        theme.colors.primaryColor === settings.primaryColor &&
        theme.colors.accentColor === settings.accentColor &&
        theme.colors.backgroundColor === settings.backgroundColor &&
        theme.colors.secondaryColor === settings.secondaryColor
    );
    return matchingTheme?.id || null;
  };

  const activeThemeId = getCurrentThemeId();

  const handleThemeSelect = (theme: Theme) => {
    updateSettings({
      primaryColor: theme.colors.primaryColor,
      accentColor: theme.colors.accentColor,
      backgroundColor: theme.colors.backgroundColor,
      secondaryColor: theme.colors.secondaryColor,
    });
    toast({
      title: 'Theme Applied!',
      description: `${theme.name} (${theme.nameKh}) theme has been applied.`,
    });
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-gold" />
          Theme Presets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {themes.map((theme) => {
            const isActive = activeThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                  isActive
                    ? 'border-gold shadow-gold ring-2 ring-gold/50'
                    : 'border-border hover:border-gold/50'
                }`}
              >
                {/* Color Preview */}
                <div className="flex gap-1 mb-2">
                  <div
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.preview.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.preview.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.preview.background }}
                    title="Background"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.preview.secondary }}
                    title="Secondary"
                  />
                </div>

                {/* Theme Name */}
                <div className="text-left">
                  <p className="text-xs font-medium truncate">{theme.name}</p>
                  <p className="text-[10px] text-muted-foreground font-khmer truncate">
                    {theme.nameKh}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Select a theme to quickly change the website's color scheme. You can still customize individual colors below.
        </p>
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
