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
  onAddWeight: (weight: number) => void;
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
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleComplete = () => {
    setShowInvoice(true);
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
              {transaction.customerName} • {transaction.riceType}
            </p>
          </div>
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

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Weight Input */}
        <WeightInput onAddWeight={onAddWeight} />

        {/* Weight Grid */}
        <WeightGrid
          weights={transaction.weights}
          onUpdate={onUpdateWeight}
          onDelete={onDeleteWeight}
        />
      </div>

      {/* Sticky Summary */}
      <StickyFooter summary={summary} unitPrice={transaction.unitPrice} />
    </div>
  );
};
