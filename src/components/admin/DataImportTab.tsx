import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Database, Loader2, CheckCircle, XCircle, FileJson, AlertTriangle, Trash2 } from 'lucide-react';

type TableStatus = 'pending' | 'loading' | 'done' | 'error' | 'skipped';

interface TableConfig {
  name: string;
  displayName: string;
  category: 'core' | 'config';
  importOrder: number; // Lower = import first (for foreign key dependencies)
}

// Only allow importing template/config tables, not user data
const IMPORTABLE_TABLES: TableConfig[] = [
  { name: 'site_settings', displayName: 'Site Settings', category: 'config', importOrder: 1 },
  { name: 'payment_gateways', displayName: 'Payment Gateways', category: 'config', importOrder: 2 },
  { name: 'payment_qr_settings', displayName: 'Payment QR Settings', category: 'config', importOrder: 3 },
  { name: 'api_configurations', displayName: 'API Configurations', category: 'config', importOrder: 4 },
  { name: 'games', displayName: 'Games', category: 'core', importOrder: 5 },
  { name: 'game_verification_configs', displayName: 'Game Verification Configs', category: 'config', importOrder: 6 },
  { name: 'packages', displayName: 'Packages', category: 'core', importOrder: 7 },
  { name: 'special_packages', displayName: 'Special Packages', category: 'core', importOrder: 8 },
  { name: 'g2bulk_products', displayName: 'G2Bulk Products', category: 'core', importOrder: 9 },
];

