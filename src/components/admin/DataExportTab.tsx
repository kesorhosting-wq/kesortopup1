import React, { useState, useRef } from 'react';
import { Download, Upload, FileJson, Database, Loader2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const EXPORT_TABLES = [
  { key: 'site_settings', label: 'Site Settings', uniqueKey: 'key' },
  { key: 'games', label: 'Games', uniqueKey: 'id' },
  { key: 'packages', label: 'Packages', uniqueKey: 'id' },
  { key: 'special_packages', label: 'Special Packages', uniqueKey: 'id' },
  { key: 'payment_gateways', label: 'Payment Gateways', uniqueKey: 'slug' },
  { key: 'payment_qr_settings', label: 'Payment QR Settings', uniqueKey: 'payment_method' },
  { key: 'game_verification_configs', label: 'Game Verification Configs', uniqueKey: 'game_name' },
  { key: 'g2bulk_products', label: 'G2Bulk Products', uniqueKey: 'g2bulk_product_id' },
  { key: 'api_configurations', label: 'API Configurations', uniqueKey: 'api_name' },
] as const;

type TableKey = typeof EXPORT_TABLES[number]['key'];

// Fields to redact for security (export only)
const REDACT_FIELDS: Record<string, string[]> = {
  api_configurations: ['api_secret', 'api_uid'],
  payment_gateways: ['config'],
};

// Fields to skip on import (auto-generated or should not be overwritten)
const SKIP_IMPORT_FIELDS = ['id', 'created_at', 'updated_at'];

export const DataExportTab: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(
    EXPORT_TABLES.map(t => t.key)
  );
  const [importPreview, setImportPreview] = useState<Record<string, unknown[]> | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTable = (tableKey: string) => {
    setSelectedTables(prev => 
      prev.includes(tableKey) 
        ? prev.filter(t => t !== tableKey)
        : [...prev, tableKey]
    );
  };

  const selectAll = () => {
    setSelectedTables(EXPORT_TABLES.map(t => t.key));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const fetchTableData = async (tableName: string) => {
    const { data, error } = await supabase
      .from(tableName as 'games')
      .select('*');
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    
    // Redact sensitive fields
    const fieldsToRedact = REDACT_FIELDS[tableName] || [];
    if (fieldsToRedact.length > 0 && data) {
      return data.map(row => {
        const redactedRow = { ...row };
        fieldsToRedact.forEach(field => {
          if (field in redactedRow) {
            (redactedRow as Record<string, unknown>)[field] = '[REDACTED]';
          }
        });
        return redactedRow;
      });
    }
    
    return data || [];
  };

  const handleExportJSON = async () => {
    if (selectedTables.length === 0) {
      toast({ title: 'No tables selected', variant: 'destructive' });
      return;
    }
    
    setIsExporting(true);
    try {
      const exportData: Record<string, unknown[]> = {};
      
      for (const table of selectedTables) {
        exportData[table] = await fetchTableData(table);
      }
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export successful', description: 'JSON file downloaded' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const escapeSQL = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const handleExportSQL = async () => {
    if (selectedTables.length === 0) {
      toast({ title: 'No tables selected', variant: 'destructive' });
      return;
    }
    
    setIsExporting(true);
    try {
      const sqlStatements: string[] = [];
      sqlStatements.push('-- Database Export');
      sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
      sqlStatements.push('-- Note: Sensitive fields have been redacted\n');

      for (const table of selectedTables) {
        const data = await fetchTableData(table);
        
        if (data.length === 0) {
          sqlStatements.push(`-- No data in ${table}\n`);
          continue;
        }

        sqlStatements.push(`-- Table: ${table}`);
        sqlStatements.push(`DELETE FROM \`${table}\`;`);
        
        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map(col => escapeSQL(row[col as keyof typeof row]));
          sqlStatements.push(
            `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});`
          );
        }
        sqlStatements.push('');
      }

      const sqlString = sqlStatements.join('\n');
      const blob = new Blob([sqlString], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export successful', description: 'SQL file downloaded' });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as Record<string, unknown[]>;
        
        // Validate structure
        const validTables = EXPORT_TABLES.map(t => t.key);
        const importTables = Object.keys(data).filter(key => validTables.includes(key as TableKey));
        
        if (importTables.length === 0) {
          toast({ 
            title: 'Invalid file', 
            description: 'No valid tables found in the import file',
            variant: 'destructive' 
          });
          return;
        }

        // Filter to only valid tables
        const filteredData: Record<string, unknown[]> = {};
        importTables.forEach(table => {
          filteredData[table] = data[table];
        });

        setImportPreview(filteredData);
        setShowImportDialog(true);
      } catch (error) {
        console.error('Parse error:', error);
        toast({ 
          title: 'Invalid JSON file', 
          description: 'Could not parse the import file',
          variant: 'destructive' 
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImportRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const processed: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Skip auto-generated fields
      if (SKIP_IMPORT_FIELDS.includes(key)) continue;
      
      // Skip redacted fields
      if (value === '[REDACTED]') continue;
      
      processed[key] = value;
    }
    
    return processed;
  };

  const handleImport = async () => {
    if (!importPreview) return;
    
    setIsImporting(true);
    const results: { table: string; success: number; errors: number }[] = [];

    try {
      for (const [tableName, rows] of Object.entries(importPreview)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;
        
        const tableConfig = EXPORT_TABLES.find(t => t.key === tableName);
        if (!tableConfig) continue;

        let successCount = 0;
        let errorCount = 0;

        for (const row of rows) {
          const processedRow = processImportRow(row as Record<string, unknown>);
          
          if (Object.keys(processedRow).length === 0) continue;

          // Use upsert with the unique key for the table
          const uniqueKey = tableConfig.uniqueKey;
          const uniqueValue = (row as Record<string, unknown>)[uniqueKey];
          
          if (uniqueValue === undefined) {
            // Just insert if no unique key value
            const { error } = await supabase
              .from(tableName as 'games')
              .insert(processedRow as never);
            
            if (error) {
              console.error(`Import error for ${tableName}:`, error);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            // Upsert by unique key
            const { error } = await supabase
              .from(tableName as 'games')
              .upsert(
                { ...processedRow, [uniqueKey]: uniqueValue } as never,
                { onConflict: uniqueKey }
              );
            
            if (error) {
              console.error(`Import error for ${tableName}:`, error);
              errorCount++;
            } else {
              successCount++;
            }
          }
        }

        results.push({ table: tableName, success: successCount, errors: errorCount });
      }

      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

      toast({ 
        title: 'Import completed', 
        description: `${totalSuccess} records imported, ${totalErrors} errors`,
        variant: totalErrors > 0 ? 'destructive' : 'default'
      });

      setShowImportDialog(false);
      setImportPreview(null);
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Export Database
          </CardTitle>
          <CardDescription>
            Select the data you want to export. Sensitive fields are automatically redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Table Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Select Tables to Export</h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  <Square className="w-4 h-4 mr-1" />
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EXPORT_TABLES.map(table => (
                <div 
                  key={table.key} 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={table.key}
                    checked={selectedTables.includes(table.key)}
                    onCheckedChange={() => toggleTable(table.key)}
                  />
                  <Label 
                    htmlFor={table.key} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {table.label}
                  </Label>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {selectedTables.length} of {EXPORT_TABLES.length} tables selected
            </p>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-gold transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <FileJson className="w-12 h-12 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">JSON Format</h3>
                    <p className="text-sm text-muted-foreground">
                      Best for backup and programmatic use
                    </p>
                  </div>
                  <Button 
                    onClick={handleExportJSON}
                    disabled={isExporting || selectedTables.length === 0}
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-gold transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Database className="w-12 h-12 text-green-500" />
                  <div>
                    <h3 className="font-semibold">SQL Format</h3>
                    <p className="text-sm text-muted-foreground">
                      MySQL-compatible INSERT statements
                    </p>
                  </div>
                  <Button 
                    onClick={handleExportSQL}
                    disabled={isExporting || selectedTables.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export SQL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Database
          </CardTitle>
          <CardDescription>
            Import data from a previously exported JSON file. Existing records will be updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Import will upsert (insert or update) records. 
              Redacted fields will be skipped. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select JSON File to Import
          </Button>
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              The following data will be imported:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importPreview && Object.entries(importPreview).map(([table, rows]) => {
              const tableLabel = EXPORT_TABLES.find(t => t.key === table)?.label || table;
              return (
                <div 
                  key={table} 
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <span className="font-medium">{tableLabel}</span>
                  <span className="text-sm text-muted-foreground">
                    {Array.isArray(rows) ? rows.length : 0} records
                  </span>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportDialog(false);
                setImportPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={isImporting}
              className="bg-gold hover:bg-gold/90"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataExportTab;
