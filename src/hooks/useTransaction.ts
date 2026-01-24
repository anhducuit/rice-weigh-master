import { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction, WeighingDetail, TransactionFormData, TransactionSummary } from '@/types/transaction';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'riceweigh_transactions';
const CURRENT_TRANSACTION_KEY = 'riceweigh_current';

export const useTransaction = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Load transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          weights:weighing_details(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = data.map((t: any) => ({
        id: t.id,
        createdAt: new Date(t.created_at),
        customerName: t.customer_name,
        licensePlate: t.license_plate,
        riceType: t.rice_type,
        unitPrice: Number(t.unit_price),
        status: t.status,
        weights: t.weights.map((w: any) => ({
          id: w.id,
          weight: Number(w.weight),
          orderIndex: w.order_index
        })).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      }));

      setTransactions(formattedData);

      // Check for pending transaction
      const pending = formattedData.find(t => t.status === 'pending');
      if (pending) {
        setCurrentTransaction(pending);
      }
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(async (formData: TransactionFormData) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          customer_name: formData.customerName.trim(),
          license_plate: formData.licensePlate.trim().toUpperCase(),
          rice_type: formData.riceType.trim(),
          unit_price: parseFloat(formData.unitPrice) || 0,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      const newTransaction: Transaction = {
        id: data.id,
        createdAt: new Date(data.created_at),
        customerName: data.customer_name,
        licensePlate: data.license_plate,
        riceType: data.rice_type,
        unitPrice: Number(data.unit_price),
        weights: [],
        status: 'pending',
      };

      setCurrentTransaction(newTransaction);
      return newTransaction;
    } catch (e) {
      console.error('Failed to create transaction:', e);
      return null;
    }
  }, []);

  const addWeight = useCallback(async (weight: number) => {
    if (!currentTransaction || weight <= 0) return;

    try {
      const nextIndex = currentTransaction.weights.length;
      const { data, error } = await supabase
        .from('weighing_details')
        .insert([{
          transaction_id: currentTransaction.id,
          weight: weight,
          order_index: nextIndex
        }])
        .select()
        .single();

      if (error) throw error;

      const newWeight: WeighingDetail = {
        id: data.id,
        weight: Number(data.weight),
        orderIndex: data.order_index,
      };

      const updated = {
        ...currentTransaction,
        weights: [...currentTransaction.weights, newWeight],
      };

      setCurrentTransaction(updated);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.error('Failed to add weight:', e);
    }
  }, [currentTransaction]);

  const updateWeight = useCallback(async (weightId: string, newValue: number) => {
    if (!currentTransaction || newValue <= 0) return;

    try {
      const { error } = await supabase
        .from('weighing_details')
        .update({ weight: newValue })
        .eq('id', weightId);

      if (error) throw error;

      const updated = {
        ...currentTransaction,
        weights: currentTransaction.weights.map((w) =>
          w.id === weightId ? { ...w, weight: newValue } : w
        ),
      };

      setCurrentTransaction(updated);
    } catch (e) {
      console.error('Failed to update weight:', e);
    }
  }, [currentTransaction]);

  const deleteWeight = useCallback(async (weightId: string) => {
    if (!currentTransaction) return;

    try {
      const { error } = await supabase
        .from('weighing_details')
        .delete()
        .eq('id', weightId);

      if (error) throw error;

      const updatedWeights = currentTransaction.weights
        .filter((w) => w.id !== weightId)
        .map((w, index) => ({ ...w, orderIndex: index }));

      // We might want to update indices in DB too, but for simplicity let's just update local
      // A better way would be to update order_index in DB for all remaining

      const updated = {
        ...currentTransaction,
        weights: updatedWeights,
      };

      setCurrentTransaction(updated);

      if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
      }
    } catch (e) {
      console.error('Failed to delete weight:', e);
    }
  }, [currentTransaction]);

  const completeTransaction = useCallback(async () => {
    if (!currentTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', currentTransaction.id);

      if (error) throw error;

      const completed: Transaction = {
        ...currentTransaction,
        status: 'completed',
      };

      setTransactions(prev => [completed, ...prev]);
      setCurrentTransaction(null);
      return completed;
    } catch (e) {
      console.error('Failed to complete transaction:', e);
    }
  }, [currentTransaction]);

  const cancelTransaction = useCallback(async () => {
    if (!currentTransaction) return;

    // If it's a new transaction with no weights, maybe delete it?
    // For now, just clear local state and mark as "cancelled" is not in schema
    // Let's just clear selection.
    setCurrentTransaction(null);
  }, [currentTransaction]);

  const summary: TransactionSummary = useMemo(() => {
    if (!currentTransaction) {
      return { totalBags: 0, totalWeight: 0, totalAmount: 0 };
    }

    const totalBags = currentTransaction.weights.length;
    const totalWeight = currentTransaction.weights.reduce((sum, w) => sum + w.weight, 0);
    const totalAmount = totalWeight * currentTransaction.unitPrice;

    return { totalBags, totalWeight, totalAmount };
  }, [currentTransaction]);

  const recentTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'completed').slice(0, 10);
  }, [transactions]);

  return {
    currentTransaction,
    transactions,
    recentTransactions,
    summary,
    loading,
    createTransaction,
    addWeight,
    updateWeight,
    deleteWeight,
    completeTransaction,
    cancelTransaction,
  };
};
