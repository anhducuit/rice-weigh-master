import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Transaction } from '@/types/transaction';

interface PaymentInvoiceProps {
    customerName: string;
    transactions: Transaction[];
}

interface RiceTypeSummary {
    riceType: string;
    bags: number;
    weight: number;
    amount: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const PaymentInvoice = ({ customerName, transactions }: PaymentInvoiceProps) => {
    // Calculate summary
    const riceTypeSummaryMap = new Map<string, RiceTypeSummary>();
    let totalBags = 0;
    let totalWeight = 0;
    let totalAmount = 0;

    transactions.forEach(tx => {
        totalBags += tx.weights.length;
        const txWeight = tx.weights.reduce((sum, w) => sum + w.weight, 0);
        totalWeight += txWeight;

        if (tx.riceBatches && tx.riceBatches.length > 0) {
            tx.riceBatches.forEach(batch => {
                const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                const batchAmount = batchWeight * batch.unitPrice;

                if (!riceTypeSummaryMap.has(batch.riceType)) {
                    riceTypeSummaryMap.set(batch.riceType, {
                        riceType: batch.riceType,
                        bags: 0,
                        weight: 0,
                        amount: 0
                    });
                }
                const summary = riceTypeSummaryMap.get(batch.riceType)!;
                summary.bags += batchWeights.length;
                summary.weight += batchWeight;
                summary.amount += batchAmount;
                totalAmount += batchAmount;
            });
        } else {
            const txAmount = txWeight * tx.unitPrice;
            if (!riceTypeSummaryMap.has(tx.riceType)) {
                riceTypeSummaryMap.set(tx.riceType, {
                    riceType: tx.riceType,
                    bags: 0,
                    weight: 0,
                    amount: 0
                });
            }
            const summary = riceTypeSummaryMap.get(tx.riceType)!;
            summary.bags += tx.weights.length;
            summary.weight += txWeight;
            summary.amount += txAmount;
            totalAmount += txAmount;
        }
    });

    const riceTypeSummaries = Array.from(riceTypeSummaryMap.values());

    // Get date range
    const dates = transactions.map(tx => new Date(tx.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const fromDate = dates[0];
    const toDate = dates[dates.length - 1];

    return (
        <div className="bg-white p-6 rounded-lg" id="payment-invoice">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800">💰 HÓA ĐƠN THU TIỀN</h1>
                <p className="text-sm text-gray-500 mt-1">Xưởng Gạo Hà Toản</p>
            </div>

            {/* Customer Info */}
            <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Khách hàng:</span>
                    <span className="text-sm font-semibold text-gray-800">{customerName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Thời gian:</span>
                    <span className="text-sm font-semibold text-gray-800">
                        {format(fromDate, 'dd/MM/yyyy', { locale: vi })}
                        {fromDate.getTime() !== toDate.getTime() && ` - ${format(toDate, 'dd/MM/yyyy', { locale: vi })}`}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Số chuyến xe:</span>
                    <span className="text-sm font-semibold text-gray-800">{transactions.length}</span>
                </div>
            </div>

            {/* Rice Type Details */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase">Chi tiết:</h2>
                <div className="space-y-3">
                    {riceTypeSummaries.map((summary) => (
                        <div key={summary.riceType} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-semibold text-gray-800 mb-1">{summary.riceType}</div>
                            <div className="text-sm text-gray-600 space-y-0.5">
                                <div className="flex justify-between">
                                    <span>Số bao:</span>
                                    <span className="font-medium">{summary.bags} bao</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Trọng lượng:</span>
                                    <span className="font-medium">{summary.weight.toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Thành tiền:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(summary.amount)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-800 pt-4 space-y-2">
                <h2 className="text-sm font-bold text-gray-700 mb-2 uppercase">Tổng cộng:</h2>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng số bao:</span>
                    <span className="font-bold text-gray-800">{totalBags} bao</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng trọng lượng:</span>
                    <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between text-lg mt-3 pt-3 border-t border-gray-300">
                    <span className="font-bold text-gray-700">TỔNG TIỀN:</span>
                    <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-gray-300 mt-6 pt-4 text-center">
                <p className="text-xs text-gray-500">
                    Ngày in: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
                <p className="text-xs text-gray-400 mt-1">Cảm ơn quý khách!</p>
            </div>
        </div>
    );
};
