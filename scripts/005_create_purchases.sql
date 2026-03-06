-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  total_amount INTEGER NOT NULL, -- in cents
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Purchases viewable by raffle owner or buyer email" 
  ON public.purchases FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = raffle_id AND user_id = auth.uid()
    )
    OR true -- Allow public access for lookup by email
  );

CREATE POLICY "Anyone can create purchases" 
  ON public.purchases FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update purchases" 
  ON public.purchases FOR UPDATE 
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchases_raffle_id ON public.purchases(raffle_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);

-- Add foreign key from sold_numbers to purchases
ALTER TABLE public.sold_numbers 
  ADD CONSTRAINT fk_sold_numbers_purchase 
  FOREIGN KEY (purchase_id) 
  REFERENCES public.purchases(id) 
  ON DELETE SET NULL;
