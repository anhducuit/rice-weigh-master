import { useState, useEffect } from 'react';
import { Truck, User, Wheat, DollarSign, ArrowRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionFormData } from '@/types/transaction';
import { useCustomers } from '@/hooks/useCustomers';
import { useRicePrices } from '@/hooks/useRicePrices';

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData & { riceBatches: RiceBatch[] }) => void;
  onCancel: () => void;
}

interface RiceBatch {
  rice_type: string;
  unit_price: number;
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
  const { getPriceByType, loading: loadingPrices } = useRicePrices();

  const [formData, setFormData] = useState<TransactionFormData>({
    customerName: '',
    licensePlate: '',
    riceType: '', // Deprecated - will be removed
    unitPrice: '', // Deprecated - will be removed
  });

  const [riceBatches, setRiceBatches] = useState<RiceBatch[]>([
    { rice_type: '', unit_price: 0 }
  ]);

  const [errors, setErrors] = useState<any>({});
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
    const newErrors: any = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Vui lòng chọn mối hàng';
    }

    // Validate rice batches
    if (riceBatches.length === 0) {
      newErrors.riceBatches = 'Vui lòng thêm ít nhất 1 lô gạo';
    } else {
      riceBatches.forEach((batch, index) => {
        if (!batch.rice_type) {
          newErrors[`batch_${index}_type`] = 'Vui lòng chọn loại gạo';
        }
        if (!batch.unit_price || batch.unit_price <= 0) {
          newErrors[`batch_${index}_price`] = 'Vui lòng nhập đơn giá hợp lệ';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        riceBatches: riceBatches.filter(b => b.rice_type && b.unit_price > 0)
      });
    }
  };

  const handleCustomerSelect = (customerName: string) => {
    setFormData({ ...formData, customerName });
    setCustomerSearch(customerName);
    setShowCustomerDropdown(false);
  };

  const handleAddBatch = () => {
    setRiceBatches([...riceBatches, { rice_type: '', unit_price: 0 }]);
  };

  const handleRemoveBatch = (index: number) => {
    if (riceBatches.length > 1) {
      setRiceBatches(riceBatches.filter((_, i) => i !== index));
    }
  };

  const handleBatchTypeChange = (index: number, riceType: string) => {
    const newBatches = [...riceBatches];
    newBatches[index].rice_type = riceType;

    // Auto-fill price based on rice type
    if (riceType && !loadingPrices) {
      newBatches[index].unit_price = getPriceByType(riceType);
    }

    setRiceBatches(newBatches);
  };

  const handleBatchPriceChange = (index: number, price: string) => {
    const newBatches = [...riceBatches];
    newBatches[index].unit_price = parseInt(price) || 0;
    setRiceBatches(newBatches);
  };

  const inputClass = (hasError: boolean) =>
    `w-full h-14 px-4 pl-12 text-lg rounded-xl border-2 transition-all ${hasError
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
            className={inputClass(!!errors.licensePlate)}
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
            className={inputClass(!!errors.customerName)}
            autoComplete="off"
          />

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
        </div>
        {errors.customerName && (
          <p className="text-sm text-destructive pl-2">{errors.customerName}</p>
        )}
      </div>

      {/* Rice Batches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Các lô gạo *</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddBatch}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Thêm lô
          </Button>
        </div>

        {riceBatches.map((batch, index) => (
          <div key={index} className="bg-muted/30 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Lô {index + 1}</span>
              {riceBatches.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveBatch(index)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Rice Type */}
            <div className="relative">
              <Wheat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={batch.rice_type}
                onChange={(e) => handleBatchTypeChange(index, e.target.value)}
                className={`${inputClass(!!errors[`batch_${index}_type`])} appearance-none cursor-pointer`}
              >
                <option value="">Chọn loại gạo</option>
                {riceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            {errors[`batch_${index}_type`] && (
              <p className="text-sm text-destructive pl-2">{errors[`batch_${index}_type`]}</p>
            )}

            {/* Unit Price */}
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Đơn giá (VNĐ/kg)"
                value={batch.unit_price || ''}
                onChange={(e) => handleBatchPriceChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                className={inputClass(!!errors[`batch_${index}_price`])}
                autoComplete="off"
              />
            </div>
            {errors[`batch_${index}_price`] && (
              <p className="text-sm text-destructive pl-2">{errors[`batch_${index}_price`]}</p>
            )}
          </div>
        ))}

        {errors.riceBatches && (
          <p className="text-sm text-destructive pl-2">{errors.riceBatches}</p>
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
