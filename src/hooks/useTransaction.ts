import { useState, useCallback, useMemo } from 'react';
import { Transaction, WeighingDetail, TransactionFormData, TransactionSummary } from '@/types/transaction';

const generateId = () => Math.random().toString(36).substring(2, 9);

const STORAGE_KEY = 'riceweigh_transactions';
const CURRENT_TRANSACTION_KEY = 'riceweigh_current';

const loadTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load transactions:', e);
  }
  return [];
};

const saveTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions:', e);
  }
};

const loadCurrentTransaction = (): Transaction | null => {
  try {
    const stored = localStorage.getItem(CURRENT_TRANSACTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
      };
    }
  } catch (e) {
    console.error('Failed to load current transaction:', e);
  }
  return null;
};

const saveCurrentTransaction = (transaction: Transaction | null) => {
  try {
    if (transaction) {
      localStorage.setItem(CURRENT_TRANSACTION_KEY, JSON.stringify(transaction));
    } else {
      localStorage.removeItem(CURRENT_TRANSACTION_KEY);
    }
  } catch (e) {
    console.error('Failed to save current transaction:', e);
  }
};

export const useTransaction = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(loadCurrentTransaction);

  const createTransaction = useCallback((formData: TransactionFormData) => {
    const newTransaction: Transaction = {
      id: generateId(),
      createdAt: new Date(),
      customerName: formData.customerName.trim(),
      licensePlate: formData.licensePlate.trim().toUpperCase(),
      riceType: formData.riceType.trim(),
      unitPrice: parseFloat(formData.unitPrice) || 0,
      weights: [],
      status: 'pending',
    };
    setCurrentTransaction(newTransaction);
    saveCurrentTransaction(newTransaction);
    return newTransaction;
  }, []);

  const addWeight = useCallback((weight: number) => {
    if (!currentTransaction || weight <= 0) return;

    const newWeight: WeighingDetail = {
      id: generateId(),
      weight,
      orderIndex: currentTransaction.weights.length,
    };

    const updated = {
      ...currentTransaction,
      weights: [...currentTransaction.weights, newWeight],
    };

    setCurrentTransaction(updated);
    saveCurrentTransaction(updated);

    // Trigger vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [currentTransaction]);

  const updateWeight = useCallback((weightId: string, newValue: number) => {
    if (!currentTransaction || newValue <= 0) return;

    const updated = {
      ...currentTransaction,
      weights: currentTransaction.weights.map((w) =>
        w.id === weightId ? { ...w, weight: newValue } : w
      ),
    };

    setCurrentTransaction(updated);
    saveCurrentTransaction(updated);
  }, [currentTransaction]);

  const deleteWeight = useCallback((weightId: string) => {
    if (!currentTransaction) return;

    const updated = {
      ...currentTransaction,
      weights: currentTransaction.weights
        .filter((w) => w.id !== weightId)
        .map((w, index) => ({ ...w, orderIndex: index })),
    };

    setCurrentTransaction(updated);
    saveCurrentTransaction(updated);

    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 30]);
    }
  }, [currentTransaction]);

  const completeTransaction = useCallback(() => {
    if (!currentTransaction) return;

    const completed: Transaction = {
      ...currentTransaction,
      status: 'completed',
    };

    const updatedList = [completed, ...transactions];
    setTransactions(updatedList);
    saveTransactions(updatedList);

    setCurrentTransaction(null);
    saveCurrentTransaction(null);

    return completed;
  }, [currentTransaction, transactions]);

  const cancelTransaction = useCallback(() => {
    setCurrentTransaction(null);
    saveCurrentTransaction(null);
  }, []);

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
    return transactions.slice(0, 10);
  }, [transactions]);

  return {
    currentTransaction,
    transactions,
    recentTransactions,
    summary,
    createTransaction,
    addWeight,
    updateWeight,
    deleteWeight,
    completeTransaction,
    cancelTransaction,
  };
};
