-- AI Travel English RPG — Seed Data
-- Run AFTER schema.sql

-- =====================
-- SCENARIO 1: Restaurant
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Restaurant',
  'A bustling restaurant in New York City',
  'SARAH',
  'Friendly and energetic waitress who loves helping customers',
  '🍽️',
  1
);

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    1,
    'Good evening! Welcome to Bella Vista. Do you have a reservation, or are you just walking in?',
    'We don''t have a reservation. Table for ___, please.',
    ARRAY['table for', 'two', 'three', 'four', 'reservation', 'party'],
    'Good evening! Welcome to Bella Vista. Do you have a reservation, or are you just walking in?'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    2,
    'Perfect! Right this way. Can I start you off with something to drink?',
    'Could I have ___, please? And water for the table.',
    ARRAY['water', 'drink', 'juice', 'soda', 'wine', 'coffee', 'could i have', 'i would like'],
    'Perfect! Right this way. Can I start you off with something to drink?'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    3,
    'Great choices! Are you ready to order, or do you need a few more minutes?',
    'I''d like to order ___. And my friend will have ___.',
    ARRAY['order', 'like', 'have', 'i''d like', 'i will have', 'can i get'],
    'Great choices! Are you ready to order, or do you need a few more minutes?'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    4,
    'Excellent choices! Any special dietary requirements or allergies I should know about?',
    'I''m allergic to ___. Could you make sure there''s no ___ in my dish?',
    ARRAY['allergic', 'allergy', 'no', 'without', 'dairy', 'gluten', 'nuts', 'shellfish', 'none'],
    'Excellent choices! Any special dietary requirements or allergies I should know about?'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    5,
    'I hope you enjoyed your meal! Is there anything else I can get you?',
    'Could I have the check, please? We''ll ___ separately.',
    ARRAY['check', 'bill', 'pay', 'together', 'separately', 'could i have', 'can i get'],
    'I hope you enjoyed your meal! Is there anything else I can get you?'
  );

-- =====================
-- SCENARIO 2: Airport
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Airport Check-in',
  'JFK International Airport check-in counter',
  'MIKE',
  'Professional and efficient airline staff who ensures smooth check-in',
  '✈️',
  2
);

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    1,
    'Good morning! Welcome to SkyLine Airlines. How can I help you today?',
    'I''d like to check in for my flight to ___.',
    ARRAY['check in', 'flight', 'to', 'boarding pass'],
    'Good morning! Welcome to SkyLine Airlines. How can I help you today?'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    2,
    'Sure! May I have your passport and booking confirmation, please?',
    'Here''s my passport. My booking reference is ___.',
    ARRAY['passport', 'here', 'booking', 'reference', 'confirmation'],
    'Sure! May I have your passport and booking confirmation, please?'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    3,
    'Thank you. How many bags are you checking in today?',
    'I have ___ bag(s) to check. How much is the baggage allowance?',
    ARRAY['bag', 'bags', 'check', 'suitcase', 'allowance', 'one', 'two'],
    'Thank you. How many bags are you checking in today?'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    4,
    'Do you have a seat preference? Window or aisle?',
    '___ seat, please. If possible, near the ___.',
    ARRAY['window', 'aisle', 'seat', 'please', 'front', 'back', 'emergency exit'],
    'Do you have a seat preference? Window or aisle?'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    5,
    'All done! Your boarding pass is ready. Your flight departs from Gate B12.',
    'What time should I be at the gate? And is there a ___ lounge nearby?',
    ARRAY['gate', 'time', 'boarding', 'lounge', 'when', 'what time'],
    'All done! Your boarding pass is ready. Your flight departs from Gate B12.'
  );

-- =====================
-- SCENARIO 3: Hotel
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Hotel Check-in',
  'Manhattan luxury hotel front desk',
  'EMMA',
  'Elegant and attentive hotel concierge with impeccable service',
  '🏨',
  3
);

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    1,
    'Good afternoon and welcome to The Grand Manhattan. How may I assist you?',
    'I have a reservation. My name is ___.',
    ARRAY['reservation', 'name', 'check in', 'booked'],
    'Good afternoon and welcome to The Grand Manhattan. How may I assist you?'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    2,
    'I found your reservation. You''re booked for 3 nights. Could I have a credit card for incidentals?',
    'Sure, here you go. Also, could I get a room with ___?',
    ARRAY['room', 'view', 'quiet', 'high floor', 'city view', 'could i', 'upgrade'],
    'I found your reservation. You''re booked for 3 nights. Could I have a credit card for incidentals?'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    3,
    'You have a Deluxe King room on the 15th floor. Wonderful city views!',
    'That sounds great! Is breakfast ___? And what are the gym hours?',
    ARRAY['breakfast', 'included', 'gym', 'hours', 'pool', 'spa', 'wifi'],
    'You have a Deluxe King room on the 15th floor. Wonderful city views!'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    4,
    'Breakfast is included from 6:30 to 10:30 AM. The gym is open 24 hours. Anything else?',
    'What time is checkout? And can I request ___?',
    ARRAY['checkout', 'late checkout', 'extra', 'towels', 'pillows', 'time', 'extend'],
    'Breakfast is included from 6:30 to 10:30 AM. The gym is open 24 hours. Anything else?'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    5,
    'Checkout is at 11 AM. Late checkout may be available upon request. Enjoy your stay!',
    'Thank you so much! Could you also recommend a good ___ nearby?',
    ARRAY['recommend', 'restaurant', 'cafe', 'attraction', 'nearby', 'close', 'walking distance'],
    'Checkout is at 11 AM. Late checkout may be available upon request. Enjoy your stay!'
  );
