import { useState } from 'react';
import { Truck, User, Wheat, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionFormData } from '@/types/transaction';

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
  'Khác',
];

export const TransactionForm = ({ onSubmit, onCancel }: TransactionFormProps) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    customerName: '',
    licensePlate: '',
    riceType: '',
    unitPrice: '',
  });
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<TransactionFormData> = {};

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe';
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Vui lòng nhập tên khách hàng';
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

  const inputClass = (field: keyof TransactionFormData) =>
    `w-full h-14 px-4 pl-12 text-lg rounded-xl border-2 transition-all ${
      errors[field]
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

      {/* Customer Name */}
      <div className="space-y-1">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tên khách hàng *"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className={inputClass('customerName')}
            autoComplete="off"
          />
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
