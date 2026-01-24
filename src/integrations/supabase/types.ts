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
                }
                Insert: {
                    id?: string
                    created_at?: string
                    customer_name: string
                    license_plate: string
                    rice_type: string
                    unit_price: number
                    status?: 'pending' | 'completed'
                }
                Update: {
                    id?: string
                    created_at?: string
                    customer_name: string
                    license_plate: string
                    rice_type: string
                    unit_price: number
                    status?: 'pending' | 'completed'
                }
            }
            weighing_details: {
                Row: {
                    id: string
                    transaction_id: string
                    weight: number
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    weight: number
                    order_index: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id: string
                    weight?: number
                    order_index?: number
                    created_at?: string
                }
            }
        }
    }
}
