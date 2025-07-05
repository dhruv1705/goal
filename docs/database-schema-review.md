# Database Schema Review: Habit System

## Overview
This document provides a comprehensive review of the new habit/lesson system database schema designed for the Duolingo-style goal progression feature.

## Database Architecture

### Core Tables

#### 1. `skills` - Category Management
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ name            │ TEXT     │ Skill name (4 categories)          │
│ description     │ TEXT     │ Skill description                   │
│ icon            │ TEXT     │ Emoji icon                          │
│ color           │ TEXT     │ Hex color code                      │
│ order_index     │ INTEGER  │ Display order                       │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- name CHECK: Only allows 'Physical Health', 'Mental Health', 'Finance', 'Social'
- name UNIQUE: Each skill name is unique
```

#### 2. `goal_templates` - Goal Definitions
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ skill_id        │ UUID     │ Foreign key to skills               │
│ name            │ TEXT     │ Goal identifier (lose-weight)       │
│ title           │ TEXT     │ Display title                       │
│ description     │ TEXT     │ Goal description                    │
│ difficulty      │ TEXT     │ beginner/intermediate/advanced      │
│ estimated_duration│ TEXT   │ "8-12 weeks"                        │
│ total_levels    │ INTEGER  │ Number of progression levels (4)    │
│ benefits        │ TEXT[]   │ Array of benefits                   │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- skill_id REFERENCES skills(id) CASCADE
- difficulty CHECK: Only allows 'beginner', 'intermediate', 'advanced'
- UNIQUE(skill_id, name): Each goal name unique within skill
```

#### 3. `habit_templates` - Habit Definitions
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ goal_template_id│ UUID     │ Foreign key to goal_templates       │
│ title           │ TEXT     │ Habit title                         │
│ description     │ TEXT     │ Habit description                   │
│ level           │ INTEGER  │ Level (1-4)                         │
│ estimated_duration│ INTEGER│ Duration in minutes                 │
│ xp_reward       │ INTEGER  │ XP points earned                    │
│ habit_type      │ TEXT     │ foundation/building/power/mastery   │
│ instructions    │ TEXT     │ Step-by-step instructions           │
│ tips            │ TEXT     │ Helpful tips                        │
│ unlock_requirements│ JSONB │ Requirements to unlock              │
│ order_index     │ INTEGER  │ Order within level                  │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- goal_template_id REFERENCES goal_templates(id) CASCADE
- level CHECK: Only allows 1-4
- habit_type CHECK: Only allows 'foundation', 'building', 'power', 'mastery'
```

### User Progress Tables

#### 4. `user_active_goals` - User's Current Goals
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users           │
│ goal_template_id│ UUID     │ Foreign key to goal_templates       │
│ status          │ TEXT     │ active/paused/completed             │
│ current_level   │ INTEGER  │ Current unlocked level              │
│ start_date      │ DATE     │ Goal start date                     │
│ target_completion_date│ DATE│ Optional target date               │
│ completion_date │ DATE     │ Actual completion date              │
│ time_commitment │ TEXT     │ light/moderate/intensive            │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
│ updated_at      │ TIMESTAMP│ Last update timestamp               │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE
- goal_template_id REFERENCES goal_templates(id) CASCADE
- status CHECK: Only allows 'active', 'paused', 'completed'
- time_commitment CHECK: Only allows 'light', 'moderate', 'intensive'
- UNIQUE(user_id, goal_template_id): One instance per user per goal
```

#### 5. `user_habit_progress` - Individual Habit Progress
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users           │
│ user_active_goal_id│ UUID  │ Foreign key to user_active_goals    │
│ habit_template_id│ UUID    │ Foreign key to habit_templates      │
│ status          │ TEXT     │ locked/available/in_progress/completed│
│ completed_count │ INTEGER  │ Total completions                   │
│ best_streak     │ INTEGER  │ Best consecutive days               │
│ current_streak  │ INTEGER  │ Current consecutive days            │
│ total_xp_earned │ INTEGER  │ Total XP from this habit            │
│ last_completed_at│ TIMESTAMP│ Last completion timestamp          │
│ unlocked_at     │ TIMESTAMP│ When habit was unlocked             │
│ mastered_at     │ TIMESTAMP│ When habit was mastered             │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
│ updated_at      │ TIMESTAMP│ Last update timestamp               │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE
- user_active_goal_id REFERENCES user_active_goals(id) CASCADE
- habit_template_id REFERENCES habit_templates(id) CASCADE
- status CHECK: Only allows 'locked', 'available', 'in_progress', 'completed'
- UNIQUE(user_id, habit_template_id): One progress record per user per habit
```

#### 6. `user_xp_progress` - Overall XP and Level Tracking
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users (UNIQUE)  │
│ total_xp        │ INTEGER  │ Total XP accumulated                │
│ current_level   │ INTEGER  │ Current user level                  │
│ xp_to_next_level│ INTEGER  │ XP needed for next level            │
│ daily_xp_goal   │ INTEGER  │ Daily XP target                     │
│ current_streak  │ INTEGER  │ Current daily streak                │
│ best_streak     │ INTEGER  │ Best daily streak                   │
│ last_activity_date│ DATE   │ Last activity date                  │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
│ updated_at      │ TIMESTAMP│ Last update timestamp               │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE UNIQUE
- One record per user
```

### Activity Tracking Tables

