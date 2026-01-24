import { useState } from 'react';
import { X, Pencil, Check } from 'lucide-react';
import { WeighingDetail, RiceBatch } from '@/types/transaction';
import { Button } from '@/components/ui/button';

interface WeightGridProps {
  weights: WeighingDetail[];
  riceBatches: RiceBatch[];
  onUpdate: (id: string, newValue: number) => void;
  onDelete: (id: string) => void;
}

export const WeightGrid = ({ weights, riceBatches, onUpdate, onDelete }: WeightGridProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (weight: WeighingDetail) => {
    setEditingId(weight.id);
    setEditValue(weight.weight.toString());
  };

  const handleSaveEdit = (id: string) => {
    const newValue = parseFloat(editValue);
    if (newValue > 0) {
      onUpdate(id, newValue);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Get batch info for a weight
  const getBatchInfo = (weight: WeighingDetail) => {
    if (!weight.riceBatchId) return null;
    return riceBatches.find(b => b.id === weight.riceBatchId);
  };

  if (weights.length === 0) {
    return (
      <div className="bg-weight-grid-bg rounded-2xl p-8 text-center">
        <div className="text-6xl mb-3">🌾</div>
        <p className="text-muted-foreground font-medium">
          Chưa có số cân nào
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Nhập số kg phía trên để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Danh sách bao ({weights.length} bao)
        </h3>
      </div>
      <div className="weight-grid grid grid-cols-5 gap-2 max-h-[40vh] overflow-y-auto p-1">
        {weights.map((weight, index) => {
          const batchInfo = getBatchInfo(weight);

          return (
            <div
              key={weight.id}
              className={`weight-item weight-item-enter relative group ${editingId === weight.id ? 'ring-2 ring-primary' : ''
                }`}
              style={{ animationDelay: `${index * 0.02}s` }}
              onClick={() => editingId !== weight.id && handleStartEdit(weight)}
            >
              {editingId === weight.id ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    className="w-full text-center text-lg font-bold bg-transparent border-b-2 border-primary outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(weight.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <div className="flex gap-1 justify-center mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(weight.id);
                      }}
                      className="p-1 rounded bg-success text-success-foreground"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(weight.id);
                        handleCancelEdit();
                      }}
                      className="p-1 rounded bg-destructive text-destructive-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-lg font-bold text-weight-item">
                    {weight.weight}
                  </span>
                  <span className="text-2xs text-muted-foreground block">
                    #{weight.orderIndex + 1}
                  </span>
                  {batchInfo && riceBatches.length > 1 && (
                    <span className="text-2xs text-primary block truncate" title={batchInfo.riceType}>
                      {batchInfo.riceType}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
