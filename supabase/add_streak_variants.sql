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

-- 6. Variants for Airport steps 4-5 (MIKE)
UPDATE dialogue_steps SET npc_line_variants = '["Window or aisle — any preference?", "I can grab you a window seat if you''d like, or would an aisle be better?"]'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["Here''s your boarding pass! Gate B12, boarding at 9:40 AM.", "You''re all set! Boarding pass printed — Gate B12. Safe travels!"]'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 5;

-- 7. Variants for Café steps 4-5 (LUCY)
UPDATE dialogue_steps SET npc_line_variants = '["Can I grab a name for the cup?", "What name should I put on the order?"]'
WHERE scenario_id = '44444444-4444-4444-4444-444444444444' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["That comes to $6.50 — cash or card?", "Your total is $6.50. How would you like to pay?"]'
WHERE scenario_id = '44444444-4444-4444-4444-444444444444' AND step_order = 5;

-- 8. Variants for Taxi (JAMES)
UPDATE dialogue_steps SET npc_line_variants = '["Where to?", "Hey! Where we headed?"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["Any particular route you prefer, or should I just take the highway?", "You want me to go the quick way, or you not in a rush?"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["Alright, jumping on the highway now!", "No problem, hopping on the expressway!"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 3;

UPDATE dialogue_steps SET npc_line_variants = '["Here you go! That''ll be $22.50.", "We made it! The fare''s $22.50."]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["Want a receipt for that?", "Can I print you a receipt?"]'
WHERE scenario_id = '55555555-5555-5555-5555-555555555555' AND step_order = 5;

-- 9. Variants for Hotel (EMMA) all steps
UPDATE dialogue_steps SET npc_line_variants = '["Welcome to The Grand Manhattan! Do you have a reservation with us today?", "Good afternoon! Checking in today? I''d be happy to help."]'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["Perfect, I have your booking right here. Could I take a credit card to hold on file?", "Great news — your reservation is confirmed! May I swipe a card for incidentals?"]'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["You''re in a Deluxe King on the 15th floor — gorgeous city views from up there!", "I''ve assigned you a King room on 15 with a lovely view of the skyline."]'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 3;

UPDATE dialogue_steps SET npc_line_variants = '["Breakfast runs 6:30 to 10:30, and our fitness center is open around the clock. Anything else I can arrange?", "The gym never closes and breakfast starts at 6:30 AM. Is there anything else you''d like to know?"]'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["Checkout is at 11 AM — just let us know if you''d like to extend. Enjoy your stay!", "Standard checkout is 11 AM; late checkout is available upon request. We hope you love your stay!"]'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 5;

-- 10. Variants for Shopping (KATE) all steps
UPDATE dialogue_steps SET npc_line_variants = '["Hey, welcome in! Looking for anything in particular today?", "Hi there! Let me know if you need help finding anything!"]'
WHERE scenario_id = '66666666-6666-6666-6666-666666666666' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["Do you know your size, or would you like help figuring it out?", "What size do you usually go for?"]'
WHERE scenario_id = '66666666-6666-6666-6666-666666666666' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["We''ve got it in black, white, and navy — do any of those work for you?", "It comes in three colors: black, white, and navy. Got a preference?"]'
WHERE scenario_id = '66666666-6666-6666-6666-666666666666' AND step_order = 3;

UPDATE dialogue_steps SET npc_line_variants = '["Great pick! Feel free to use one of the fitting rooms in the back.", "Want to try that on? Fitting rooms are just around the corner."]'
WHERE scenario_id = '66666666-6666-6666-6666-666666666666' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["How''d it fit? Are you going to grab it?", "Did it work out? Ready to take it home?"]'
WHERE scenario_id = '66666666-6666-6666-6666-666666666666' AND step_order = 5;

-- 11. Variants for Pharmacy (CHEN) all steps
UPDATE dialogue_steps SET npc_line_variants = '["Hi there! What can I help you with today?", "Good afternoon! What brings you in today?"]'
WHERE scenario_id = '77777777-7777-7777-7777-777777777777' AND step_order = 1;

UPDATE dialogue_steps SET npc_line_variants = '["How long have those symptoms been going on?", "When did this start for you?"]'
WHERE scenario_id = '77777777-7777-7777-7777-777777777777' AND step_order = 2;

UPDATE dialogue_steps SET npc_line_variants = '["Are you taking any other medications at the moment?", "Is there anything else you''re currently on — prescriptions, supplements?"]'
WHERE scenario_id = '77777777-7777-7777-7777-777777777777' AND step_order = 3;

UPDATE dialogue_steps SET npc_line_variants = '["I''d suggest this ibuprofen — one tablet every 8 hours with food. Does that sound okay?", "This ibuprofen should do the trick. One tablet every 8 hours with a meal. All good?"]'
WHERE scenario_id = '77777777-7777-7777-7777-777777777777' AND step_order = 4;

UPDATE dialogue_steps SET npc_line_variants = '["That''s $9.99. Is there anything else I can do for you?", "Your total comes to $9.99. Anything else you need today?"]'
WHERE scenario_id = '77777777-7777-7777-7777-777777777777' AND step_order = 5;
