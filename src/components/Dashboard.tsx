import { Plus, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/transaction';
import { BottomNav } from './BottomNav';

interface DashboardProps {
  recentTransactions: Transaction[];
  onNewTransaction: () => void;
  loading?: boolean;
}

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

export const Dashboard = ({ recentTransactions, onNewTransaction, loading }: DashboardProps) => {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 animate-fade-in">
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <h2 className="text-sm font-medium uppercase tracking-wide">
            Chuyến xe gần đây
          </h2>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <Truck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Chưa có chuyến xe nào</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Nhấn nút phía trên để bắt đầu
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const totalWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);

              // Calculate total amount based on batches
              let totalAmount = 0;
              if (tx.riceBatches && tx.riceBatches.length > 0) {
                // Multi-batch: calculate per batch
                tx.riceBatches.forEach(batch => {
                  const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                  const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                  totalAmount += batchWeight * batch.unitPrice;
                });
              } else {
                // Legacy: single price
                totalAmount = totalWeight * tx.unitPrice;
              }

              // Display rice types
              const riceTypesDisplay = tx.riceBatches && tx.riceBatches.length > 0
                ? tx.riceBatches.map(b => b.riceType).join(', ')
                : tx.riceType;

              return (
                <div
                  key={tx.id}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 active:bg-secondary transition-colors"
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
      <BottomNav />
    </div>
  );
};
