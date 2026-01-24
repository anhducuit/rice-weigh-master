import { useRef, useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, TransactionSummary } from '@/types/transaction';
import { InvoicePreview } from './InvoicePreview';
import { toPng } from 'html-to-image';

interface TransactionDetailModalProps {
    transaction: Transaction | null;
    summary: TransactionSummary;
    isOpen: boolean;
    onClose: () => void;
}

export const TransactionDetailModal = ({
    transaction,
    summary,
    isOpen,
    onClose,
}: TransactionDetailModalProps) => {
    const [isSharing, setIsSharing] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !transaction) return null;

    const handleShare = async () => {
        if (!invoiceRef.current) return;

        setIsSharing(true);
        try {
            // Generate image with optimized quality for sharing
            const dataUrl = await toPng(invoiceRef.current, {
                quality: 0.8,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
            });

            // Convert to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Check file size
            if (blob.size > 5 * 1024 * 1024) {
                console.warn('Image size is large:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
            }

            const fileName = `phieu-can-${transaction.licensePlate}-${Date.now()}.png`;
            const file = new File([blob], fileName, {
                type: 'image/png',
            });

            // Try Web Share API first (works on mobile)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Phiếu cân - ${transaction.licensePlate}`,
                        text: `Phiếu cân gạo xe ${transaction.licensePlate}\nTổng: ${summary.totalBags} bao - ${summary.totalWeight.toFixed(1)} kg`,
                    });
                    console.log('Share successful');
                } catch (shareError: any) {
                    if (shareError.name === 'AbortError') {
                        console.log('Share cancelled by user');
                    } else {
                        console.error('Share error:', shareError);
                        downloadImage(dataUrl, fileName);
                    }
                }
            } else {
                // Browser doesn't support Web Share API - download instead
                console.log('Web Share API not supported, downloading instead');
                downloadImage(dataUrl, fileName);
            }
        } catch (error) {
            console.error('Failed to generate image:', error);
            alert('Không thể tạo ảnh. Vui lòng thử lại.');
        } finally {
            setIsSharing(false);
        }
    };

    const downloadImage = (dataUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Image downloaded:', fileName);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-background rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Chi tiết chuyến xe</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Invoice Preview */}
                <div className="p-4">
                    <InvoicePreview
                        ref={invoiceRef}
                        transaction={transaction}
                        summary={summary}
                    />
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border p-4 space-y-2">
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
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                    >
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
};
