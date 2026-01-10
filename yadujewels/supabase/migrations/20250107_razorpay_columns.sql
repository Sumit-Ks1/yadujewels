-- Add Razorpay payment columns to orders table
-- These columns store payment gateway information for order tracking and verification

-- Razorpay order ID returned when creating an order via Razorpay API
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Razorpay payment ID returned after successful payment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Razorpay signature for payment verification (HMAC SHA256)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;

-- Additional payment metadata (JSON) for storing payment details, method info, etc.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_metadata JSONB;

-- Create index on razorpay_order_id for quick lookups during payment verification
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders (razorpay_order_id);

-- Create index on razorpay_payment_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders (razorpay_payment_id);

COMMENT ON COLUMN public.orders.razorpay_order_id IS 'Razorpay order ID (order_xxx) created via API';
COMMENT ON COLUMN public.orders.razorpay_payment_id IS 'Razorpay payment ID (pay_xxx) after successful payment';
COMMENT ON COLUMN public.orders.razorpay_signature IS 'HMAC SHA256 signature for payment verification';
COMMENT ON COLUMN public.orders.payment_metadata IS 'Additional payment metadata from Razorpay (method, bank, wallet, etc.)';
