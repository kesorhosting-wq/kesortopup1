import React from 'react';
import { Type, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FontUploadSettingsProps {
  customFontKhmer: string;
  customFontEnglish: string;
  onUpdate: (key: string, value: string) => void;
}

const FontUploadSettings: React.FC<FontUploadSettingsProps> = ({
  customFontKhmer,
  customFontEnglish,
  onUpdate,
}) => {
  const [isUploadingKhmer, setIsUploadingKhmer] = React.useState(false);
  const [isUploadingEnglish, setIsUploadingEnglish] = React.useState(false);

  const handleFontUpload = async (file: File, type: 'khmer' | 'english') => {
    const setUploading = type === 'khmer' ? setIsUploadingKhmer : setIsUploadingEnglish;
    const settingKey = type === 'khmer' ? 'customFontKhmer' : 'customFontEnglish';
    
    // Validate file type
    const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validTypes.includes(ext)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .ttf, .otf, .woff, or .woff2 font file',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${type}-${file.name}`;
      const filePath = `fonts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      onUpdate(settingKey, urlData.publicUrl);
      toast({ title: `${type === 'khmer' ? 'Khmer' : 'English'} font uploaded!` });
    } catch (error: any) {
      console.error('Font upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'khmer' | 'english') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFontUpload(file, type);
    }
  };

  const clearFont = (type: 'khmer' | 'english') => {
    const settingKey = type === 'khmer' ? 'customFontKhmer' : 'customFontEnglish';
    onUpdate(settingKey, '');
    toast({ title: `${type === 'khmer' ? 'Khmer' : 'English'} font cleared` });
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5 text-gold" />
          Custom Fonts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload custom fonts to use across all pages. Supports .ttf, .otf, .woff, and .woff2 formats.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Khmer Font */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Khmer Font</label>
            {customFontKhmer ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Current font:</p>
                <p className="text-sm font-medium truncate mb-2">{customFontKhmer.split('/').pop()}</p>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      onChange={(e) => handleFileChange(e, 'khmer')}
                      className="hidden"
                      disabled={isUploadingKhmer}
                    />
                    <Button variant="outline" size="sm" asChild disabled={isUploadingKhmer}>
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        Replace
                      </span>
                    </Button>
                  </label>
                  <Button variant="destructive" size="sm" onClick={() => clearFont('khmer')}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={(e) => handleFileChange(e, 'khmer')}
                  className="hidden"
                  disabled={isUploadingKhmer}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gold/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isUploadingKhmer ? 'Uploading...' : 'Click to upload Khmer font'}
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* English Font */}
          <div className="space-y-3">
            <label className="text-sm font-medium">English Font</label>
            {customFontEnglish ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Current font:</p>
                <p className="text-sm font-medium truncate mb-2">{customFontEnglish.split('/').pop()}</p>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      onChange={(e) => handleFileChange(e, 'english')}
                      className="hidden"
                      disabled={isUploadingEnglish}
                    />
                    <Button variant="outline" size="sm" asChild disabled={isUploadingEnglish}>
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        Replace
                      </span>
                    </Button>
                  </label>
                  <Button variant="destructive" size="sm" onClick={() => clearFont('english')}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={(e) => handleFileChange(e, 'english')}
                  className="hidden"
                  disabled={isUploadingEnglish}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-gold/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isUploadingEnglish ? 'Uploading...' : 'Click to upload English font'}
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-600">
            <strong>Note:</strong> After uploading fonts, refresh the page to see the changes applied across the site.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FontUploadSettings;
