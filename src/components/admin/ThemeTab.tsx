import React, { useState } from 'react';
import { Palette, Check, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSite } from '@/contexts/SiteContext';
import { toast } from '@/hooks/use-toast';
import ThemePreviewModal from './ThemePreviewModal';

export interface Theme {
  id: string;
  name: string;
  nameKh: string;
  category: 'classic' | 'vibrant' | 'dark' | 'pastel' | 'gaming';
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
  // Classic Themes
  {
    id: 'khmer-gold',
    name: 'Khmer Gold',
    nameKh: 'មាសខ្មែរ',
    category: 'classic',
    preview: { primary: '#D4A84B', accent: '#8B4513', background: '#F5F0E6', secondary: '#9b7bb8' },
    colors: { primaryColor: '#D4A84B', accentColor: '#8B4513', backgroundColor: '#F5F0E6', secondaryColor: '#9b7bb8' },
  },
  {
    id: 'angkor-temple',
    name: 'Angkor Temple',
    nameKh: 'ប្រាសាទអង្គរ',
    category: 'classic',
    preview: { primary: '#8B7355', accent: '#654321', background: '#F4ECD8', secondary: '#A0522D' },
    colors: { primaryColor: '#8B7355', accentColor: '#654321', backgroundColor: '#F4ECD8', secondaryColor: '#A0522D' },
  },
  {
    id: 'slate-modern',
    name: 'Slate Modern',
    nameKh: 'ទំនើបថ្ម',
    category: 'classic',
    preview: { primary: '#64748B', accent: '#475569', background: '#F8FAFC', secondary: '#94A3B8' },
    colors: { primaryColor: '#64748B', accentColor: '#475569', backgroundColor: '#F8FAFC', secondaryColor: '#94A3B8' },
  },

