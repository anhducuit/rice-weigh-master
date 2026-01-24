export interface WeighingDetail {
  id: string;
  weight: number;
  orderIndex: number;
  riceBatchId?: string; // Link to specific rice batch
}

export interface RiceBatch {
  id: string;
  riceType: string;
  unitPrice: number;
  batchOrder: number;
}

export interface Transaction {
  id: string;
  createdAt: Date;
  customerName: string;
  licensePlate: string;
  riceType: string; // Deprecated - kept for backward compatibility
  unitPrice: number; // Deprecated - kept for backward compatibility
  riceBatches: RiceBatch[]; // New: array of rice batches
  weights: WeighingDetail[];
  status: 'pending' | 'completed';
}

export interface TransactionSummary {
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
  batchSummaries?: BatchSummary[]; // Summary per batch
}

export interface BatchSummary {
  batchId: string;
  riceType: string;
  unitPrice: number;
  bags: number;
  weight: number;
  amount: number;
}

export type TransactionFormData = {
  customerName: string;
  licensePlate: string;
  riceType: string; // Deprecated
  unitPrice: string; // Deprecated
};
