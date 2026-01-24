import { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: Customer | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
    const { createCustomer, updateCustomer } = useCustomers();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        type: customer?.type || 'customer' as 'customer' | 'partner',
        notes: customer?.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng nhập tên khách hàng',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            if (customer) {
                // Update existing customer
                await updateCustomer(customer.id, {
                    name: formData.name.trim(),
                    phone: formData.phone.trim() || null,
                    email: formData.email.trim() || null,
                    address: formData.address.trim() || null,
                    type: formData.type,
                    notes: formData.notes.trim() || null,
                });
                toast({
                    title: 'Thành công',
                    description: 'Đã cập nhật thông tin khách hàng',
                });
            } else {
                // Create new customer
                await createCustomer({
                    name: formData.name.trim(),
                    phone: formData.phone.trim() || null,
                    email: formData.email.trim() || null,
                    address: formData.address.trim() || null,
                    type: formData.type,
                    notes: formData.notes.trim() || null,
                });
                toast({
                    title: 'Thành công',
                    description: 'Đã thêm khách hàng mới',
                });
            }

            onOpenChange(false);
            // Reset form
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                type: 'customer',
                notes: '',
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Sửa thông tin' : 'Thêm khách hàng mới'}</DialogTitle>
                    <DialogDescription>
                        {customer ? 'Cập nhật thông tin khách hàng' : 'Nhập thông tin khách hàng mới'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Tên khách hàng <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập tên khách hàng"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">Loại</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'customer' | 'partner') =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Khách hàng</SelectItem>
                                    <SelectItem value="partner">Đối tác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Nhập email"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">Địa chỉ</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Nhập địa chỉ"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Ghi chú</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Nhập ghi chú (nếu có)"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : customer ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
