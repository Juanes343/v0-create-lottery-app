-- Add WhatsApp field to raffles table for manual payment coordination
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add payment instructions field
ALTER TABLE public.raffles 
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
