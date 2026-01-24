import { forwardRef } from 'react';
import { Transaction, TransactionSummary } from '@/types/transaction';

interface InvoicePreviewProps {
  transaction: Transaction;
  summary: TransactionSummary;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ transaction, summary }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white p-6 rounded-2xl shadow-lg max-w-md mx-auto"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">🌾 PHIẾU CÂN GẠO</h1>
          <p className="text-sm text-gray-500 mt-1">RiceWeigh Pro</p>
        </div>

        {/* Info */}
        <div className="space-y-2 text-gray-700 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày:</span>
            <span className="font-medium">{formatDate(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Biển số:</span>
            <span className="font-bold text-lg">{transaction.licensePlate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Khách hàng:</span>
            <span className="font-medium">{transaction.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Loại gạo:</span>
            <span className="font-medium">{transaction.riceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Đơn giá:</span>
            <span className="font-medium">
              {formatCurrency(transaction.unitPrice)}/kg
            </span>
          </div>
        </div>

        {/* Weight Grid */}
        <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Chi tiết ({summary.totalBags} bao):
          </p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {transaction.weights.map((w, i) => (
              <div
                key={w.id}
                className="bg-gray-100 rounded p-1 text-sm font-medium"
              >
                {w.weight}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t-2 border-gray-300 pt-4 space-y-2">
          <div className="flex justify-between text-lg">
            <span>Tổng bao:</span>
            <span className="font-bold">{summary.totalBags} bao</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Tổng cân:</span>
            <span className="font-bold">{summary.totalWeight.toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-green-700 pt-2 border-t">
            <span>THÀNH TIỀN:</span>
            <span>{formatCurrency(summary.totalAmount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-400">
            Cảm ơn quý khách! 🙏
          </p>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
