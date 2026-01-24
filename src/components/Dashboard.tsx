import { useState, useMemo, useRef } from 'react';
import { Plus, Clock, Truck, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, TransactionSummary } from '@/types/transaction';
import { BottomNav } from './BottomNav';
import { TransactionDetailModal } from './TransactionDetailModal';
import { format, isSameDay } from 'date-fns';

interface DashboardProps {
  recentTransactions: Transaction[];
  onNewTransaction: () => void;
  loading?: boolean;
}

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const calculateTransactionAmount = (tx: Transaction) => {
  const totalWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);

  if (tx.riceBatches && tx.riceBatches.length > 0) {
    return tx.riceBatches.reduce((total, batch) => {
      const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
      const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
      return total + (batchWeight * batch.unitPrice);
    }, 0);
  }

  return totalWeight * tx.unitPrice;
};

const calculateTransactionSummary = (tx: Transaction): TransactionSummary => {
  const totalBags = tx.weights.length;
  const totalWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
  const totalAmount = calculateTransactionAmount(tx);

  const batchSummaries = tx.riceBatches?.map(batch => {
    const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
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
  }) || [];

  return { totalBags, totalWeight, totalAmount, batchSummaries };
};

export const Dashboard = ({ recentTransactions, onNewTransaction, loading }: DashboardProps) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    if (!selectedDate) {
      return recentTransactions;
    }

    return recentTransactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      const filterDate = new Date(selectedDate);
      return isSameDay(txDate, filterDate);
    });
  }, [recentTransactions, selectedDate]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Reset to page 1 when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const handleTransactionClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  const handleClearFilter = () => {
    setSelectedDate('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 pb-32 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-3xl font-bold text-foreground">RiceWeigh Pro</h1>
          <p className="text-muted-foreground mt-1">Quản lý cân gạo thông minh</p>
        </div>

        {/* Main CTA Button */}
        <Button
          variant="hero"
          onClick={onNewTransaction}
          className="w-full mb-8 gap-3 animate-bounce-soft"
        >
          <Plus className="w-7 h-7" />
          Tạo chuyến xe mới
        </Button>

        {/* Recent Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <h2 className="text-sm font-medium uppercase tracking-wide">
                Chuyến xe gần đây
              </h2>
              {filteredTransactions.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {filteredTransactions.length}
                </span>
              )}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border-2 border-border bg-card text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="gap-1"
              >
                <X className="w-4 h-4" />
                Xóa
              </Button>
            )}
          </div>

          {/* Transaction List */}
          {paginatedTransactions.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border">
              <Truck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {selectedDate ? 'Không có chuyến xe nào trong ngày này' : 'Chưa có chuyến xe nào'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {selectedDate ? 'Thử chọn ngày khác' : 'Nhấn nút phía trên để bắt đầu'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedTransactions.map((tx) => {
                const totalWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
                const totalAmount = calculateTransactionAmount(tx);
                const riceTypesDisplay = tx.riceBatches && tx.riceBatches.length > 0
                  ? tx.riceBatches.map(b => b.riceType).join(', ')
                  : tx.riceType;

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleTransactionClick(tx)}
                    className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 active:bg-secondary transition-colors cursor-pointer hover:border-primary/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground truncate">
                          {tx.licensePlate}
                        </p>
                        <span
                          className={`text-2xs px-2 py-0.5 rounded-full ${tx.status === 'completed'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                            }`}
                        >
                          {tx.status === 'completed' ? 'Xong' : 'Đang cân'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.customerName} • {riceTypesDisplay}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-foreground font-medium">
                          {tx.weights.length} bao
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-foreground font-medium">
                          {totalWeight.toFixed(1)} kg
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-success font-bold">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 z-10">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Button>
            <div className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        summary={selectedTransaction ? calculateTransactionSummary(selectedTransaction) : { totalBags: 0, totalWeight: 0, totalAmount: 0, batchSummaries: [] }}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
      />
    </>
  );
};
