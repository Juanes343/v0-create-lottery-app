-- Update purchases table to remove Stripe-specific field and add generic payment fields
ALTER TABLE purchases 
  DROP COLUMN IF EXISTS stripe_session_id;

ALTER TABLE purchases 
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text;
