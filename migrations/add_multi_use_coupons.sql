-- Alter coupons table to add max_uses and uses_count
ALTER TABLE public.coupons 
  ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1 CHECK (max_uses > 0),
  ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0 CHECK (uses_count >= 0);

-- Create coupon_usages table to track individual user coupon redemptions
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS on coupon_usages
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_usages
CREATE POLICY "Users can read own coupon usages" ON public.coupon_usages
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Users can insert own coupon usages" ON public.coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage coupon usages" ON public.coupon_usages
  FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Secure/Update coupons policies to use admin_users table for management
DROP POLICY IF EXISTS "Users can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Trigger to automatically increment uses_count and sync used boolean
CREATE OR REPLACE FUNCTION public.increment_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coupons
  SET 
    uses_count = uses_count + 1,
    used = CASE WHEN (uses_count + 1) >= max_uses THEN true ELSE false END
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_increment_coupon_uses
AFTER INSERT ON public.coupon_usages
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_uses();

-- Trigger to automatically decrement uses_count on delete
CREATE OR REPLACE FUNCTION public.decrement_coupon_uses()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coupons
  SET 
    uses_count = GREATEST(0, uses_count - 1),
    used = CASE WHEN GREATEST(0, uses_count - 1) >= max_uses THEN true ELSE false END
  WHERE id = OLD.coupon_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_decrement_coupon_uses
AFTER DELETE ON public.coupon_usages
FOR EACH ROW
EXECUTE FUNCTION public.decrement_coupon_uses();
