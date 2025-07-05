-- Add missing columns to user_onboarding table for enhanced onboarding data
ALTER TABLE public.user_onboarding 
ADD COLUMN IF NOT EXISTS selected_category TEXT,
ADD COLUMN IF NOT EXISTS time_commitment TEXT CHECK (time_commitment IN ('light', 'moderate', 'intensive'));

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_user_onboarding_category ON public.user_onboarding(selected_category);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_time_commitment ON public.user_onboarding(time_commitment);