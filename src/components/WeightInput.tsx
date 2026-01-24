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
    if (weight > 0) {
      onAddWeight(weight);
      setValue('');
      // Re-focus for next input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = parseFloat(value) > 0;

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
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
              setValue(val);
            }}
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
        Nhấn Enter hoặc nút "Lên xe" để thêm số cân
      </p>
    </div>
  );
};
