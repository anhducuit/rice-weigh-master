import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SimpleInvoicePreviewProps {
  data: {
    customerName: string;
    licensePlate: string;
    riceType: string;
    weightKg: number;
    weightTons: number;
    unitPrice: number;
    totalAmount: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const SimpleInvoicePreview = ({ data }: SimpleInvoicePreviewProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 w-full min-w-[360px]" id="invoice-preview">

      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">📜 HÓA ĐƠN RÚT GỌN</h1>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider">Xưởng Gạo Hà Toản</p>
      </div>

      {/* Basic Info */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Khách hàng:</span>
          <span className="text-sm font-semibold text-gray-800 uppercase">{data.customerName || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Biển số xe:</span>
          <span className="text-sm font-semibold text-gray-800 uppercase">{data.licensePlate || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Thời gian:</span>
          <span className="text-sm font-semibold text-gray-800">
            {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}
          </span>
        </div>
      </div>

      {/* Details Table-like Layout */}
      <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-4">
        <h2 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Chi tiết hàng hóa:</h2>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start border-b border-gray-200 pb-2">
            <span className="text-sm text-gray-600">Loại gạo:</span>
            <span className="text-sm font-bold text-gray-800 text-right">{data.riceType || 'Chưa chọn'}</span>
          </div>
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm text-gray-600">Trọng lượng:</span>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{data.weightKg.toLocaleString()} kg</div>
              <div className="text-xs text-gray-500">({data.weightTons.toFixed(2)} tấn)</div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Đơn giá:</span>
            <span className="text-sm font-bold text-gray-800">{formatCurrency(data.unitPrice)}</span>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="border-t-2 border-gray-800 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-700">TỔNG CỘNG:</span>
          <span className="text-xl font-black text-green-700">{formatCurrency(data.totalAmount)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-dashed border-gray-300 mt-6 pt-4 text-center">
        <p className="text-[10px] text-gray-400 italic">
          Hóa đơn được tạo tự động. Vui lòng kiểm tra kỹ trước khi nhận hàng.
        </p>
        <p className="text-xs font-medium text-gray-700 mt-2 italic">Cảm ơn quý khách đã tin tưởng!</p>
      </div>
    </div>
  );
};
