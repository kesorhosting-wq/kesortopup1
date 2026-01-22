import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Database, Loader2, CheckCircle, XCircle, FileJson } from 'lucide-react';

type TableStatus = 'pending' | 'loading' | 'done' | 'error';

interface TableConfig {
  name: string;
  displayName: string;
  category: 'core' | 'users' | 'orders' | 'config';
}

const TABLES: TableConfig[] = [
  { name: 'games', displayName: 'Games', category: 'core' },
  { name: 'packages', displayName: 'Packages', category: 'core' },
  { name: 'special_packages', displayName: 'Special Packages', category: 'core' },
  { name: 'g2bulk_products', displayName: 'G2Bulk Products', category: 'core' },
  { name: 'profiles', displayName: 'User Profiles', category: 'users' },
  { name: 'user_roles', displayName: 'User Roles', category: 'users' },
  { name: 'wallet_transactions', displayName: 'Wallet Transactions', category: 'users' },
  { name: 'topup_orders', displayName: 'Top-up Orders', category: 'orders' },
  { name: 'site_settings', displayName: 'Site Settings', category: 'config' },
  { name: 'payment_gateways', displayName: 'Payment Gateways', category: 'config' },
  { name: 'payment_qr_settings', displayName: 'Payment QR Settings', category: 'config' },
  { name: 'api_configurations', displayName: 'API Configurations', category: 'config' },
  { name: 'game_verification_configs', displayName: 'Game Verification Configs', category: 'config' },
];

const CATEGORIES = [
  { id: 'core', label: 'Core Data', description: 'Games, packages, products' },
  { id: 'users', label: 'User Data', description: 'Profiles, roles, wallets' },
  { id: 'orders', label: 'Orders', description: 'Transaction history' },
  { id: 'config', label: 'Configuration', description: 'Settings & API configs' },
];

export function DataExportTab() {
  const [selectedTables, setSelectedTables] = useState<string[]>(TABLES.map(t => t.name));
  const [tableStatus, setTableStatus] = useState<Record<string, TableStatus>>({});
  const [isExporting, setIsExporting] = useState(false);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryTables = TABLES.filter(t => t.category === category).map(t => t.name);
    const allSelected = categoryTables.every(t => selectedTables.includes(t));
    
    if (allSelected) {
      setSelectedTables(prev => prev.filter(t => !categoryTables.includes(t)));
    } else {
      setSelectedTables(prev => [...new Set([...prev, ...categoryTables])]);
    }
  };

  const fetchTableData = async (tableName: string): Promise<any[]> => {
    const { data, error } = await supabase.from(tableName as any).select('*');
    
    if (error) {
      throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
    }

    const rows = data as any[] | null;

    // Redact sensitive data from api_configurations
    if (tableName === 'api_configurations' && rows) {
      return rows.map(row => ({
        ...row,
        api_secret: row.api_secret ? '[REDACTED]' : null,
      }));
    }

    return rows || [];
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table to export');
      return;
    }

    setIsExporting(true);
    const initialStatus: Record<string, TableStatus> = {};
    selectedTables.forEach(t => initialStatus[t] = 'pending');
    setTableStatus(initialStatus);

    const exportData: Record<string, any> = {
      _metadata: {
        exportedAt: new Date().toISOString(),
        source: 'Lovable Cloud (PostgreSQL)',
        targetFormat: 'MySQL/MariaDB Compatible',
        tables: {},
      },
    };

    try {
      for (const tableName of selectedTables) {
        setTableStatus(prev => ({ ...prev, [tableName]: 'loading' }));
        
        try {
          const data = await fetchTableData(tableName);
          exportData[tableName] = data;
          exportData._metadata.tables[tableName] = {
            rowCount: data.length,
            exportedAt: new Date().toISOString(),
          };
          setTableStatus(prev => ({ ...prev, [tableName]: 'done' }));
        } catch (error) {
          console.error(`Error exporting ${tableName}:`, error);
          setTableStatus(prev => ({ ...prev, [tableName]: 'error' }));
          exportData[tableName] = [];
          exportData._metadata.tables[tableName] = {
            rowCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      // Generate and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const successCount = Object.values(tableStatus).filter(s => s === 'done').length;
      toast.success(`Exported ${successCount} tables successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export your database tables as JSON for backup or MySQL migration.
            Sensitive credentials will be automatically redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(category => {
              const categoryTables = TABLES.filter(t => t.category === category.id);
              const selectedCount = categoryTables.filter(t => selectedTables.includes(t.name)).length;
              const allSelected = selectedCount === categoryTables.length;
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    allSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <Badge variant={allSelected ? 'default' : 'secondary'}>
                        {selectedCount}/{categoryTables.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Individual Table Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Select Tables</h4>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {TABLES.map(table => (
                <div
                  key={table.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={table.name}
                      checked={selectedTables.includes(table.name)}
                      onCheckedChange={() => toggleTable(table.name)}
                      disabled={isExporting}
                    />
                    <Label
                      htmlFor={table.name}
                      className="cursor-pointer text-sm"
                    >
                      {table.displayName}
                    </Label>
                  </div>
                  {tableStatus[table.name] && getStatusIcon(tableStatus[table.name])}
                </div>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedTables.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export Selected Tables'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedTables.length} table(s) selected
            </span>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <FileJson className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Export Format</p>
                <p className="text-muted-foreground">
                  Data is exported as JSON with metadata. You can convert this to MySQL INSERT
                  statements or import directly into tools like phpMyAdmin or DBeaver.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