  // Vibrant Themes
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    nameKh: 'ស្វាយភ្លើង',
    category: 'vibrant',
    preview: { primary: '#7C3AED', accent: '#A855F7', background: '#FAF5FF', secondary: '#EC4899' },
    colors: { primaryColor: '#7C3AED', accentColor: '#A855F7', backgroundColor: '#FAF5FF', secondaryColor: '#EC4899' },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    nameKh: 'សមុទ្រខៀវ',
    category: 'vibrant',
    preview: { primary: '#0EA5E9', accent: '#0284C7', background: '#F0F9FF', secondary: '#06B6D4' },
    colors: { primaryColor: '#0EA5E9', accentColor: '#0284C7', backgroundColor: '#F0F9FF', secondaryColor: '#06B6D4' },
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    nameKh: 'បៃតងមរកត',
    category: 'vibrant',
    preview: { primary: '#10B981', accent: '#059669', background: '#ECFDF5', secondary: '#14B8A6' },
    colors: { primaryColor: '#10B981', accentColor: '#059669', backgroundColor: '#ECFDF5', secondaryColor: '#14B8A6' },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    nameKh: 'ថ្ងៃលិច',
    category: 'vibrant',
    preview: { primary: '#F97316', accent: '#EA580C', background: '#FFF7ED', secondary: '#FBBF24' },
    colors: { primaryColor: '#F97316', accentColor: '#EA580C', backgroundColor: '#FFF7ED', secondaryColor: '#FBBF24' },
  },
  {
    id: 'cherry-red',
    name: 'Cherry Red',
    nameKh: 'ក្រហមចេរី',
    category: 'vibrant',
    preview: { primary: '#EF4444', accent: '#DC2626', background: '#FEF2F2', secondary: '#F472B6' },
    colors: { primaryColor: '#EF4444', accentColor: '#DC2626', backgroundColor: '#FEF2F2', secondaryColor: '#F472B6' },
  },

  // Dark Themes
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    nameKh: 'រាត្រីងងឹត',
    category: 'dark',
    preview: { primary: '#6366F1', accent: '#4F46E5', background: '#1E1B4B', secondary: '#818CF8' },
    colors: { primaryColor: '#6366F1', accentColor: '#4F46E5', backgroundColor: '#1E1B4B', secondaryColor: '#818CF8' },
  },
  {
    id: 'cyber-noir',
    name: 'Cyber Noir',
    nameKh: 'សាយបឺណ័រ',
    category: 'dark',
    preview: { primary: '#22D3EE', accent: '#0891B2', background: '#0F172A', secondary: '#F472B6' },
    colors: { primaryColor: '#22D3EE', accentColor: '#0891B2', backgroundColor: '#0F172A', secondaryColor: '#F472B6' },
  },
  {
    id: 'dark-forest',
    name: 'Dark Forest',
    nameKh: 'ព្រៃងងឹត',
    category: 'dark',
    preview: { primary: '#22C55E', accent: '#16A34A', background: '#14532D', secondary: '#84CC16' },
    colors: { primaryColor: '#22C55E', accentColor: '#16A34A', backgroundColor: '#14532D', secondaryColor: '#84CC16' },
  },

  // Pastel Themes
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    nameKh: 'ផ្កាកុលាប',
    category: 'pastel',
    preview: { primary: '#EC4899', accent: '#DB2777', background: '#FDF2F8', secondary: '#F472B6' },
    colors: { primaryColor: '#EC4899', accentColor: '#DB2777', backgroundColor: '#FDF2F8', secondaryColor: '#F472B6' },
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    nameKh: 'ព្រៃបៃតង',
    category: 'pastel',
    preview: { primary: '#84CC16', accent: '#65A30D', background: '#F7FEE7', secondary: '#A3E635' },
    colors: { primaryColor: '#84CC16', accentColor: '#65A30D', backgroundColor: '#F7FEE7', secondaryColor: '#A3E635' },
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    nameKh: 'សុបិន្តឡាវេនឌឺ',
    category: 'pastel',
    preview: { primary: '#A78BFA', accent: '#8B5CF6', background: '#F5F3FF', secondary: '#C4B5FD' },
    colors: { primaryColor: '#A78BFA', accentColor: '#8B5CF6', backgroundColor: '#F5F3FF', secondaryColor: '#C4B5FD' },
  },
  {
    id: 'peach-blossom',
    name: 'Peach Blossom',
    nameKh: 'ផ្កាសាឡី',
    category: 'pastel',
    preview: { primary: '#FB923C', accent: '#F97316', background: '#FFFBEB', secondary: '#FBBF24' },
    colors: { primaryColor: '#FB923C', accentColor: '#F97316', backgroundColor: '#FFFBEB', secondaryColor: '#FBBF24' },
  },

  // Gaming Themes
  {
    id: 'neon-gaming',
    name: 'Neon Gaming',
    nameKh: 'ហ្គេមណេអុង',
    category: 'gaming',
    preview: { primary: '#00FF88', accent: '#00CC6A', background: '#0A0A0A', secondary: '#FF00FF' },
    colors: { primaryColor: '#00FF88', accentColor: '#00CC6A', backgroundColor: '#0A0A0A', secondaryColor: '#FF00FF' },
  },
  {
    id: 'fire-esports',
    name: 'Fire Esports',
    nameKh: 'អ៊ីស្ព័រភ្លើង',
    category: 'gaming',
    preview: { primary: '#FF4500', accent: '#FF6B35', background: '#1A0A0A', secondary: '#FFD700' },
    colors: { primaryColor: '#FF4500', accentColor: '#FF6B35', backgroundColor: '#1A0A0A', secondaryColor: '#FFD700' },
  },
  {
    id: 'ice-legend',
    name: 'Ice Legend',
    nameKh: 'រឿងទឹកកក',
    category: 'gaming',
    preview: { primary: '#00D4FF', accent: '#0099CC', background: '#0A1A2A', secondary: '#87CEEB' },
    colors: { primaryColor: '#00D4FF', accentColor: '#0099CC', backgroundColor: '#0A1A2A', secondaryColor: '#87CEEB' },
  },
  {
    id: 'toxic-green',
    name: 'Toxic Green',
    nameKh: 'បៃតងពុល',
    category: 'gaming',
    preview: { primary: '#39FF14', accent: '#32CD32', background: '#0D1A0D', secondary: '#7CFC00' },
    colors: { primaryColor: '#39FF14', accentColor: '#32CD32', backgroundColor: '#0D1A0D', secondaryColor: '#7CFC00' },
  },
];

