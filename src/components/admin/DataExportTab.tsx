import React, { useState } from 'react';
import { Download, FileJson, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const EXPORT_TABLES = [
  'site_settings',
  'games',
  'packages',
  'special_packages',
  'payment_gateways',
  'payment_qr_settings',
  'game_verification_configs',
  'g2bulk_products',
  'api_configurations',
] as const;

// Fields to redact for security
const REDACT_FIELDS: Record<string, string[]> = {
  api_configurations: ['api_secret', 'api_uid'],
  payment_gateways: ['config'],
};

export const DataExportTab: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const fetchTableData = async (tableName: string) => {
    // Use type assertion to allow dynamic table names
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
    setIsExporting(true);
    try {
      const exportData: Record<string, unknown[]> = {};
      
      for (const table of EXPORT_TABLES) {
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
    setIsExporting(true);
    try {
      const sqlStatements: string[] = [];
      sqlStatements.push('-- Database Export');
      sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
      sqlStatements.push('-- Note: Sensitive fields have been redacted\n');

      for (const table of EXPORT_TABLES) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Export Database
          </CardTitle>
          <CardDescription>
            Download your database configuration as JSON or SQL format. 
            Sensitive fields (API keys, secrets) are automatically redacted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    disabled={isExporting}
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
                    disabled={isExporting}
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

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Included Tables:</h4>
            <div className="flex flex-wrap gap-2">
              {EXPORT_TABLES.map(table => (
                <span 
                  key={table} 
                  className="px-2 py-1 bg-background rounded text-xs font-mono"
                >
                  {table}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExportTab;
