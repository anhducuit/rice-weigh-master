import { Package, Scale, Banknote } from 'lucide-react';
import { TransactionSummary } from '@/types/transaction';

interface StickyFooterProps {
  summary: TransactionSummary;
  unitPrice: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const StickyFooter = ({ summary, unitPrice }: StickyFooterProps) => {
  return (
    <div className="sticky-summary safe-area-pb">
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
