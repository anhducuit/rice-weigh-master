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
    bags50kg?: string | number;
    bags25kg?: string | number;
    looseBags?: { id: string; count: string | number; weight: string | number }[];
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

      {/* Packaging Section */}
      {(data.bags50kg || data.bags25kg || (data.looseBags && data.looseBags.some(b => b.count))) && (
        <div className="mb-4 pt-2 border-t border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Ghi chú bao bì:</h2>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              {data.bags50kg && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 italic">- Bao 50kg:</span>
                  <span className="font-bold text-gray-700">{data.bags50kg} bao</span>
                </div>
              )}
              {data.bags25kg && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 italic">- Bao 25kg:</span>
                  <span className="font-bold text-gray-700">{data.bags25kg} bao</span>
                </div>
              )}
              {data.looseBags?.map((bag, idx) => bag.count && (
                <div key={bag.id} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 italic">- Bao lẻ ({idx + 1}):</span>
                  <span className="font-bold text-gray-700">
                    {bag.count} bao ({bag.weight || 0} kg)
                  </span>
                </div>
              ))}
            </div>
            
            {/* Packaging Total Summary */}
            <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-50 border-dashed text-[11px]">
              <span className="text-gray-400 font-medium uppercase tracking-tighter">Tổng khối lượng bao bì:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {(() => {
                  const b50 = (parseFloat(data.bags50kg as string) || 0) * 50;
                  const b25 = (parseFloat(data.bags25kg as string) || 0) * 25;
                  const bLoose = data.looseBags?.reduce((acc, curr) => 
                    acc + (parseFloat(curr.count as string) || 0) * (parseFloat(curr.weight as string) || 0), 0) || 0;
                  const total = b50 + b25 + bLoose;
                  return `${total.toLocaleString()} kg (~ ${(total / 1000).toFixed(2)} tấn)`;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}



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
