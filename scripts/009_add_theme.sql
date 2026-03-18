-- Add theme/color palette field to raffles table
ALTER TABLE public.raffles
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
