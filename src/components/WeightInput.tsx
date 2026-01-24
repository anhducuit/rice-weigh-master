import { useState, useRef, useEffect } from 'react';
import { Plus, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeightInputProps {
  onAddWeight: (weight: number) => void;
}

export const WeightInput = ({ onAddWeight }: WeightInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const weight = parseFloat(value);
    if (weight > 0 && weight <= 100) {
      onAddWeight(weight);
      setValue('');
      // Re-focus for next input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ''); // Only numbers

    if (val.length === 0) {
      setValue('');
      return;
    }

    // Convert to decimal: 501 -> 50.1, 500 -> 50.0, 50 -> 5.0, 5 -> 0.5
    const numValue = parseInt(val);
    const decimalValue = numValue / 10;

    // Only accept values <= 100kg
    if (decimalValue <= 100) {
      setValue(decimalValue.toString());

      // Auto-submit when we have a valid 3-digit number (e.g., 501, 500, 485)
      if (val.length === 3 && decimalValue > 0) {
        setTimeout(() => {
          onAddWeight(decimalValue);
          setValue('');
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = parseFloat(value) > 0 && parseFloat(value) <= 100;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Nhập số cân (kg)
      </label>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="0.0"
            className={`weight-input w-full h-20 px-6 ${value ? 'input-active' : ''}`}
            autoComplete="off"
          />
          {isValid && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">
              kg
            </div>
          )}
        </div>
        <Button
          variant="action"
          size="xl"
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-6 gap-2 shrink-0"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="hidden sm:inline">Lên xe</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Nhập 3 số sẽ tự động lên xe (VD: 501 = 50.1kg, 500 = 50kg)
      </p>
    </div>
  );
};
