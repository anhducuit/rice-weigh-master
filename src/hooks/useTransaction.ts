import { useState, useCallback, useMemo, useEffect } from 'react';
import { Transaction, WeighingDetail, TransactionFormData, TransactionSummary, RiceBatch, BatchSummary } from '@/types/transaction';
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
          weights:weighing_details(*),
          riceBatches:rice_batches(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = data.map((t: any) => ({
        id: t.id,
        createdAt: new Date(t.created_at),
        customerName: t.customer_name,
        licensePlate: t.license_plate,
        riceType: t.rice_type || '', // Deprecated field
        unitPrice: Number(t.unit_price) || 0, // Deprecated field
        riceBatches: (t.riceBatches || []).map((b: any) => ({
          id: b.id,
          riceType: b.rice_type,
          unitPrice: Number(b.unit_price),
          batchOrder: b.batch_order
        })).sort((a: any, b: any) => a.batchOrder - b.batchOrder),
        status: t.status,
        paymentStatus: t.payment_status || 'unpaid',
        paymentDate: t.payment_date ? new Date(t.payment_date) : null,
        weights: (t.weights || []).map((w: any) => ({
          id: w.id,
          weight: Number(w.weight),
          orderIndex: w.order_index,
          riceBatchId: w.rice_batch_id
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

  const createTransaction = useCallback(async (formData: TransactionFormData & { riceBatches: Array<{ rice_type: string; unit_price: number }> }) => {
    try {
      console.log('Creating transaction with data:', formData);

      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          customer_name: formData.customerName.trim(),
          license_plate: formData.licensePlate.trim().toUpperCase(),
          status: 'pending'
        }])
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }

      console.log('Transaction created:', transactionData);

      // Create rice batches
      const batchInserts = formData.riceBatches.map((batch, index) => ({
        transaction_id: transactionData.id,
        rice_type: batch.rice_type,
        unit_price: batch.unit_price,
        batch_order: index
      }));

      console.log('Creating rice batches:', batchInserts);

      const { data: batchesData, error: batchesError } = await supabase
        .from('rice_batches')
        .insert(batchInserts)
        .select();

      if (batchesError) {
        console.error('Rice batches creation error:', batchesError);
        throw batchesError;
      }

      console.log('Rice batches created:', batchesData);

      const newTransaction: Transaction = {
        id: transactionData.id,
        createdAt: new Date(transactionData.created_at),
        customerName: transactionData.customer_name,
        licensePlate: transactionData.license_plate,
        riceType: '', // Deprecated
        unitPrice: 0, // Deprecated
        riceBatches: batchesData.map((b: any) => ({
          id: b.id,
          riceType: b.rice_type,
          unitPrice: Number(b.unit_price),
          batchOrder: b.batch_order
        })).sort((a, b) => a.batchOrder - b.batchOrder),
        weights: [],
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentDate: null,
      };

      setCurrentTransaction(newTransaction);
      console.log('Transaction set successfully:', newTransaction);
      return newTransaction;
    } catch (e) {
      console.error('Failed to create transaction:', e);
      return null;
    }
  }, []);

  const addWeight = useCallback(async (weight: number, riceBatchId?: string) => {
    if (!currentTransaction || weight <= 0) return;

    try {
      const nextIndex = currentTransaction.weights.length;
      const { data, error } = await supabase
        .from('weighing_details')
        .insert([{
          transaction_id: currentTransaction.id,
          weight: weight,
          order_index: nextIndex,
          rice_batch_id: riceBatchId || null
        }])
        .select()
        .single();

      if (error) throw error;

      const newWeight: WeighingDetail = {
        id: data.id,
        weight: Number(data.weight),
        orderIndex: data.order_index,
        riceBatchId: data.rice_batch_id,
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

    try {
      console.log('Canceling transaction:', currentTransaction.id);

      // Delete weighing details first (foreign key constraint)
      if (currentTransaction.weights.length > 0) {
        const { error: weightsError } = await supabase
          .from('weighing_details')
          .delete()
          .eq('transaction_id', currentTransaction.id);

        if (weightsError) {
          console.error('Failed to delete weighing details:', weightsError);
        }
      }

      // Delete rice batches
      if (currentTransaction.riceBatches.length > 0) {
        const { error: batchesError } = await supabase
          .from('rice_batches')
          .delete()
          .eq('transaction_id', currentTransaction.id);

        if (batchesError) {
          console.error('Failed to delete rice batches:', batchesError);
        }
      }

      // Delete the transaction itself
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', currentTransaction.id);

      if (transactionError) {
        console.error('Failed to delete transaction:', transactionError);
        throw transactionError;
      }

      console.log('Transaction deleted successfully');
      setCurrentTransaction(null);

      // Refresh transactions list
      await fetchTransactions();
    } catch (e) {
      console.error('Failed to cancel transaction:', e);
      // Still clear local state even if delete fails
      setCurrentTransaction(null);
    }
  }, [currentTransaction, fetchTransactions]);

  // Delete any transaction by ID (for completed transactions)
  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      // Delete weighing details
      const { error: weightsError } = await supabase
        .from('weighing_details')
        .delete()
        .eq('transaction_id', transactionId);

      if (weightsError) {
        console.error('Failed to delete weighing details:', weightsError);
      }

      // Delete rice batches
      const { error: batchesError } = await supabase
        .from('rice_batches')
        .delete()
        .eq('transaction_id', transactionId);

      if (batchesError) {
        console.error('Failed to delete rice batches:', batchesError);
      }

      // Delete the transaction itself
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (transactionError) {
        throw transactionError;
      }

      // Refresh transactions list
      await fetchTransactions();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      throw e;
    }
  }, [fetchTransactions]);

  const summary: TransactionSummary = useMemo(() => {
    if (!currentTransaction) {
      return { totalBags: 0, totalWeight: 0, totalAmount: 0, batchSummaries: [] };
    }

    // Calculate summary per batch
    const batchSummaries: BatchSummary[] = currentTransaction.riceBatches.map(batch => {
      const batchWeights = currentTransaction.weights.filter(w => w.riceBatchId === batch.id);
      const bags = batchWeights.length;
      const weight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
      const amount = weight * batch.unitPrice;

      return {
        batchId: batch.id,
        riceType: batch.riceType,
        unitPrice: batch.unitPrice,
        bags,
        weight,
        amount
      };
    });

    // Calculate totals
    const totalBags = currentTransaction.weights.length;
    const totalWeight = currentTransaction.weights.reduce((sum, w) => sum + w.weight, 0);
    const totalAmount = batchSummaries.reduce((sum, b) => sum + b.amount, 0);

    return { totalBags, totalWeight, totalAmount, batchSummaries };
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
    deleteTransaction,
    refreshTransactions: fetchTransactions,
  };
};