const categoryLabels: Record<Theme['category'], { name: string; icon: React.ReactNode }> = {
  classic: { name: 'Classic', icon: <Palette className="w-4 h-4" /> },
  vibrant: { name: 'Vibrant', icon: <Sparkles className="w-4 h-4" /> },
  dark: { name: 'Dark Mode', icon: <span className="w-4 h-4">🌙</span> },
  pastel: { name: 'Pastel', icon: <span className="w-4 h-4">🎨</span> },
  gaming: { name: 'Gaming', icon: <span className="w-4 h-4">🎮</span> },
};

const ThemeTab: React.FC = () => {
  const { settings, updateSettings } = useSite();
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Theme['category'] | 'all'>('all');

  const getCurrentThemeId = (): string | null => {
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

  const handleThemeApply = (theme: Theme) => {
    updateSettings({
      primaryColor: theme.colors.primaryColor,
      accentColor: theme.colors.accentColor,
      backgroundColor: theme.colors.backgroundColor,
      secondaryColor: theme.colors.secondaryColor,
    });
    setPreviewTheme(null);
    toast({
      title: 'Theme Applied!',
      description: `${theme.name} (${theme.nameKh}) theme has been applied.`,
    });
  };

  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(t => t.category === selectedCategory);

  const categories: (Theme['category'] | 'all')[] = ['all', 'classic', 'vibrant', 'dark', 'pastel', 'gaming'];

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold" />
            Theme Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-gold text-primary-foreground' : ''}
              >
                {cat === 'all' ? (
                  <>All Themes</>
                ) : (
                  <>
                    {categoryLabels[cat].icon}
                    <span className="ml-1">{categoryLabels[cat].name}</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Grid */}
      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              {selectedCategory === 'all' ? 'All Themes' : categoryLabels[selectedCategory].name} ({filteredThemes.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredThemes.map((theme) => {
              const isActive = activeThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                    isActive
                      ? 'border-gold shadow-lg ring-2 ring-gold/50'
                      : 'border-border hover:border-gold/50'
                  }`}
                >
                  {/* Mini Preview */}
                  <div
                    className="h-20 relative"
                    style={{ backgroundColor: theme.preview.background }}
                  >
                    {/* Mini Header */}
                    <div
                      className="h-4 w-full"
                      style={{ backgroundColor: theme.preview.primary }}
                    />
                    {/* Mini Cards */}
                    <div className="flex gap-1 p-2">
                      <div
                        className="w-6 h-8 rounded"
                        style={{ backgroundColor: theme.preview.primary + '40' }}
                      />
                      <div
                        className="w-6 h-8 rounded"
                        style={{ backgroundColor: theme.preview.accent + '40' }}
                      />
                      <div
                        className="w-6 h-8 rounded"
                        style={{ backgroundColor: theme.preview.secondary + '40' }}
                      />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="p-3 bg-card">
                    <p className="text-sm font-medium truncate">{theme.name}</p>
                    <p className="text-xs text-muted-foreground font-khmer truncate">
                      {theme.nameKh}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7"
                        onClick={() => setPreviewTheme(theme)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className={`flex-1 text-xs h-7 ${isActive ? 'bg-gold' : ''}`}
                        onClick={() => handleThemeApply(theme)}
                        disabled={isActive}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors */}
      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold" />
            Custom Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Accent Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => updateSettings({ accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Background Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Secondary Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Customize individual colors to create your own unique theme.
          </p>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <ThemePreviewModal
        theme={previewTheme}
        isOpen={!!previewTheme}
        onClose={() => setPreviewTheme(null)}
        onApply={handleThemeApply}
      />
    </div>
  );
};

export default ThemeTab;
