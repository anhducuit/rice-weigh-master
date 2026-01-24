import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type RicePrice = Database['public']['Tables']['rice_prices']['Row'];

export function useRicePrices() {
    const [ricePrices, setRicePrices] = useState<RicePrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all rice prices
    const fetchRicePrices = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('rice_prices')
                .select('*')
                .order('rice_type', { ascending: true });

            if (fetchError) throw fetchError;
            setRicePrices(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải bảng giá');
            console.error('Error fetching rice prices:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get price for a specific rice type
    const getPriceByType = (riceType: string): number => {
        const priceEntry = ricePrices.find(p => p.rice_type === riceType);
        return priceEntry?.default_price || 6000; // Default fallback price
    };

    // Get all rice types with prices as a map
    const getRicePriceMap = (): Record<string, number> => {
        const map: Record<string, number> = {};
        ricePrices.forEach(price => {
            map[price.rice_type] = price.default_price;
        });
        return map;
    };

    useEffect(() => {
        fetchRicePrices();
    }, []);

    return {
        ricePrices,
        loading,
        error,
        fetchRicePrices,
        getPriceByType,
        getRicePriceMap,
    };
}
