-- Create number packages table
CREATE TABLE IF NOT EXISTS public.number_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.number_packages ENABLE ROW LEVEL SECURITY;

-- Policies for number_packages
CREATE POLICY "Packages are viewable by everyone" 
  ON public.number_packages FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage packages of their raffles" 
  ON public.number_packages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = raffle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update packages of their raffles" 
  ON public.number_packages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = raffle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete packages of their raffles" 
  ON public.number_packages FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.raffles 
      WHERE id = raffle_id AND user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_number_packages_raffle_id ON public.number_packages(raffle_id);
