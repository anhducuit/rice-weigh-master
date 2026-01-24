import { useState, useEffect } from 'react';
import { Truck, User, Wheat, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionFormData } from '@/types/transaction';
import { useCustomers } from '@/hooks/useCustomers';

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
}

const riceTypes = [
  'Gạo ST25',
  'Gạo Jasmine',
  'Gạo thơm',
  'Gạo tẻ',
  'Gạo nếp',
  'Gạo dẻo',
  'Gạo lứt',
  'Gạo hạt dài',
  'Gạo tròn',
  'Gạo tấm',
  'Khác',
];

export const TransactionForm = ({ onSubmit, onCancel }: TransactionFormProps) => {
  const { customers, loading: loadingCustomers } = useCustomers();
  const [formData, setFormData] = useState<TransactionFormData>({
    customerName: '',
    licensePlate: '',
    riceType: '',
    unitPrice: '',
  });
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Get active customers
  const activeCustomers = customers.filter(c => c.is_active);

  // Filter customers based on search
  const filteredCustomers = activeCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const validate = (): boolean => {
    const newErrors: Partial<TransactionFormData> = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Vui lòng chọn mối hàng';
    }
    if (!formData.riceType) {
      newErrors.riceType = 'Vui lòng chọn loại gạo';
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Vui lòng nhập đơn giá hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleCustomerSelect = (customerName: string) => {
    setFormData({ ...formData, customerName });
    setCustomerSearch(customerName);
    setShowCustomerDropdown(false);
  };

  const inputClass = (field: keyof TransactionFormData) =>
    `w-full h-14 px-4 pl-12 text-lg rounded-xl border-2 transition-all ${errors[field]
      ? 'border-destructive bg-destructive/5'
      : 'border-border bg-card focus:border-primary'
    } focus:outline-none focus:ring-2 focus:ring-primary/20`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground mb-6">Tạo chuyến xe mới</h2>

      {/* License Plate */}
      <div className="space-y-1">
        <div className="relative">
          <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Biển số xe *"
            value={formData.licensePlate}
            onChange={(e) =>
              setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
            }
            className={inputClass('licensePlate')}
            autoComplete="off"
          />
        </div>
        {errors.licensePlate && (
          <p className="text-sm text-destructive pl-2">{errors.licensePlate}</p>
        )}
      </div>

      {/* Customer Name with Dropdown */}
      <div className="space-y-1">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <input
            type="text"
            placeholder="Chọn mối hàng *"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setFormData({ ...formData, customerName: e.target.value });
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            className={inputClass('customerName')}
            autoComplete="off"
          />

          {/* Dropdown list */}
          {showCustomerDropdown && !loadingCustomers && filteredCustomers.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-card border-2 border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                  onClick={() => handleCustomerSelect(customer.name)}
                >
                  <p className="font-medium text-foreground">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {showCustomerDropdown && !loadingCustomers && customerSearch && filteredCustomers.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-card border-2 border-border rounded-xl shadow-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Không tìm thấy mối hàng. Bạn có thể nhập tên mới.
              </p>
            </div>
          )}
        </div>
        {errors.customerName && (
          <p className="text-sm text-destructive pl-2">{errors.customerName}</p>
        )}
      </div>

      {/* Rice Type */}
      <div className="space-y-1">
        <div className="relative">
          <Wheat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={formData.riceType}
            onChange={(e) =>
              setFormData({ ...formData, riceType: e.target.value })
            }
            className={`${inputClass('riceType')} appearance-none cursor-pointer`}
          >
            <option value="">Chọn loại gạo *</option>
            {riceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {errors.riceType && (
          <p className="text-sm text-destructive pl-2">{errors.riceType}</p>
        )}
      </div>

      {/* Unit Price */}
      <div className="space-y-1">
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Đơn giá (VNĐ/kg) *"
            value={formData.unitPrice}
            onChange={(e) =>
              setFormData({
                ...formData,
                unitPrice: e.target.value.replace(/[^0-9]/g, ''),
              })
            }
            className={inputClass('unitPrice')}
            autoComplete="off"
          />
        </div>
        {errors.unitPrice && (
          <p className="text-sm text-destructive pl-2">{errors.unitPrice}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          Hủy
        </Button>
        <Button type="submit" variant="hero" size="lg" className="flex-[2] gap-2">
          Bắt đầu cân
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
};
