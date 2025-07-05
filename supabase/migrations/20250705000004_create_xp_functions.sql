-- Create functions for XP management
-- Migration: 20250705000004_create_xp_functions.sql

-- Function to add XP to a user and create transaction record
CREATE OR REPLACE FUNCTION public.add_user_xp(
    user_id UUID,
    xp_amount INTEGER,
    transaction_type TEXT DEFAULT 'habit_completion',
    description TEXT DEFAULT NULL,
    habit_completion_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_xp_data RECORD;
    new_total_xp INTEGER;
    new_level INTEGER;
    xp_for_next_level INTEGER;
    level_up_bonus INTEGER := 0;
    result JSON;
BEGIN
    -- Get current XP data, create if doesn't exist
    SELECT total_xp, current_level, xp_to_next_level
    INTO current_xp_data
    FROM public.user_xp_progress 
    WHERE user_id = add_user_xp.user_id;
    
    -- If user doesn't have XP record, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_xp_progress (user_id, total_xp, current_level, xp_to_next_level)
        VALUES (add_user_xp.user_id, 0, 1, 100)
        RETURNING total_xp, current_level, xp_to_next_level INTO current_xp_data;
    END IF;
    
    -- Calculate new total XP
    new_total_xp := current_xp_data.total_xp + xp_amount;
    
    -- Calculate new level (every 100 XP = 1 level, with increasing requirements)
    new_level := 1 + (new_total_xp / 100);
    
    -- Check if user leveled up
    IF new_level > current_xp_data.current_level THEN
        level_up_bonus := (new_level - current_xp_data.current_level) * 50; -- Bonus XP for leveling up
        new_total_xp := new_total_xp + level_up_bonus;
        new_level := 1 + (new_total_xp / 100); -- Recalculate after bonus
    END IF;
    
    -- Calculate XP needed for next level
    xp_for_next_level := ((new_level) * 100) - new_total_xp;
    
    -- Update user XP progress
    UPDATE public.user_xp_progress 
    SET 
        total_xp = new_total_xp,
        current_level = new_level,
        xp_to_next_level = xp_for_next_level,
        last_activity_date = CURRENT_DATE,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = add_user_xp.user_id;
    
    -- Create XP transaction record
    INSERT INTO public.xp_transactions (
        user_id, 
        habit_completion_id, 
        xp_amount, 
        transaction_type, 
        description
    ) VALUES (
        add_user_xp.user_id,
        add_user_xp.habit_completion_id,
        xp_amount + level_up_bonus,
        add_user_xp.transaction_type,
        COALESCE(add_user_xp.description, 
            CASE 
                WHEN level_up_bonus > 0 THEN 'Habit completion + Level up bonus!'
                ELSE 'Habit completion'
            END
        )
    );
    
    -- If level up bonus was added, create separate transaction for it
    IF level_up_bonus > 0 THEN
        INSERT INTO public.xp_transactions (
            user_id, 
            xp_amount, 
            transaction_type, 
            description
        ) VALUES (
            add_user_xp.user_id,
            level_up_bonus,
            'level_bonus',
            'Level up bonus!'
        );
    END IF;
    
    -- Return result
    result := json_build_object(
        'success', true,
        'total_xp', new_total_xp,
        'current_level', new_level,
        'xp_to_next_level', xp_for_next_level,
        'level_up_bonus', level_up_bonus,
        'leveled_up', level_up_bonus > 0
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily streak
CREATE OR REPLACE FUNCTION public.update_daily_streak(user_id UUID)
RETURNS JSON AS $$
DECLARE
    current_streak INTEGER := 0;
    best_streak INTEGER := 0;
    last_activity DATE;
    today DATE := CURRENT_DATE;
    yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    result JSON;
BEGIN
    -- Get current streak data
    SELECT current_streak, best_streak, last_activity_date
    INTO current_streak, best_streak, last_activity
    FROM public.user_xp_progress 
    WHERE user_id = update_daily_streak.user_id;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_xp_progress (user_id, current_streak, best_streak, last_activity_date)
        VALUES (update_daily_streak.user_id, 1, 1, today);
        
        result := json_build_object('current_streak', 1, 'best_streak', 1, 'is_new_streak', true);
        RETURN result;
    END IF;
    
    -- Check if this is a new day
    IF last_activity = today THEN
        -- Already updated today, return current values
        result := json_build_object('current_streak', current_streak, 'best_streak', best_streak, 'is_new_streak', false);
        RETURN result;
    ELSIF last_activity = yesterday THEN
        -- Consecutive day, increment streak
        current_streak := current_streak + 1;
        best_streak := GREATEST(best_streak, current_streak);
    ELSE
        -- Streak broken, reset to 1
        current_streak := 1;
    END IF;
    
    -- Update the record
    UPDATE public.user_xp_progress 
    SET 
        current_streak = current_streak,
        best_streak = best_streak,
        last_activity_date = today,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = update_daily_streak.user_id;
    
    result := json_build_object(
        'current_streak', current_streak, 
        'best_streak', best_streak, 
        'is_new_streak', true
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.add_user_xp TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_streak TO authenticated;