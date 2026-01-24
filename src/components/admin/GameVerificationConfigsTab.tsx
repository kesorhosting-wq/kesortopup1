import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, CheckCircle, XCircle, RefreshCw, Shield, Download, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSite } from '@/contexts/SiteContext';

interface VerificationConfig {
  id: string;
  game_name: string;
  api_code: string;
  api_provider: string;
  requires_zone: boolean;
  default_zone: string | null;
  is_active: boolean;
  alternate_api_codes: string[];
  created_at: string;
  updated_at: string;
}

const GameVerificationConfigsTab: React.FC = () => {
  const { games } = useSite();
  const [configs, setConfigs] = useState<VerificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingG2Bulk, setSyncingG2Bulk] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<VerificationConfig>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    game_name: '',
    api_code: '',
    api_provider: 'g2bulk',
    requires_zone: false,
    default_zone: '',
    alternate_api_codes: '',
    is_active: true
  });

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_verification_configs')
      .select('*')
      .order('game_name', { ascending: true });

    if (error) {
      toast({ title: 'Failed to load configs', description: error.message, variant: 'destructive' });
    } else {
      setConfigs((data || []).map(d => ({
        ...d,
        alternate_api_codes: d.alternate_api_codes || []
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAdd = async () => {
    if (!newConfig.game_name || !newConfig.api_code) {
      toast({ title: 'Please fill game name and API code', variant: 'destructive' });
      return;
    }

    const altCodes = newConfig.alternate_api_codes
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const { error } = await supabase.from('game_verification_configs').insert({
      game_name: newConfig.game_name,
      api_code: newConfig.api_code,
      api_provider: newConfig.api_provider,
      requires_zone: newConfig.requires_zone,
      default_zone: newConfig.default_zone || null,
      alternate_api_codes: altCodes,
      is_active: newConfig.is_active
    });

    if (error) {
      toast({ title: 'Failed to add config', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Verification config added!' });
      setNewConfig({
        game_name: '',
        api_code: '',
        api_provider: 'g2bulk',
        requires_zone: false,
        default_zone: '',
        alternate_api_codes: '',
        is_active: true
      });
      setShowAddForm(false);
      fetchConfigs();
    }
  };

  const handleStartEdit = (config: VerificationConfig) => {
    setEditingId(config.id);
    setEditData({
      game_name: config.game_name,
      api_code: config.api_code,
      api_provider: config.api_provider,
      requires_zone: config.requires_zone,
      default_zone: config.default_zone || '',
      alternate_api_codes: config.alternate_api_codes || [],
      is_active: config.is_active
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('game_verification_configs')
      .update({
        game_name: editData.game_name,
        api_code: editData.api_code,
        api_provider: editData.api_provider,
        requires_zone: editData.requires_zone,
        default_zone: editData.default_zone || null,
        alternate_api_codes: editData.alternate_api_codes || [],
        is_active: editData.is_active
      })
      .eq('id', editingId);

    if (error) {
      toast({ title: 'Failed to update config', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Config updated!' });
      setEditingId(null);
      setEditData({});
      fetchConfigs();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('game_verification_configs')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to delete config', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Config deleted!' });
      fetchConfigs();
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('game_verification_configs')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchConfigs();
    }
  };

  // Sync configs from local games list (simple fallback)
  const handleSyncFromGames = async () => {
    setSyncing(true);
    try {
      let synced = 0;

      for (const game of games) {
        const exists = configs.some(
          c => c.game_name.toLowerCase() === game.name.toLowerCase()
        );

        if (!exists) {
          const normalizedName = game.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const needsZone =
            game.name.toLowerCase().includes('mobile legends') ||
            game.name.toLowerCase().includes('mlbb') ||
            game.name.toLowerCase().includes('magic chess');

          const { error } = await supabase.from('game_verification_configs').insert({
            game_name: game.name,
            api_code: normalizedName,
            api_provider: 'g2bulk',
            requires_zone: needsZone,
            is_active: true,
            alternate_api_codes: []
          });

          if (!error) synced++;
        }
      }

      if (synced > 0) {
        toast({ title: `Synced ${synced} new game configs!` });
        fetchConfigs();
      } else {
        toast({ title: 'All games already have configs', description: 'No new configs to sync' });
      }
    } catch (error) {
      toast({ title: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  // Sync game codes from G2Bulk API (fetches real game codes + region variants)
  const handleSyncFromG2Bulk = async () => {
    setSyncingG2Bulk(true);
    try {
      toast({ title: 'Fetching games from G2Bulk...', description: 'This may take a moment.' });

      const { data, error } = await supabase.functions.invoke('g2bulk-api', {
        body: { action: 'get_games' }
      });

      if (error) throw error;
      if (!data?.success || !data?.data?.games) {
        throw new Error(data?.error || 'Failed to fetch games from G2Bulk');
      }

      const g2Games: { code: string; name: string }[] = data.data.games;
      console.log(`[G2Bulk Sync] Fetched ${g2Games.length} games`);

      // Build map of base game name -> codes (handles regional variants like "mlbb", "mlbb-ph", "mlbb-id")
      const codesByBaseName = new Map<string, string[]>();
      for (const g of g2Games) {
        // Extract base name by removing common region suffixes
        const baseName = g.name.toLowerCase()
          .replace(/\s*\(.*\)$/, '') // Remove (Region) suffix
          .replace(/\s+-\s+\w+$/, '') // Remove " - XX" suffix
          .trim();

        if (!codesByBaseName.has(baseName)) {
          codesByBaseName.set(baseName, []);
        }
        codesByBaseName.get(baseName)!.push(g.code);
      }

      let updated = 0;
      let created = 0;

      for (const g of g2Games) {
        const baseName = g.name.toLowerCase()
          .replace(/\s*\(.*\)$/, '')
          .replace(/\s+-\s+\w+$/, '')
          .trim();

        const allCodes = codesByBaseName.get(baseName) || [g.code];
        const primaryCode = allCodes[0];
        const alternateCodes = allCodes.slice(1);

        // Check if config exists for this game name
        const existingExact = configs.find(c => c.game_name.toLowerCase() === g.name.toLowerCase());
        const existingBase = configs.find(c => c.game_name.toLowerCase() === baseName);

        if (existingExact) {
          // Update existing config with correct code + alternates
          const { error: updateError } = await supabase
            .from('game_verification_configs')
            .update({
              api_code: primaryCode,
              api_provider: 'g2bulk',
              alternate_api_codes: alternateCodes,
            })
            .eq('id', existingExact.id);

          if (!updateError) updated++;
        } else if (!existingBase) {
          // Create new config
          const needsZone = g.name.toLowerCase().includes('mobile legends') ||
            g.name.toLowerCase().includes('mlbb') ||
            g.name.toLowerCase().includes('magic chess');

          const { error: insertError } = await supabase
            .from('game_verification_configs')
            .insert({
              game_name: g.name,
              api_code: primaryCode,
              api_provider: 'g2bulk',
              requires_zone: needsZone,
              is_active: true,
              alternate_api_codes: alternateCodes,
            });

          if (!insertError) created++;
        }
      }

      toast({
        title: 'G2Bulk sync complete!',
        description: `Created ${created} configs, updated ${updated} codes.`
      });
      fetchConfigs();
    } catch (error: any) {
      console.error('G2Bulk sync error:', error);
      toast({
        title: 'G2Bulk sync failed',
        description: error?.message || 'Check console for details',
        variant: 'destructive'
      });
    } finally {
      setSyncingG2Bulk(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-gold/30">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                Game ID Verification Configs
              </CardTitle>
              <CardDescription className="mt-1">
                Manage G2Bulk game codes for player ID verification. Use "Sync from G2Bulk" to fetch real game codes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchConfigs}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncFromGames}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                Sync from Games
              </Button>
              <Button
                size="sm"
                onClick={handleSyncFromG2Bulk}
                disabled={syncingG2Bulk}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {syncingG2Bulk ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4 mr-1" />
                )}
                Sync from G2Bulk
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-gold hover:bg-gold-dark text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Config
              </Button>
            </div>
          </div>
        </CardHeader>

        {showAddForm && (
          <CardContent className="border-t border-border pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-sm">Game Name</Label>
                <Input
                  value={newConfig.game_name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, game_name: e.target.value }))}
                  placeholder="e.g. Mobile Legends"
                  className="border-gold/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">API Code (G2Bulk)</Label>
                <Input
                  value={newConfig.api_code}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, api_code: e.target.value }))}
                  placeholder="e.g. mlbb"
                  className="border-gold/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Default Zone</Label>
                <Input
                  value={newConfig.default_zone}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, default_zone: e.target.value }))}
                  placeholder="Optional"
                  className="border-gold/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Alternate Codes (comma-sep)</Label>
                <Input
                  value={newConfig.alternate_api_codes}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, alternate_api_codes: e.target.value }))}
                  placeholder="e.g. mlbb-ph, mlbb-id"
                  className="border-gold/50 mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newConfig.requires_zone}
                  onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, requires_zone: checked }))}
                />
                <Label className="text-sm">Requires Zone/Server ID</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newConfig.is_active}
                  onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, is_active: checked }))}
                />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} className="bg-gold hover:bg-gold-dark text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configs List */}
      <Card className="border-gold/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-3 font-medium">Game Name</th>
                  <th className="p-3 font-medium">API Code</th>
                  <th className="p-3 font-medium">Alternates</th>
                  <th className="p-3 font-medium">Zone</th>
                  <th className="p-3 font-medium text-center">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-secondary/20">
                    {editingId === config.id ? (
                      <>
                        <td className="p-3">
                          <Input
                            value={editData.game_name || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, game_name: e.target.value }))}
                            className="h-8 border-gold/50"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={editData.api_code || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, api_code: e.target.value }))}
                            className="h-8 border-gold/50"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={(editData.alternate_api_codes || []).join(', ')}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              alternate_api_codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }))}
                            placeholder="code1, code2"
                            className="h-8 border-gold/50 w-32"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editData.requires_zone || false}
                              onCheckedChange={(checked) => setEditData(prev => ({ ...prev, requires_zone: checked }))}
                            />
                            <Input
                              value={editData.default_zone || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, default_zone: e.target.value }))}
                              placeholder="Default"
                              className="h-8 w-20 border-gold/50"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Switch
                            checked={editData.is_active || false}
                            onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_active: checked }))}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gold hover:text-gold-dark"
                              onClick={handleSaveEdit}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-medium">{config.game_name}</td>
                        <td className="p-3">
                          <code className="text-xs bg-secondary px-2 py-1 rounded">{config.api_code}</code>
                        </td>
                        <td className="p-3">
                          {config.alternate_api_codes && config.alternate_api_codes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {config.alternate_api_codes.slice(0, 2).map((code, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {code}
                                </Badge>
                              ))}
                              {config.alternate_api_codes.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{config.alternate_api_codes.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {config.requires_zone ? (
                            <Badge variant="secondary" className="text-xs">
                              Required {config.default_zone && `(${config.default_zone})`}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleToggleActive(config.id, config.is_active)}>
                            {config.is_active ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive mx-auto" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(config)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(config.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {configs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No verification configs found. Click "Sync from G2Bulk" to fetch game codes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>G2Bulk Integration:</strong> Click "Sync from G2Bulk" to fetch the exact game codes from the G2Bulk API.
            Games with multiple regional variants (e.g. mlbb, mlbb-ph, mlbb-id) will have alternate codes populated automatically.
            If verification fails, the system will try alternate codes before returning an error.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameVerificationConfigsTab;
