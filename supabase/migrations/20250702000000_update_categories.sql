-- Update categories to new 4-category system
-- This migration maps old categories to new ones and adds category constraints

-- Add check constraint for new categories
ALTER TABLE public.goals 
DROP CONSTRAINT IF EXISTS goals_category_check;

ALTER TABLE public.goals 
ADD CONSTRAINT goals_category_check 
CHECK (category IN ('Physical Health', 'Mental Health', 'Finance', 'Social'));

-- Update existing goals to map old categories to new ones
UPDATE public.goals 
SET category = CASE 
    WHEN category = 'Health' THEN 'Physical Health'
    WHEN category = 'Career' THEN 'Finance'
    WHEN category = 'Personal' THEN 'Mental Health'
    WHEN category = 'Learning' THEN 'Mental Health'
    WHEN category = 'Finance' THEN 'Finance'
    WHEN category = 'Other' THEN 'Social'
    ELSE 'Physical Health'  -- Default fallback
END
WHERE category IS NOT NULL;

-- Set default category for any NULL values
UPDATE public.goals 
SET category = 'Physical Health' 
WHERE category IS NULL;

-- Make category field required going forward
ALTER TABLE public.goals 
ALTER COLUMN category SET NOT NULL;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_user_category ON public.goals(user_id, category);