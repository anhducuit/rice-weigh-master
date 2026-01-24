import { Package, Scale, Banknote } from 'lucide-react';
import { TransactionSummary } from '@/types/transaction';

interface StickyFooterProps {
  summary: TransactionSummary;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const StickyFooter = ({ summary }: StickyFooterProps) => {
  const hasBatchSummaries = summary.batchSummaries && summary.batchSummaries.length > 1;

  return (
    <div className="sticky-summary safe-area-pb">
      {/* Batch Summaries - Show if multiple batches */}
      {hasBatchSummaries && (
        <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
          {summary.batchSummaries!.map((batch) => (
            <div
              key={batch.batchId}
              className="bg-card border border-border rounded-lg p-2 grid grid-cols-4 gap-2 text-xs"
            >
              <div className="col-span-2">
                <p className="font-medium truncate text-foreground">{batch.riceType}</p>
                <p className="text-muted-foreground">
                  {batch.unitPrice.toLocaleString('vi-VN')} đ/kg
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Bao</p>
                <p className="font-bold text-foreground">{batch.bags}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Tiền</p>
                <p className="font-bold text-foreground">{(batch.amount / 1000).toFixed(0)}k</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-sticky-bar-text/70">
            <Package className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Tổng bao</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalBags}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-sticky-bar-text/70">
            <Scale className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Tổng Kg</span>
          </div>
          <p className="text-2xl font-bold">{summary.totalWeight.toFixed(1)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-sticky-bar-text/70">
            <Banknote className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Thành tiền</span>
          </div>
          <p className="text-xl font-bold leading-tight">
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
};
