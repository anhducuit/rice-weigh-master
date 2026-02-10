import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all customers
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setCustomers(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách khách hàng');
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create new customer
    const createCustomer = async (customerData: CustomerInsert) => {
        try {
            const { data, error: createError } = await supabase
                .from('customers')
                .insert(customerData)
                .select()
                .single();

            if (createError) throw createError;

            // Refresh the list
            await fetchCustomers();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tạo khách hàng';
            setError(errorMsg);
            console.error('Error creating customer:', err);
            throw new Error(errorMsg);
        }
    };

    // Update customer
    const updateCustomer = async (id: string, customerData: CustomerUpdate) => {
        try {
            const { data, error: updateError } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Refresh the list
            await fetchCustomers();
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi khi cập nhật khách hàng';
            setError(errorMsg);
            console.error('Error updating customer:', err);
            throw new Error(errorMsg);
        }
    };

    // Delete customer (hard delete from database)
    const deleteCustomer = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Refresh the list
            await fetchCustomers();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi khi xóa khách hàng';
            setError(errorMsg);
            console.error('Error deleting customer:', err);
            throw new Error(errorMsg);
        }
    };

    // Get customer by ID
    const getCustomerById = async (id: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            return data;
        } catch (err) {
            console.error('Error fetching customer:', err);
            throw err;
        }
    };

    // Get active customers only
    const getActiveCustomers = () => {
        return customers.filter(c => c.is_active);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    return {
        customers,
        loading,
        error,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        getActiveCustomers,
    };
}
