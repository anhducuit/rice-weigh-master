import { useState, useRef } from 'react';
import { ArrowLeft, Check, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeightInput } from './WeightInput';
import { WeightGrid } from './WeightGrid';
import { StickyFooter } from './StickyFooter';
import { InvoicePreview } from './InvoicePreview';
import { Transaction, TransactionSummary } from '@/types/transaction';
import { toPng } from 'html-to-image';

interface WeighingScreenProps {
  transaction: Transaction;
  summary: TransactionSummary;
  onAddWeight: (weight: number, riceBatchId?: string) => void;
  onUpdateWeight: (id: string, value: number) => void;
  onDeleteWeight: (id: string) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export const WeighingScreen = ({
  transaction,
  summary,
  onAddWeight,
  onUpdateWeight,
  onDeleteWeight,
  onComplete,
  onCancel,
}: WeighingScreenProps) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    transaction.riceBatches[0]?.id || ''
  );
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleComplete = () => {
    setShowInvoice(true);
  };

  const handleAddWeight = (weight: number) => {
    // Pass the selected batch ID when adding weight
    onAddWeight(weight, selectedBatchId);
  };

  const handleShare = async () => {
    if (!invoiceRef.current) return;

    setIsSharing(true);
    try {
      const dataUrl = await toPng(invoiceRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
      });

      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `phieu-can-${transaction.licensePlate}.png`, {
        type: 'image/png',
      });

      // Use Web Share API
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Phiếu cân - ${transaction.licensePlate}`,
          text: `Phiếu cân gạo xe ${transaction.licensePlate}`,
        });
      } else {
        // Fallback: Download the image
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `phieu-can-${transaction.licensePlate}.png`;
        link.click();
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleConfirmComplete = () => {
    onComplete();
    setShowInvoice(false);
  };

  if (showInvoice) {
    return (
      <div className="min-h-screen p-4 pb-32 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowInvoice(false)}
            className="p-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Xem trước phiếu cân</h1>
          <div className="w-10" />
        </div>

        {/* Invoice */}
        <InvoicePreview
          ref={invoiceRef}
          transaction={transaction}
          summary={summary}
        />

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
          <Button
            variant="action"
            className="w-full gap-2"
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share2 className="w-5 h-5" />
            {isSharing ? 'Đang xử lý...' : 'Chia sẻ Zalo'}
          </Button>
          <Button
            variant="success"
            className="w-full gap-2"
            onClick={handleConfirmComplete}
          >
            <Check className="w-5 h-5" />
            Hoàn tất chuyến xe
          </Button>
        </div>
      </div>
    );
  }

  // Get display text for header
  const headerText = transaction.riceBatches.length > 0
    ? transaction.riceBatches.map(b => b.riceType).join(', ')
    : transaction.riceType;

  return (
    <div className="min-h-screen pb-40 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="font-bold text-lg">{transaction.licensePlate}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.customerName} • {headerText}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn hủy chuyến xe này? Dữ liệu sẽ bị mất.')) {
                  onCancel();
                }
              }}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Hủy
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleComplete}
              disabled={summary.totalBags === 0}
              className="gap-1"
            >
              <Check className="w-4 h-4" />
              Xong
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Batch Selector - Only show if multiple batches */}
        {transaction.riceBatches.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Đang cân lô gạo:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {transaction.riceBatches.map((batch) => {
                const batchSummary = summary.batchSummaries?.find(
                  (s) => s.batchId === batch.id
                );
                const isSelected = selectedBatchId === batch.id;

                return (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                      }`}
                  >
                    <p className="font-medium text-sm">{batch.riceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.unitPrice.toLocaleString('vi-VN')} đ/kg
                    </p>
                    {batchSummary && batchSummary.bags > 0 && (
                      <p className="text-xs text-primary mt-1">
                        {batchSummary.bags} bao • {batchSummary.weight.toFixed(1)} kg
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Weight Input */}
        <WeightInput onAddWeight={handleAddWeight} />

        {/* Weight Grid */}
        <WeightGrid
          weights={transaction.weights}
          riceBatches={transaction.riceBatches}
          onUpdate={onUpdateWeight}
          onDelete={onDeleteWeight}
        />
      </div>

      {/* Sticky Summary */}
      <StickyFooter summary={summary} />
    </div>
  );
};
