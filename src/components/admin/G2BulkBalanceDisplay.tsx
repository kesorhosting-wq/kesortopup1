import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BalanceData {
  balance?: string | number;
  currency?: string;
  username?: string;
}

const G2BulkBalanceDisplay: React.FC = () => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  const checkConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('api_configurations')
        .select('is_enabled')
        .eq('api_name', 'g2bulk')
        .maybeSingle();
      
      if (data) {
        setIsEnabled(data.is_enabled || false);
      }
    } catch (err) {
      console.error('Error checking G2Bulk config:', err);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!isEnabled) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('g2bulk-api', {
        body: { action: 'get_account_balance' },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        const apiData = data.data;
        // Handle different response structures
        const balanceValue = apiData.data?.balance ?? apiData.balance ?? null;
        const currency = apiData.data?.currency ?? apiData.currency ?? 'USD';
        const username = apiData.username ?? apiData.data?.username ?? null;
        
        if (balanceValue !== null) {
          setBalance({ balance: balanceValue, currency, username });
        } else {
          setBalance({ balance: 'N/A' });
        }
      } else {
        setError('Failed to fetch');
      }
    } catch (err) {
      console.error('Error fetching G2Bulk balance:', err);
      setError('Error');
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

  useEffect(() => {
    if (isEnabled) {
      fetchBalance();
      // Refresh balance every 5 minutes
      const interval = setInterval(fetchBalance, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, fetchBalance]);

  if (!isEnabled) {
    return null;
  }

  const formatBalance = (val: string | number | undefined) => {
    if (val === undefined || val === null) return 'N/A';
    if (typeof val === 'number') return val.toFixed(2);
    return val;
  };

  const balanceNum = typeof balance?.balance === 'number' ? balance.balance : 0;
  const isLowBalance = balanceNum < 5;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 shadow-lg
            transition-all duration-300 hover:scale-105
            ${isLowBalance 
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50' 
              : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/50'
            }
          `}>
            {/* Icon */}
            <div className={`
              p-2 rounded-lg
              ${isLowBalance 
                ? 'bg-amber-500/30' 
                : 'bg-emerald-500/30'
              }
            `}>
              <Wallet className={`w-5 h-5 ${isLowBalance ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            
            {/* Balance info */}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                G2Bulk Balance
              </span>
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : error ? (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold ${isLowBalance ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {balance?.currency === 'USD' && '$'}
                    {formatBalance(balance?.balance)}
                  </span>
                  {balance?.currency && balance.currency !== 'USD' && (
                    <span className="text-xs text-muted-foreground">{balance.currency}</span>
                  )}
                  {!isLowBalance && (
                    <TrendingUp className="w-4 h-4 text-emerald-500 ml-1" />
                  )}
                </div>
              )}
            </div>
            
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background/50 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                fetchBalance();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="text-center">
            <p className="font-semibold">G2Bulk Account</p>
            {balance?.username && (
              <p className="text-sm text-muted-foreground">@{balance.username}</p>
            )}
            {isLowBalance && (
              <p className="text-xs text-amber-500 mt-1">⚠️ Low balance - consider topping up</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default G2BulkBalanceDisplay;
