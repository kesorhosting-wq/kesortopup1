import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Plus, History, Loader2, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useSite } from '@/contexts/SiteContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import KhmerFrame from '@/components/KhmerFrame';
import KHQRPaymentCard from '@/components/KHQRPaymentCard';

interface WalletTransaction {
  id: string;
  type: 'topup' | 'purchase' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface GeneratedQR {
  qrCode: string;
  wsUrl: string;
  orderId: string;
  amount: number;
}

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, ikhodePayment } = useSite();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<GeneratedQR | null>(null);

  // Quick top-up amounts
  const quickAmounts = [1, 5, 10, 20, 50, 100];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadWalletData();
  }, [user, navigate]);

  // Subscribe to realtime wallet updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newTx = payload.new as WalletTransaction;
          setBalance(newTx.balance_after);
          setTransactions(prev => [newTx, ...prev]);
          
          if (newTx.type === 'topup') {
            toast({ title: 'Wallet topped up!', description: `$${newTx.amount.toFixed(2)} added to your wallet` });
            setGeneratedQR(null);
            setTopupAmount('');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;
    
    try {
      // Get balance from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();
      
      setBalance(profile?.wallet_balance || 0);

      // Get transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions((txData as WalletTransaction[]) || []);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (!ikhodePayment?.isEnabled) {
      toast({ title: 'Payment not available', description: 'KHQR payment is not configured. Please configure it in Admin → Settings → IKhode Settings.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const walletOrderId = `wallet-${user?.id?.slice(0, 8)}-${Date.now()}`;
      
      // Generate KHQR for wallet top-up using the correct action format
      const { data, error } = await supabase.functions.invoke('ikhode-payment', {
        body: {
          action: 'generate-khqr',
          amount: amount,
          orderId: walletOrderId,
          playerName: user?.email?.split('@')[0] || 'Customer',
          gameName: 'Wallet Top-up',
          email: user?.email || 'customer@xavier.com'
        }
      });

      if (error) throw error;

      // The edge function returns qrCodeData, not qrCode
      if (data?.qrCodeData) {
        setGeneratedQR({
          qrCode: data.qrCodeData,
          wsUrl: data.wsUrl || ikhodePayment.websocketUrl || '',
          orderId: data.orderId || walletOrderId,
          amount: amount
        });
        toast({ title: 'QR Code generated', description: 'Scan to complete payment' });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Failed to generate QR code - no data returned');
      }
    } catch (error: any) {
      console.error('Topup error:', error);
      toast({ 
        title: 'Failed to generate payment', 
        description: error.message || 'Unknown error occurred', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async () => {
    // Reload wallet data
    await loadWalletData();
    setGeneratedQR(null);
    setTopupAmount('');
  };

  const handleCancelPayment = () => {
    setGeneratedQR(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Wallet - {settings.siteName}</title>
      </Helmet>

      <Header />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Wallet Balance Card */}
        <KhmerFrame className="mb-6">
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="w-8 h-8 text-gold" />
              <h1 className="font-display text-2xl gold-text">Xavier Wallet</h1>
            </div>
            <div className="text-4xl font-bold text-foreground mb-1">
              ${balance.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
          </div>
        </KhmerFrame>

        {/* Show QR Payment or Top-up Form */}
        {generatedQR ? (
          <Card className="border-gold/30 mb-6">
            <CardContent className="pt-6">
              <KHQRPaymentCard
                qrCode={generatedQR.qrCode}
                amount={generatedQR.amount}
                orderId={generatedQR.orderId}
                wsUrl={generatedQR.wsUrl}
                onComplete={handlePaymentComplete}
                onCancel={handleCancelPayment}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gold/30 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                Top-up Wallet
              </CardTitle>
              <CardDescription>Add funds via KHQR payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={topupAmount === amt.toString() ? 'default' : 'outline'}
                    className={topupAmount === amt.toString() ? 'bg-gold hover:bg-gold-dark text-primary-foreground' : 'border-gold/50'}
                    onClick={() => setTopupAmount(amt.toString())}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="pl-7 border-gold/50"
                    min="1"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handleTopup}
                  disabled={isProcessing || !topupAmount}
                  className="bg-gold hover:bg-gold-dark text-primary-foreground"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-5 h-5 text-gold" />
                Transaction History
              </span>
              <Button variant="ghost" size="sm" onClick={loadWalletData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'topup' ? 'bg-green-500/20' : 
                        tx.type === 'refund' ? 'bg-blue-500/20' : 'bg-red-500/20'
                      }`}>
                        {tx.type === 'topup' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        ) : tx.type === 'refund' ? (
                          <RefreshCw className="w-5 h-5 text-blue-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: ${tx.balance_after.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WalletPage;
