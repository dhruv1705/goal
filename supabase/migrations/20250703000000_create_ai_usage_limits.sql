-- Create table for AI usage rate limiting
CREATE TABLE ai_usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_count INTEGER NOT NULL DEFAULT 0,
    hourly_count INTEGER NOT NULL DEFAULT 0,
    last_daily_reset DATE NOT NULL DEFAULT CURRENT_DATE,
    last_hourly_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('hour', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI usage limits" 
ON ai_usage_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage limits" 
ON ai_usage_limits 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_limits_user_id ON ai_usage_limits(user_id);
CREATE INDEX idx_ai_usage_limits_daily_reset ON ai_usage_limits(last_daily_reset);
CREATE INDEX idx_ai_usage_limits_hourly_reset ON ai_usage_limits(last_hourly_reset);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_usage_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_ai_usage_limits_updated_at
    BEFORE UPDATE ON ai_usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_limits_updated_at();