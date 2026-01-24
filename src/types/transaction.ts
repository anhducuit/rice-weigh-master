export interface WeighingDetail {
  id: string;
  weight: number;
  orderIndex: number;
}

export interface Transaction {
  id: string;
  createdAt: Date;
  customerName: string;
  licensePlate: string;
  riceType: string;
  unitPrice: number;
  weights: WeighingDetail[];
  status: 'pending' | 'completed';
}

export interface TransactionSummary {
  totalBags: number;
  totalWeight: number;
  totalAmount: number;
}

export type TransactionFormData = {
  customerName: string;
  licensePlate: string;
  riceType: string;
  unitPrice: string;
};
