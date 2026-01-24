import { useState, useMemo, useRef } from 'react';
import { Banknote, Check, Share2, Eye, CheckCircle2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useCustomers } from '@/hooks/useCustomers';
import { useTransaction } from '@/hooks/useTransaction';
import { PaymentInvoice } from '@/components/PaymentInvoice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/types/transaction';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

const PaymentCollection = () => {
    const { customers } = useCustomers();
    const { transactions, loading, refreshTransactions } = useTransaction();
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
    const [showInvoice, setShowInvoice] = useState(false);
    const [viewInvoiceTransaction, setViewInvoiceTransaction] = useState<Transaction | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

    // Get active customers
    const activeCustomers = customers.filter(c => c.is_active);

    // Get ALL completed transactions for selected customer (both paid and unpaid)
    const customerTransactions = useMemo(() => {
        if (!selectedCustomer) return [];
        return transactions.filter(
            tx => tx.customerName === selectedCustomer && tx.status === 'completed'
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [transactions, selectedCustomer]);

    // Separate paid and unpaid transactions
    const unpaidTransactions = useMemo(() => {
        return customerTransactions.filter(tx => tx.paymentStatus === 'unpaid');
    }, [customerTransactions]);

    const paidTransactions = useMemo(() => {
        return customerTransactions.filter(tx => tx.paymentStatus === 'paid');
    }, [customerTransactions]);

    // Get selected transactions
    const selectedTransactions = useMemo(() => {
        return customerTransactions.filter(tx => selectedTransactionIds.has(tx.id));
    }, [customerTransactions, selectedTransactionIds]);

    // Calculate total for selected
    const totalAmount = useMemo(() => {
        let total = 0;
        selectedTransactions.forEach(tx => {
            const txWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
            if (tx.riceBatches && tx.riceBatches.length > 0) {
                tx.riceBatches.forEach(batch => {
                    const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                    const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                    total += batchWeight * batch.unitPrice;
                });
            } else {
                total += txWeight * tx.unitPrice;
            }
        });
        return total;
    }, [selectedTransactions]);

    // Calculate summary for paid and unpaid transactions
    const transactionSummary = useMemo(() => {
        let unpaidAmount = 0;
        let paidAmount = 0;

        customerTransactions.forEach(tx => {
            const txWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
            let txAmount = 0;

            if (tx.riceBatches && tx.riceBatches.length > 0) {
                tx.riceBatches.forEach(batch => {
                    const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                    const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                    txAmount += batchWeight * batch.unitPrice;
                });
            } else {
                txAmount = txWeight * tx.unitPrice;
            }

            if (tx.paymentStatus === 'paid') {
                paidAmount += txAmount;
            } else {
                unpaidAmount += txAmount;
            }
        });

        return { unpaidAmount, paidAmount };
    }, [customerTransactions]);

    const handleTransactionToggle = (transactionId: string, isPaid: boolean) => {
        // Don't allow selecting paid transactions
        if (isPaid) return;

        const newSet = new Set(selectedTransactionIds);
        if (newSet.has(transactionId)) {
            newSet.delete(transactionId);
        } else {
            newSet.add(transactionId);
        }
        setSelectedTransactionIds(newSet);
    };

    const handleSelectAll = () => {
        // Only select unpaid transactions
        if (selectedTransactionIds.size === unpaidTransactions.length) {
            setSelectedTransactionIds(new Set());
        } else {
            setSelectedTransactionIds(new Set(unpaidTransactions.map(tx => tx.id)));
        }
    };

    const handleCreateInvoice = () => {
        if (selectedTransactionIds.size === 0) {
            alert('Vui lòng chọn ít nhất một chuyến xe');
            return;
        }
        setShowInvoice(true);
        setViewInvoiceTransaction(null);
    };

    const handleViewInvoice = (tx: Transaction) => {
        setViewInvoiceTransaction(tx);
        setShowInvoice(true);
    };

    const handleShare = async () => {
        if (!invoiceRef.current) return;

        setIsSharing(true);
        try {
            const dataUrl = await toPng(invoiceRef.current, {
                quality: 0.8,
                pixelRatio: 2,
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File(
                [blob],
                `hoa-don-${selectedCustomer}-${Date.now()}.png`,
                { type: 'image/png' }
            );

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Hóa đơn thu tiền',
                    text: `Hóa đơn thu tiền - ${selectedCustomer}\nTổng: ${formatCurrency(totalAmount)}`,
                });
            } else {
                // Fallback: download
                const link = document.createElement('a');
                link.download = file.name;
                link.href = dataUrl;
                link.click();
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Share error:', error);
                alert('Không thể chia sẻ. Vui lòng thử lại.');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (selectedTransactionIds.size === 0) return;

        setIsMarkingPaid(true);
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    payment_status: 'paid',
                    payment_date: new Date().toISOString(),
                })
                .in('id', Array.from(selectedTransactionIds));

            if (error) throw error;

            alert(`Đã đánh dấu ${selectedTransactionIds.size} chuyến xe là đã thanh toán!`);
            setSelectedTransactionIds(new Set());
            setShowInvoice(false);
            await refreshTransactions();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const getRiceTypeSummary = (tx: Transaction) => {
        if (tx.riceBatches && tx.riceBatches.length > 0) {
            return tx.riceBatches.map(b => b.riceType).join(', ');
        }
        return tx.riceType;
    };

    const getTransactionAmount = (tx: Transaction) => {
        const txWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
        if (tx.riceBatches && tx.riceBatches.length > 0) {
            let total = 0;
            tx.riceBatches.forEach(batch => {
                const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                total += batchWeight * batch.unitPrice;
            });
            return total;
        }
        return txWeight * tx.unitPrice;
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                        <Banknote className="h-5 w-5 text-success" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Thu tiền</h1>
                </div>

                {/* Customer Selection */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Chọn mối hàng:
                    </label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                            <SelectValue placeholder="-- Chọn mối hàng --" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeCustomers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.name}>
                                    {customer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Transaction List */}
                {selectedCustomer && (
                    <>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : customerTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Không có chuyến xe nào</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            Danh sách chuyến xe ({customerTransactions.length})
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSelectAll}
                                        >
                                            {selectedTransactionIds.size === unpaidTransactions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </Button>
                                    </div>

                                    {/* Summary Statistics */}
                                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div>
                                                <p className="text-2xs text-muted-foreground mb-0.5">Chưa thanh toán</p>
                                                <p className="text-sm font-bold text-destructive">{formatCurrency(transactionSummary.unpaidAmount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-2xs text-muted-foreground mb-0.5">Đã thanh toán</p>
                                                <p className="text-sm font-bold text-success">{formatCurrency(transactionSummary.paidAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {customerTransactions.map((tx) => {
                                        const isPaid = tx.paymentStatus === 'paid';
                                        return (
                                            <div
                                                key={tx.id}
                                                className={`bg-card rounded-lg p-4 border ${selectedTransactionIds.has(tx.id) ? 'border-primary bg-primary/5' : 'border-border'
                                                    } ${isPaid ? 'opacity-75' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {!isPaid && (
                                                        <Checkbox
                                                            checked={selectedTransactionIds.has(tx.id)}
                                                            onCheckedChange={() => handleTransactionToggle(tx.id, isPaid)}
                                                            className="mt-1"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-foreground">
                                                                    {tx.licensePlate}
                                                                </span>
                                                                {isPaid && (
                                                                    <span className="inline-flex items-center gap-1 text-2xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Đã thanh toán
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(tx.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                            <p>🌾 {getRiceTypeSummary(tx)}</p>
                                                            <p>📦 {tx.weights.length} bao • {tx.weights.reduce((sum, w) => sum + w.weight, 0).toFixed(0)} kg</p>
                                                            <p className="font-semibold text-success">
                                                                💰 {formatCurrency(getTransactionAmount(tx))}
                                                            </p>
                                                        </div>
                                                        {isPaid && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2 w-full"
                                                                onClick={() => handleViewInvoice(tx)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Xem bill
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary for selected */}
                                {selectedTransactionIds.size > 0 && (
                                    <div className="bg-card rounded-lg p-4 border border-primary mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                Đã chọn {selectedTransactionIds.size} chuyến xe
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">Tổng cộng:</span>
                                            <span className="text-xl font-bold text-success">
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                        <Button
                                            className="w-full mt-4"
                                            onClick={handleCreateInvoice}
                                        >
                                            Tạo hóa đơn
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Invoice Modal */}
                {showInvoice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4">
                                <div ref={invoiceRef}>
                                    <PaymentInvoice
                                        customerName={selectedCustomer}
                                        transactions={viewInvoiceTransaction ? [viewInvoiceTransaction] : selectedTransactions}
                                    />
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowInvoice(false);
                                            setViewInvoiceTransaction(null);
                                        }}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleShare}
                                        disabled={isSharing}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ'}
                                    </Button>
                                    {!viewInvoiceTransaction && (
                                        <Button
                                            className="flex-1"
                                            onClick={handleMarkAsPaid}
                                            disabled={isMarkingPaid}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            {isMarkingPaid ? 'Đang lưu...' : 'Đã thanh toán'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default PaymentCollection;
