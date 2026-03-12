-- Add configurable prizes section title to raffles
ALTER TABLE public.raffles
ADD COLUMN IF NOT EXISTS prizes_title TEXT;
