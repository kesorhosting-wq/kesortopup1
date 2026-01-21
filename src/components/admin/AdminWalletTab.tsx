import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, Minus, RefreshCw, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  wallet_balance: number;
}

export const AdminWalletTab: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('admin-wallet', {
        body: { action: 'list-users' }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email?.toLowerCase().includes(query) ||
            u.display_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-wallet', {
        body: {
          action: actionType === 'add' ? 'add-balance' : 'deduct-balance',
          targetUserId: selectedUserId,
          amount: numAmount,
          description: description.trim() || undefined
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const user = response.data.user;
      toast.success(
        `Successfully ${actionType === 'add' ? 'added' : 'deducted'} $${numAmount.toFixed(2)} ${actionType === 'add' ? 'to' : 'from'} ${user.display_name || user.email}'s wallet. New balance: $${response.data.newBalance.toFixed(2)}`
      );

      // Reset form
      setAmount('');
      setDescription('');
      setSelectedUserId('');

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Wallet action failed:', error);
      toast.error(error.message || 'Failed to update wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Admin Wallet Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Search and Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Select User</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                disabled={isLoadingUsers}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{user.display_name || user.email || 'Unknown'}</span>
                      <span className="text-muted-foreground text-xs">
                        (${user.wallet_balance?.toFixed(2) || '0.00'})
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                )}
              </SelectContent>
            </Select>

            {selectedUser && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedUser.display_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-xl font-bold text-gold">
                        ${selectedUser.wallet_balance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <Label>Action Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={actionType === 'add' ? 'default' : 'outline'}
                onClick={() => setActionType('add')}
                className={actionType === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Balance
              </Button>
              <Button
                type="button"
                variant={actionType === 'deduct' ? 'default' : 'outline'}
                onClick={() => setActionType('deduct')}
                className={actionType === 'deduct' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <Minus className="w-4 h-4 mr-2" />
                Deduct Balance
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Promotional credit, Refund, Manual adjustment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedUserId || !amount}
            className={`w-full ${
              actionType === 'add' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : actionType === 'add' ? (
              <Plus className="w-4 h-4 mr-2" />
            ) : (
              <Minus className="w-4 h-4 mr-2" />
            )}
            {isLoading
              ? 'Processing...'
              : actionType === 'add'
              ? `Add $${parseFloat(amount) || 0} to Wallet`
              : `Deduct $${parseFloat(amount) || 0} from Wallet`}
          </Button>
        </CardContent>
      </Card>

      {/* Users Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Users Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedUserId(user.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {user.display_name || 'No name'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gold">
                      ${user.wallet_balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
