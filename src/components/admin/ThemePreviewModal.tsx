import React, { useState } from 'react';
import { Eye, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Theme } from './ThemeSelector';

interface ThemePreviewModalProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (theme: Theme) => void;
}

const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({
  theme,
  isOpen,
  onClose,
  onApply,
}) => {
  if (!theme) return null;

  const { colors, name, nameKh } = theme;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview: {name} ({nameKh})
          </DialogTitle>
        </DialogHeader>

        {/* Preview Container */}
        <div
          className="rounded-xl overflow-hidden border-2 border-border"
          style={{ backgroundColor: colors.backgroundColor }}
        >
          {/* Mock Header */}
          <div
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: colors.primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20" />
              <span className="text-white font-bold text-lg">XavierTopup</span>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm">Home</div>
              <div className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm">Games</div>
              <div
                className="px-4 py-2 rounded-lg text-white text-sm"
                style={{ backgroundColor: colors.accentColor }}
              >
                Login
              </div>
            </div>
          </div>

          {/* Mock Hero */}
          <div className="p-8 text-center" style={{ backgroundColor: colors.primaryColor + '20' }}>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: colors.primaryColor }}
            >
              Fast & Secure Game Top-up
            </h1>
            <p className="text-gray-600 mb-4">Top-up your favorite games instantly</p>
            <button
              className="px-6 py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: colors.accentColor }}
            >
              Browse Games
            </button>
          </div>

          {/* Mock Game Cards */}
          <div className="p-6">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.primaryColor }}
            >
              Featured Games
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden shadow-lg"
                  style={{ backgroundColor: 'white' }}
                >
                  <div
                    className="h-24"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primaryColor}40, ${colors.secondaryColor}40)`,
                    }}
                  />
                  <div className="p-3">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: colors.primaryColor }}
                    >
                      Game {i}
                    </div>
                    <div className="text-xs text-gray-500">Top-up Now</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock Package Cards */}
          <div className="p-6 pt-0">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: colors.primaryColor }}
            >
              Popular Packages
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {['100 Diamonds', '500 Diamonds', '1000 Diamonds'].map((pkg, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: i === 1 ? colors.primaryColor : colors.secondaryColor + '50',
                    backgroundColor: i === 1 ? colors.primaryColor + '10' : 'white',
                  }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: colors.primaryColor }}
                  >
                    {pkg}
                  </div>
                  <div className="text-sm text-gray-500">${(i + 1) * 5}.00</div>
                  <button
                    className="mt-3 w-full py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.accentColor }}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mock Footer */}
          <div
            className="p-6 text-center text-white"
            style={{ backgroundColor: colors.primaryColor }}
          >
            <p className="text-sm opacity-80">© 2024 XavierTopup. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-2">
              <span className="text-xs opacity-60">Terms</span>
              <span className="text-xs opacity-60">Privacy</span>
              <span className="text-xs opacity-60">Contact</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => onApply(theme)}
            style={{ backgroundColor: colors.primaryColor }}
            className="text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePreviewModal;
