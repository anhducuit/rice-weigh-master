import { useState } from 'react';
import { useTransaction } from '@/hooks/useTransaction';
import { Dashboard } from '@/components/Dashboard';
import { TransactionForm } from '@/components/TransactionForm';
import { WeighingScreen } from '@/components/WeighingScreen';

type Screen = 'dashboard' | 'form' | 'weighing';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const {
    currentTransaction,
    recentTransactions,
    summary,
    createTransaction,
    addWeight,
    updateWeight,
    deleteWeight,
    completeTransaction,
    cancelTransaction,
    loading,
  } = useTransaction();

  const handleNewTransaction = () => {
    setScreen('form');
  };

  const handleFormSubmit = async (data: Parameters<typeof createTransaction>[0]) => {
    const result = await createTransaction(data);
    if (result) {
      setScreen('weighing');
    } else {
      // Show error toast or alert
      alert('Không thể tạo chuyến xe. Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  const handleFormCancel = () => {
    setScreen('dashboard');
  };

  const handleComplete = () => {
    completeTransaction();
    setScreen('dashboard');
  };

  const handleCancelWeighing = () => {
    if (currentTransaction && currentTransaction.weights.length > 0) {
      const confirm = window.confirm('Bạn có chắc muốn hủy? Dữ liệu sẽ bị mất.');
      if (!confirm) return;
    }
    cancelTransaction();
    setScreen('dashboard');
  };

  // If there's a pending transaction, show weighing screen
  if (currentTransaction && screen !== 'form') {
    return (
      <WeighingScreen
        transaction={currentTransaction}
        summary={summary}
        onAddWeight={addWeight}
        onUpdateWeight={updateWeight}
        onDeleteWeight={deleteWeight}
        onComplete={handleComplete}
        onCancel={handleCancelWeighing}
      />
    );
  }

  if (screen === 'form') {
    return (
      <div className="min-h-screen p-4">
        <TransactionForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
      </div>
    );
  }

  return (
    <Dashboard
      recentTransactions={recentTransactions}
      onNewTransaction={handleNewTransaction}
      loading={loading}
    />
  );
};

export default Index;
