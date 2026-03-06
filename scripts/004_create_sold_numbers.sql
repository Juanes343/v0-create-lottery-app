-- Create sold numbers table
CREATE TABLE IF NOT EXISTS public.sold_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  purchase_id UUID,
  number INTEGER NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raffle_id, number)
);

-- Enable RLS
ALTER TABLE public.sold_numbers ENABLE ROW LEVEL SECURITY;

-- Policies for sold_numbers
CREATE POLICY "Sold numbers are viewable by everyone" 
  ON public.sold_numbers FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert sold numbers" 
  ON public.sold_numbers FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Raffle owners can update sold numbers" 
  ON public.sold_numbers FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = raffle_id AND user_id = auth.uid()
    )
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sold_numbers_raffle_id ON public.sold_numbers(raffle_id);
CREATE INDEX IF NOT EXISTS idx_sold_numbers_buyer_email ON public.sold_numbers(buyer_email);
CREATE INDEX IF NOT EXISTS idx_sold_numbers_status ON public.sold_numbers(status);
