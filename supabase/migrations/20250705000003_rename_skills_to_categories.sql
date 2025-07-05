-- Fix naming: Rename 'skills' table to 'categories' for clarity
-- Migration: 20250705000003_rename_skills_to_categories.sql

-- Rename the table
ALTER TABLE public.skills RENAME TO categories;

-- Update foreign key column name in goal_templates
ALTER TABLE public.goal_templates RENAME COLUMN skill_id TO category_id;

-- Update the constraint name and enum values for clarity
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS skills_name_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_check 
    CHECK (name IN ('Physical Health', 'Mental Health', 'Finance', 'Social'));

-- Update indexes
DROP INDEX IF EXISTS idx_goal_templates_skill_id;
CREATE INDEX idx_goal_templates_category_id ON public.goal_templates(category_id);

-- Update RLS policy names for clarity
DROP POLICY IF EXISTS "Authenticated users can read skills" ON public.categories;
CREATE POLICY "Authenticated users can read categories" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');

-- Update foreign key constraint
ALTER TABLE public.goal_templates 
DROP CONSTRAINT IF EXISTS goal_templates_skill_id_fkey;

ALTER TABLE public.goal_templates 
ADD CONSTRAINT goal_templates_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;