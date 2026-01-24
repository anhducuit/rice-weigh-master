import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RiceBatch = Database['public']['Tables']['rice_batches']['Row'];
type RiceBatchInsert = Database['public']['Tables']['rice_batches']['Insert'];

export function useRiceBatches(transactionId?: string) {
    const [batches, setBatches] = useState<RiceBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch batches for a specific transaction
    const fetchBatches = async (txId: string) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('rice_batches')
                .select('*')
                .eq('transaction_id', txId)
                .order('batch_order', { ascending: true });

            if (fetchError) throw fetchError;
            setBatches(data || []);
            return data || [];
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách lô gạo');
            console.error('Error fetching rice batches:', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Create multiple batches for a transaction
    const createBatches = async (batchesData: RiceBatchInsert[]) => {
        try {
            const { data, error: createError } = await supabase
                .from('rice_batches')
                .insert(batchesData)
                .select();

            if (createError) throw createError;
            return data;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tạo lô gạo';
            setError(errorMsg);
            console.error('Error creating rice batches:', err);
            throw new Error(errorMsg);
        }
    };

    // Delete a batch
    const deleteBatch = async (batchId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('rice_batches')
                .delete()
                .eq('id', batchId);

            if (deleteError) throw deleteError;

            // Refresh batches if we have a transaction ID
            if (transactionId) {
                await fetchBatches(transactionId);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Lỗi khi xóa lô gạo';
            setError(errorMsg);
            console.error('Error deleting rice batch:', err);
            throw new Error(errorMsg);
        }
    };

    useEffect(() => {
        if (transactionId) {
            fetchBatches(transactionId);
        }
    }, [transactionId]);

    return {
        batches,
        loading,
        error,
        fetchBatches,
        createBatches,
        deleteBatch,
    };
}
