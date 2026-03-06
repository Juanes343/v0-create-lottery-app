-- Create raffles table
CREATE TABLE IF NOT EXISTS public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize_name TEXT NOT NULL,
  prize_image_url TEXT,
  banner_image_url TEXT,
  price_per_number INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'COP',
  total_numbers INTEGER NOT NULL DEFAULT 1000,
  number_digits INTEGER DEFAULT 5,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

-- Policies for raffles
CREATE POLICY "Active raffles are viewable by everyone" 
  ON public.raffles FOR SELECT 
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own raffles" 
  ON public.raffles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own raffles" 
  ON public.raffles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own raffles" 
  ON public.raffles FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_raffles_user_id ON public.raffles(user_id);
CREATE INDEX IF NOT EXISTS idx_raffles_status ON public.raffles(status);
CREATE INDEX IF NOT EXISTS idx_raffles_slug ON public.raffles(slug);
