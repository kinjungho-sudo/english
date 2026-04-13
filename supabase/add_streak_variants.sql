-- Migration: streak + npc_line_variants
-- Run in Supabase SQL Editor

-- 1. Streak columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_count    INT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- 2. NPC line variants on dialogue_steps
ALTER TABLE dialogue_steps
  ADD COLUMN IF NOT EXISTS npc_line_variants JSONB DEFAULT '[]';

-- 3. Populate variants for Restaurant scenario (SARAH)
UPDATE dialogue_steps SET npc_line_variants = '["Hi there! Just you today, or are you expecting someone?", "Good evening! Do you have a reservation with us?"]'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["What can I get started for you today?", "Can I take your order, or do you need another minute?"]'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["Any allergies or dietary needs I should know about?", "Do you have any food allergies or restrictions?"]'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 3;

UPDATE dialogue_steps SET npc_line_variants = '["How''s everything tasting so far?", "Is everything coming out alright for you?"]'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["I''ll bring that right over. Will you be paying together or separately?", "Absolutely! Cash or card today?"]'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 5;

-- 4. Variants for Airport (MIKE)
UPDATE dialogue_steps SET npc_line_variants = '["Good morning! Passport and booking reference, please.", "Hi, could I see your ID and reservation details?"]'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["Do you have a seat preference — window or aisle?", "Any preference on where you''d like to sit?"]'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["How many bags will you be checking today?", "Are you checking any luggage?"]'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 3;

-- 5. Variants for Café (LUCY)
UPDATE dialogue_steps SET npc_line_variants = '["Hey! What can I get started for you?", "Welcome in! What are you feeling today?"]'
WHERE scenario_id = '44444444-4444-4444-4444-444444444444' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["What size were you thinking?", "Did you want that in a small, medium, or large?"]'
WHERE scenario_id = '44444444-4444-4444-4444-444444444444' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["For here or to go?", "Will you be staying or taking it with you?"]'
WHERE scenario_id = '44444444-4444-4444-4444-444444444444' AND step_order = 3;

-- 6. Variants for Taxi (JAMES)
UPDATE dialogue_steps SET npc_line_variants = '["Where to?", "Hey! Where we headed?"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["Any particular route you prefer, or should I just take the highway?", "You want me to go the quick way, or you not in a rush?"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 2;
