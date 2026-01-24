import { Users, Plus, Search, Trash2, Package, Scale, Banknote } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useCustomers } from '@/hooks/useCustomers';
import { useTransaction } from '@/hooks/useTransaction';
import { CustomerFormDialog } from '@/components/CustomerFormDialog';
import { useState, useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerStats {
    totalBags: number;
    totalWeight: number;
    totalAmount: number;
    riceTypes: Set<string>;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

const Customers = () => {
    const { customers, loading: customersLoading, deleteCustomer } = useCustomers();
    const { transactions, loading: transactionsLoading } = useTransaction();
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    // Calculate stats for each customer
    const customerStats = useMemo(() => {
        const stats = new Map<string, CustomerStats>();

        // Get completed transactions only
        const completedTransactions = transactions.filter(t => t.status === 'completed');

        completedTransactions.forEach(tx => {
            const customerName = tx.customerName;
            if (!stats.has(customerName)) {
                stats.set(customerName, {
                    totalBags: 0,
                    totalWeight: 0,
                    totalAmount: 0,
                    riceTypes: new Set<string>()
                });
            }

            const stat = stats.get(customerName)!;
            stat.totalBags += tx.weights.length;
            stat.totalWeight += tx.weights.reduce((sum, w) => sum + w.weight, 0);

            // Calculate amount based on batches or legacy
            if (tx.riceBatches && tx.riceBatches.length > 0) {
                tx.riceBatches.forEach(batch => {
                    stat.riceTypes.add(batch.riceType);
                    const batchWeights = tx.weights.filter(w => w.riceBatchId === batch.id);
                    const batchWeight = batchWeights.reduce((sum, w) => sum + w.weight, 0);
                    stat.totalAmount += batchWeight * batch.unitPrice;
                });
            } else {
                stat.riceTypes.add(tx.riceType);
                stat.totalAmount += stat.totalWeight * tx.unitPrice;
            }
        });

        return stats;
    }, [transactions]);

    // Filter customers based on search only
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const isActive = customer.is_active;

        return matchesSearch && isActive;
    });

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setDialogOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDialogOpen(true);
    };

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (customerToDelete) {
            try {
                await deleteCustomer(customerToDelete.id);
                setDeleteDialogOpen(false);
                setCustomerToDelete(null);
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    };

    const loading = customersLoading || transactionsLoading;

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">Mối hàng</h1>
                    </div>
                    <Button size="sm" className="gap-2" onClick={handleAddNew}>
                        <Plus className="h-4 w-4" />
                        Thêm mới
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên, SĐT, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Stats Card */}
                <div className="bg-card rounded-lg p-4 border mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Tổng số mối hàng</p>
                    <p className="text-3xl font-bold text-primary">
                        {customers.filter(c => c.is_active).length}
                    </p>
                </div>

                {/* Customer List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? 'Không tìm thấy mối hàng phù hợp'
                                : 'Chưa có mối hàng nào'}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Nhấn "Thêm mới" để tạo mối hàng đầu tiên
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredCustomers.map((customer) => {
                            const stats = customerStats.get(customer.name);
                            const hasTransactions = stats && stats.totalBags > 0;

                            return (
                                <div
                                    key={customer.id}
                                    className="bg-card rounded-xl p-4 border border-border"
                                >
                                    {/* Customer Info */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-foreground text-lg">
                                                {customer.name}
                                            </h3>
                                            <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                                                {customer.phone && <p>📞 {customer.phone}</p>}
                                                {customer.email && (
                                                    <p className="truncate">✉️ {customer.email}</p>
                                                )}
                                                {customer.address && (
                                                    <p className="truncate">📍 {customer.address}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(customer)}
                                            >
                                                Sửa
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(customer)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Transaction Stats */}
                                    {hasTransactions ? (
                                        <div className="border-t border-border pt-3 mt-3">
                                            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                                                Thống kê giao dịch
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-primary/5 rounded-lg p-2">
                                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                        <Package className="w-3 h-3" />
                                                        <span className="text-2xs">Bao</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {stats.totalBags}
                                                    </p>
                                                </div>
                                                <div className="bg-primary/5 rounded-lg p-2">
                                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                        <Scale className="w-3 h-3" />
                                                        <span className="text-2xs">Kg</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {stats.totalWeight.toFixed(0)}
                                                    </p>
                                                </div>
                                                <div className="bg-success/5 rounded-lg p-2">
                                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                                        <Banknote className="w-3 h-3" />
                                                        <span className="text-2xs">Tiền</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-success">
                                                        {(stats.totalAmount / 1000000).toFixed(1)}M
                                                    </p>
                                                </div>
                                            </div>
                                            {stats.riceTypes.size > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-2xs text-muted-foreground mb-1">
                                                        Loại gạo:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.from(stats.riceTypes).map(type => (
                                                            <span
                                                                key={type}
                                                                className="text-2xs bg-secondary px-2 py-0.5 rounded-full text-foreground"
                                                            >
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border-t border-border pt-3 mt-3">
                                            <p className="text-xs text-muted-foreground text-center">
                                                Chưa có giao dịch nào
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <CustomerFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={selectedCustomer}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa mối hàng "{customerToDelete?.name}"?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNav />
        </div>
    );
};

export default Customers;
