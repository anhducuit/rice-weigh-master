import { Users, Plus, Search } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerFormDialog } from '@/components/CustomerFormDialog';
import { useState } from 'react';
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

type Customer = Database['public']['Tables']['customers']['Row'];

const Customers = () => {
    const { customers, loading } = useCustomers();
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
                    <div className="bg-card rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Liên hệ</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div>
                                                <p className="font-semibold">{customer.name}</p>
                                                {customer.address && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {customer.address}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {customer.phone && <p>{customer.phone}</p>}
                                                {customer.email && (
                                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                        {customer.email}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(customer)}
                                            >
                                                Sửa
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <CustomerFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={selectedCustomer}
            />

            <BottomNav />
        </div>
    );
};

export default Customers;
