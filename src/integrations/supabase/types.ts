export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            transactions: {
                Row: {
                    id: string
                    created_at: string
                    customer_name: string
                    license_plate: string
                    rice_type: string
                    unit_price: number
                    status: 'pending' | 'completed'
                    customer_id: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    customer_name: string
                    license_plate: string
                    rice_type: string
                    unit_price: number
                    status?: 'pending' | 'completed'
                    customer_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    customer_name?: string
                    license_plate?: string
                    rice_type?: string
                    unit_price?: number
                    status?: 'pending' | 'completed'
                    customer_id?: string | null
                }
            }
            weighing_details: {
                Row: {
                    id: string
                    transaction_id: string
                    rice_batch_id: string | null
                    weight: number
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    rice_batch_id?: string | null
                    weight: number
                    order_index: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    rice_batch_id?: string | null
                    weight?: number
                    order_index?: number
                    created_at?: string
                }
            }
            customers: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    type: 'customer' | 'partner'
                    notes: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    type?: 'customer' | 'partner'
                    notes?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    type?: 'customer' | 'partner'
                    notes?: string | null
                    is_active?: boolean
                }
            }
            rice_batches: {
                Row: {
                    id: string
                    transaction_id: string
                    rice_type: string
                    unit_price: number
                    batch_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    rice_type: string
                    unit_price: number
                    batch_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    rice_type?: string
                    unit_price?: number
                    batch_order?: number
                    created_at?: string
                }
            }
            rice_prices: {
                Row: {
                    id: string
                    rice_type: string
                    default_price: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    rice_type: string
                    default_price: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    rice_type?: string
                    default_price?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
