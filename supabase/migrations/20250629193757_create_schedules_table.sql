-- Create schedules table
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    schedule_date DATE NOT NULL,
    schedule_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on user_id for faster queries
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);

-- Create an index on schedule_date for faster date-based queries
CREATE INDEX idx_schedules_date ON public.schedules(schedule_date);

-- Create a composite index for user_id and schedule_date
CREATE INDEX idx_schedules_user_date ON public.schedules(user_id, schedule_date);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own schedules
CREATE POLICY "Users can view own schedules" ON public.schedules
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own schedules
CREATE POLICY "Users can insert own schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own schedules
CREATE POLICY "Users can update own schedules" ON public.schedules
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own schedules
CREATE POLICY "Users can delete own schedules" ON public.schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on schedule updates
CREATE TRIGGER update_schedules_updated_at 
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();