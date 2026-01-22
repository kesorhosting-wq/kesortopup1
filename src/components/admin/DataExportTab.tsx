import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, Database, Loader2, CheckCircle, XCircle, FileJson, FileCode } from 'lucide-react';

type TableStatus = 'pending' | 'loading' | 'done' | 'error';
type ExportFormat = 'json' | 'sql';

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

// Convert value to MySQL-compatible SQL string
const toMySQLValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (typeof value === 'object') {
    // JSON objects/arrays - escape and wrap in quotes
    const jsonStr = JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
    return `'${jsonStr}'`;
  }
  // String - escape single quotes
  const escaped = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return `'${escaped}'`;
};

// Convert PostgreSQL column name to MySQL-safe backtick format
const toMySQLColumn = (col: string): string => {
  return `\`${col}\``;
};

// Generate MySQL INSERT statements for a table
const generateMySQLInserts = (tableName: string, rows: any[]): string => {
  if (!rows || rows.length === 0) {
    return `-- No data in table: ${tableName}\n`;
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.map(toMySQLColumn).join(', ');
  
  let sql = `-- Table: ${tableName}\n`;
  sql += `-- Rows: ${rows.length}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  // Generate INSERT statements in batches of 100 for performance
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
    
    const valueRows = batch.map(row => {
      const values = columns.map(col => toMySQLValue(row[col]));
      return `  (${values.join(', ')})`;
    });
    
    sql += valueRows.join(',\n');
    sql += ';\n\n';
  }
  
  return sql;
};

// Generate full MySQL export file
const generateMySQLExport = (data: Record<string, any[]>): string => {
  let sql = `-- =====================================================\n`;
  sql += `-- MySQL/MariaDB Database Export\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Source: Lovable Cloud (PostgreSQL)\n`;
  sql += `-- =====================================================\n\n`;
  sql += `SET NAMES utf8mb4;\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
  
  for (const [tableName, rows] of Object.entries(data)) {
    if (tableName === '_metadata') continue;
    sql += generateMySQLInserts(tableName, rows);
  }
  
  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  sql += `\n-- Export complete\n`;
  
  return sql;
};

export function DataExportTab() {
  const [selectedTables, setSelectedTables] = useState<string[]>(TABLES.map(t => t.name));
  const [tableStatus, setTableStatus] = useState<Record<string, TableStatus>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

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
        targetFormat: exportFormat === 'sql' ? 'MySQL/MariaDB SQL' : 'JSON',
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

      // Generate file based on format
      let blob: Blob;
      let filename: string;
      const dateStr = new Date().toISOString().split('T')[0];

      if (exportFormat === 'sql') {
        const sqlContent = generateMySQLExport(exportData);
        blob = new Blob([sqlContent], { type: 'text/sql' });
        filename = `database-export-${dateStr}.sql`;
      } else {
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `database-export-${dateStr}.json`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const successCount = Object.values(tableStatus).filter(s => s === 'done').length;
      toast.success(`Exported ${successCount} tables as ${exportFormat.toUpperCase()}!`);
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
            Export your database tables as JSON or MySQL SQL for backup or migration.
            Sensitive credentials will be automatically redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Export Format</h4>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4" />
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sql" id="format-sql" />
                <Label htmlFor="format-sql" className="flex items-center gap-2 cursor-pointer">
                  <FileCode className="h-4 w-4" />
                  MySQL SQL
                </Label>
              </div>
            </RadioGroup>
          </div>

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
              {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedTables.length} table(s) selected
            </span>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              {exportFormat === 'sql' ? (
                <FileCode className="mt-0.5 h-5 w-5 text-muted-foreground" />
              ) : (
                <FileJson className="mt-0.5 h-5 w-5 text-muted-foreground" />
              )}
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {exportFormat === 'sql' ? 'MySQL SQL Format' : 'JSON Format'}
                </p>
                <p className="text-muted-foreground">
                  {exportFormat === 'sql' 
                    ? 'Generates MySQL/MariaDB compatible INSERT statements. Import directly into MySQL using mysql CLI, phpMyAdmin, or DBeaver. Foreign key checks are disabled during import.'
                    : 'Data is exported as JSON with metadata. You can convert this to MySQL INSERT statements or import directly into tools like phpMyAdmin or DBeaver.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
