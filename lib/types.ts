export interface Profile {
  id: string
  username: string
  business_name: string
  whatsapp?: string
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Raffle {
  id: string
  user_id: string
  slug: string
  title: string
  description?: string
  prize_description: string
  images: string[]
  number_range_start: number
  number_range_end: number
  price_per_number: number
  currency: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  draw_date?: string
  whatsapp_number?: string
  payment_instructions?: string
  created_at: string
  updated_at: string
}

export interface NumberPackage {
  id: string
  raffle_id: string
  quantity: number
  discount_percentage: number
  is_active: boolean
  created_at: string
}

export interface SoldNumber {
  id: string
  raffle_id: string
  purchase_id: string
  number: number
  buyer_email: string
  buyer_name: string
  buyer_phone?: string
  created_at: string
}

export interface Purchase {
  id: string
  raffle_id: string
  buyer_email: string
  buyer_name: string
  buyer_phone?: string
  numbers: number[]
  total_amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  payment_reference?: string
  created_at: string
  updated_at: string
}

export interface RaffleWithStats extends Raffle {
  sold_count: number
  total_numbers: number
  revenue: number
}