#### 7. `habit_completions` - Daily Habit Completions
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users           │
│ habit_template_id│ UUID    │ Foreign key to habit_templates      │
│ user_habit_progress_id│ UUID│ Foreign key to user_habit_progress │
│ completion_date │ DATE     │ Date of completion                  │
│ xp_earned       │ INTEGER  │ XP earned for this completion       │
│ rating          │ INTEGER  │ User rating 1-3 (hard/okay/great)  │
│ notes           │ TEXT     │ Optional user notes                 │
│ completion_time │ INTEGER  │ Actual time spent (minutes)         │
│ created_at      │ TIMESTAMP│ Creation timestamp                  │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE
- habit_template_id REFERENCES habit_templates(id) CASCADE
- user_habit_progress_id REFERENCES user_habit_progress(id) CASCADE
- rating CHECK: Only allows 1-3
```

#### 8. `xp_transactions` - XP History
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users           │
│ habit_completion_id│ UUID  │ Foreign key to habit_completions    │
│ xp_amount       │ INTEGER  │ XP amount (positive)                │
│ transaction_type│ TEXT     │ Type of XP earning                  │
│ description     │ TEXT     │ Transaction description             │
│ created_at      │ TIMESTAMP│ Transaction timestamp               │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE
- habit_completion_id REFERENCES habit_completions(id) CASCADE
- transaction_type CHECK: 'habit_completion', 'streak_bonus', 'perfect_score', 'level_bonus', 'achievement_bonus'
```

#### 9. `user_achievements` - Achievement Tracking
```sql
┌─────────────────┬──────────┬─────────────────────────────────────┐
│ Column          │ Type     │ Description                         │
├─────────────────┼──────────┼─────────────────────────────────────┤
│ id              │ UUID     │ Primary key                         │
│ user_id         │ UUID     │ Foreign key to auth.users           │
│ achievement_id  │ TEXT     │ Achievement identifier              │
│ achievement_name│ TEXT     │ Display name                        │
│ achievement_description│ TEXT│ Achievement description           │
│ achievement_icon│ TEXT     │ Icon/emoji                          │
│ xp_reward       │ INTEGER  │ XP bonus for achievement            │
│ unlocked_at     │ TIMESTAMP│ When achievement was unlocked       │
└─────────────────┴──────────┴─────────────────────────────────────┘

Constraints:
- user_id REFERENCES auth.users(id) CASCADE
- UNIQUE(user_id, achievement_id): One achievement per user
```

## Relationships Diagram

```
skills (4 categories)
  │
  └── goal_templates (3 goals per skill)
        │
        └── habit_templates (16 habits per goal, 4 levels)

auth.users
  │
  ├── user_active_goals ────┐
  │     │                   │
  │     └── user_habit_progress
  │           │
  │           └── habit_completions
  │
  ├── user_xp_progress
  ├── xp_transactions  
  └── user_achievements
```

## Sample Data Flow

### 1. User Selects Goal
```sql
-- User selects "Lose Weight" goal
INSERT INTO user_active_goals (user_id, goal_template_id, time_commitment)
VALUES ('user-uuid', 'lose-weight-goal-uuid', 'moderate');

-- System creates habit progress records for all habits in goal
INSERT INTO user_habit_progress (user_id, user_active_goal_id, habit_template_id, status)
VALUES 
  ('user-uuid', 'active-goal-uuid', 'level-1-habit-1-uuid', 'available'),
  ('user-uuid', 'active-goal-uuid', 'level-1-habit-2-uuid', 'available'),
  ('user-uuid', 'active-goal-uuid', 'level-2-habit-1-uuid', 'locked'),
  -- ... etc for all habits
```

### 2. User Completes Habit
```sql
-- Record completion
INSERT INTO habit_completions (user_id, habit_template_id, xp_earned, rating)
VALUES ('user-uuid', 'morning-stretch-uuid', 10, 3);

-- Update progress
UPDATE user_habit_progress 
SET completed_count = completed_count + 1,
    current_streak = current_streak + 1,
    total_xp_earned = total_xp_earned + 10
WHERE user_id = 'user-uuid' AND habit_template_id = 'morning-stretch-uuid';

-- Record XP transaction
INSERT INTO xp_transactions (user_id, xp_amount, transaction_type)
VALUES ('user-uuid', 10, 'habit_completion');
```

### 3. Level Progression
```sql
-- Check if user can unlock next level (80% completion of current level)
-- If yes, update goal level and unlock next habits
UPDATE user_active_goals SET current_level = 2 WHERE id = 'active-goal-uuid';

UPDATE user_habit_progress 
SET status = 'available', unlocked_at = NOW()
WHERE user_active_goal_id = 'active-goal-uuid' 
  AND habit_template_id IN (SELECT id FROM habit_templates WHERE level = 2);
```

## Security & Performance

### Row Level Security (RLS)
- All user data tables have RLS enabled
- Users can only access their own data
- Template tables (skills, goal_templates, habit_templates) are readable by all authenticated users

### Indexes
- Primary keys on all tables
- Foreign key indexes for performance
- Date indexes for habit_completions queries
- User-specific indexes for efficient data retrieval

### Data Integrity
- Foreign key constraints ensure referential integrity
- Check constraints prevent invalid data
- Unique constraints prevent duplicates
- Cascade deletes handle cleanup

## Testing Recommendations

### 1. Data Insertion Test
Test creating a complete user journey:
1. Insert skills and templates
2. Create user active goal
3. Create habit progress records
4. Complete habits and track XP
5. Level progression and unlocks

### 2. Query Performance Test
Test common queries:
- Get today's available habits for user
- Calculate goal progress percentage
- Get user's achievement progress
- Daily XP tracking

### 3. Constraint Testing
Test data integrity:
- Invalid enum values
- Duplicate constraints
- Foreign key violations
- Cascade deletions

## Next Steps
1. Apply migrations to create tables
2. Insert seed data
3. Test with sample user data
4. Build TypeScript interfaces
5. Create context providers
6. Build UI components