export function DataImportTab() {
  const [importData, setImportData] = useState<Record<string, any> | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableStatus, setTableStatus] = useState<Record<string, TableStatus>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [clearBeforeImport, setClearBeforeImport] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(data);
        setFileName(file.name);
        
        // Auto-select tables that exist in the import file
        const availableTables = IMPORTABLE_TABLES
          .filter(t => data[t.name] && Array.isArray(data[t.name]) && data[t.name].length > 0)
          .map(t => t.name);
        setSelectedTables(availableTables);
        setTableStatus({});
        
        toast.success(`Loaded ${file.name}`);
      } catch (error) {
        toast.error('Invalid JSON file');
        console.error('Parse error:', error);
      }
    };
    reader.readAsText(file);
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const getTableRowCount = (tableName: string): number => {
    if (!importData || !importData[tableName]) return 0;
    return Array.isArray(importData[tableName]) ? importData[tableName].length : 0;
  };

  const clearTable = async (tableName: string): Promise<void> => {
    // Delete all rows - using a filter that matches all
    const { error } = await supabase
      .from(tableName as any)
      .delete()
      .gte('created_at', '1970-01-01');
    
    if (error) {
      console.warn(`Could not clear ${tableName}:`, error.message);
    }
  };

  const importTableData = async (tableName: string, rows: any[]): Promise<number> => {
    if (!rows || rows.length === 0) return 0;

    // Remove fields that might cause conflicts
    const cleanedRows = rows.map(row => {
      const cleaned = { ...row };
      // Don't import these fields - let database generate them
      // But keep 'id' for foreign key references
      delete cleaned.updated_at;
      return cleaned;
    });

    // For api_configurations, ensure secrets are not imported (they're redacted)
    if (tableName === 'api_configurations') {
      cleanedRows.forEach(row => {
        if (row.api_secret === '[REDACTED]') {
          row.api_secret = null;
        }
      });
    }

    // Use upsert to handle existing records
    const { error, data } = await supabase
      .from(tableName as any)
      .upsert(cleanedRows, { onConflict: 'id' })
      .select();

    if (error) {
      throw new Error(`Failed to import ${tableName}: ${error.message}`);
    }

    return data?.length || cleanedRows.length;
  };

  const handleImport = async () => {
    if (!importData || selectedTables.length === 0) {
      toast.error('Please select tables to import');
      return;
    }

    const confirmed = window.confirm(
      clearBeforeImport
        ? `This will CLEAR and REPLACE data in ${selectedTables.length} table(s). Continue?`
        : `This will MERGE data into ${selectedTables.length} table(s). Existing records with same IDs will be updated. Continue?`
    );
    if (!confirmed) return;

    setIsImporting(true);
    const initialStatus: Record<string, TableStatus> = {};
    selectedTables.forEach(t => initialStatus[t] = 'pending');
    setTableStatus(initialStatus);

    // Sort tables by import order
    const sortedTables = [...selectedTables].sort((a, b) => {
      const orderA = IMPORTABLE_TABLES.find(t => t.name === a)?.importOrder || 99;
      const orderB = IMPORTABLE_TABLES.find(t => t.name === b)?.importOrder || 99;
      return orderA - orderB;
    });

    let successCount = 0;
    let totalRows = 0;

    try {
      for (const tableName of sortedTables) {
        setTableStatus(prev => ({ ...prev, [tableName]: 'loading' }));

        try {
          const rows = importData[tableName];
          if (!rows || !Array.isArray(rows) || rows.length === 0) {
            setTableStatus(prev => ({ ...prev, [tableName]: 'skipped' }));
            continue;
          }

          // Clear table first if option is enabled
          if (clearBeforeImport) {
            await clearTable(tableName);
          }

          const imported = await importTableData(tableName, rows);
          totalRows += imported;
          successCount++;
          setTableStatus(prev => ({ ...prev, [tableName]: 'done' }));
        } catch (error) {
          console.error(`Error importing ${tableName}:`, error);
          setTableStatus(prev => ({ ...prev, [tableName]: 'error' }));
        }
      }

      toast.success(`Imported ${totalRows} rows into ${successCount} table(s)`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import failed. Check console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setImportData(null);
    setFileName('');
    setSelectedTables([]);
    setTableStatus({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      case 'skipped':
        return <span className="text-xs text-muted-foreground">Skipped</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data (Seed Database)
          </CardTitle>
          <CardDescription>
            Import configuration and game data from a JSON export file.
            Use this to set up a new database with your template data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-3">
            <Label>Select Export File</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                Choose JSON File
              </Button>
              {fileName && (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <FileJson className="h-3 w-3" />
                    {fileName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    disabled={isImporting}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {importData && (
            <>
              {/* Import Options */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-before"
                  checked={clearBeforeImport}
                  onCheckedChange={(checked) => setClearBeforeImport(checked as boolean)}
                  disabled={isImporting}
                />
                <Label htmlFor="clear-before" className="cursor-pointer">
                  Clear existing data before import (recommended for fresh setup)
                </Label>
              </div>

              {/* Warning */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  {clearBeforeImport
                    ? 'This will DELETE existing data in selected tables before importing. Make sure you have a backup!'
                    : 'Existing records with matching IDs will be OVERWRITTEN.'}
                </AlertDescription>
              </Alert>

              {/* Table Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Select Tables to Import</h4>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {IMPORTABLE_TABLES.map(table => {
                    const rowCount = getTableRowCount(table.name);
                    const hasData = rowCount > 0;
                    
                    return (
                      <div
                        key={table.name}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          !hasData ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`import-${table.name}`}
                            checked={selectedTables.includes(table.name)}
                            onCheckedChange={() => toggleTable(table.name)}
                            disabled={isImporting || !hasData}
                          />
                          <Label
                            htmlFor={`import-${table.name}`}
                            className="cursor-pointer text-sm"
                          >
                            {table.displayName}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={hasData ? 'default' : 'secondary'} className="text-xs">
                            {rowCount} rows
                          </Badge>
                          {tableStatus[table.name] && getStatusIcon(tableStatus[table.name])}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Import Button */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || selectedTables.length === 0}
                  variant="destructive"
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {isImporting ? 'Importing...' : `Import ${selectedTables.length} Table(s)`}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedTables.reduce((sum, t) => sum + getTableRowCount(t), 0)} total rows
                </span>
              </div>
            </>
          )}

          {/* Instructions */}
          {!importData && (
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">How to use:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Export your database from the "Export" tab as JSON</li>
                    <li>Share the JSON file with your friend</li>
                    <li>They upload it here to seed their new database</li>
                    <li>All games, packages, payment gateways, and settings will be imported</li>
                  </ol>
                  <p className="text-muted-foreground mt-2">
                    <strong>Note:</strong> User data (profiles, orders, transactions) is NOT imported for security.
                    API secrets are also excluded - configure those manually after import.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
