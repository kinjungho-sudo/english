-- =============================================
-- 초급자용 대화 업데이트
-- Supabase Dashboard > SQL Editor 에서 실행
-- =============================================

-- SCENARIO 1: Restaurant (Sarah)
UPDATE dialogue_steps SET
  npc_line       = 'Hi there! Welcome! Table for how many people?',
  hint_template  = '몇 명인지 말해요 👉 "Table for two, please." / "Just one, thank you."',
  expected_keywords = ARRAY['table for','one','two','three','four','people','please','just'],
  tts_text       = 'Hi there! Welcome! Table for how many people?'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 1;

UPDATE dialogue_steps SET
  npc_line       = 'Here is your menu. What would you like to drink?',
  hint_template  = '마실 것을 주문해요 👉 "Water, please." / "Can I have a Coke?"',
  expected_keywords = ARRAY['water','please','can i have','coffee','juice','coke','tea','i would like','i''d like'],
  tts_text       = 'Here is your menu. What would you like to drink?'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 2;

UPDATE dialogue_steps SET
  npc_line       = 'Are you ready to order your food?',
  hint_template  = '음식을 주문해요 👉 "I''ll have the pasta." / "Can I get a burger, please?"',
  expected_keywords = ARRAY['i''ll have','can i get','i''d like','the','please','order','i want'],
  tts_text       = 'Are you ready to order your food?'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 3;

UPDATE dialogue_steps SET
  npc_line       = 'How is everything? Do you need anything?',
  hint_template  = '필요한 게 있으면 말해요 👉 "More water, please." / 괜찮으면 "Everything is great, thank you!"',
  expected_keywords = ARRAY['more','please','thank you','fine','great','good','water','everything','okay'],
  tts_text       = 'How is everything? Do you need anything?'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 4;

UPDATE dialogue_steps SET
  npc_line       = 'I hope you enjoyed your meal! Can I get you anything else?',
  hint_template  = '계산서를 요청해요 👉 "Check, please." / "Can I have the bill?"',
  expected_keywords = ARRAY['check','bill','please','can i have','that''s all','nothing else','just the check'],
  tts_text       = 'I hope you enjoyed your meal! Can I get you anything else?'
WHERE scenario_id = '11111111-1111-1111-1111-111111111111' AND step_order = 5;

-- SCENARIO 2: Airport (Mike)
UPDATE dialogue_steps SET
  npc_line       = 'Good morning! How can I help you today?',
  hint_template  = '체크인하러 왔다고 말해요 👉 "I''d like to check in, please."',
  expected_keywords = ARRAY['check in','please','flight','i''d like','i want','check'],
  tts_text       = 'Good morning! How can I help you today?'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 1;

UPDATE dialogue_steps SET
  npc_line       = 'Sure! Can I see your passport, please?',
  hint_template  = '여권을 건네며 말해요 👉 "Here you go." / "Here it is."',
  expected_keywords = ARRAY['here','you go','here it is','sure','yes','of course'],
  tts_text       = 'Sure! Can I see your passport, please?'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 2;

UPDATE dialogue_steps SET
  npc_line       = 'Do you have any bags to check?',
  hint_template  = '짐 개수를 말해요 👉 "One bag, please." / 짐 없으면 "No bags, just carry-on."',
  expected_keywords = ARRAY['one','two','bag','bags','carry-on','no bags','just','please'],
  tts_text       = 'Do you have any bags to check?'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 3;

UPDATE dialogue_steps SET
  npc_line       = 'Window or aisle seat — which do you prefer?',
  hint_template  = '좌석을 선택해요 👉 "Window seat, please." / "Aisle, please." / "Either is fine."',
  expected_keywords = ARRAY['window','aisle','please','seat','either','fine','no preference'],
  tts_text       = 'Window or aisle seat — which do you prefer?'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 4;

UPDATE dialogue_steps SET
  npc_line       = 'All set! Here is your boarding pass. Have a great flight!',
  hint_template  = '감사 인사를 해요 👉 "Thank you so much!" / 게이트 물어보기 "Which gate is it?"',
  expected_keywords = ARRAY['thank you','thanks','gate','which','when','boarding','great','appreciate'],
  tts_text       = 'All set! Here is your boarding pass. Have a great flight!'
WHERE scenario_id = '22222222-2222-2222-2222-222222222222' AND step_order = 5;

-- SCENARIO 3: Hotel (Emma)
UPDATE dialogue_steps SET
  npc_line       = 'Good afternoon! Welcome! Do you have a reservation?',
  hint_template  = '예약이 있다고 말해요 👉 "Yes, I have a reservation." / 이름 말하기 "Under [이름]."',
  expected_keywords = ARRAY['yes','reservation','have','name','under','booked'],
  tts_text       = 'Good afternoon! Welcome! Do you have a reservation?'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 1;

UPDATE dialogue_steps SET
  npc_line       = 'What name is the reservation under?',
  hint_template  = '이름을 말해요 👉 "My name is ___." / 짧게 "It''s ___."',
  expected_keywords = ARRAY['my name is','name','it''s','under','reservation'],
  tts_text       = 'What name is the reservation under?'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 2;

UPDATE dialogue_steps SET
  npc_line       = 'Here is your key card. Your room is on the 3rd floor. The elevator is over there.',
  hint_template  = '감사하거나 질문해요 👉 "Thank you!" / 와이파이 "What is the wifi password?"',
  expected_keywords = ARRAY['thank you','thanks','where','elevator','wifi','breakfast','great','wonderful'],
  tts_text       = 'Here is your key card. Your room is on the 3rd floor. The elevator is over there.'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 3;

UPDATE dialogue_steps SET
  npc_line       = 'Is there anything else I can help you with?',
  hint_template  = '필요한 것을 물어봐요 👉 "What time is breakfast?" / "What is the wifi password?"',
  expected_keywords = ARRAY['wifi','password','breakfast','time','checkout','pool','gym','what','when'],
  tts_text       = 'Is there anything else I can help you with?'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 4;

UPDATE dialogue_steps SET
  npc_line       = 'Breakfast is from 7 to 10 AM. Enjoy your stay!',
  hint_template  = '마무리 인사를 해요 👉 "Thank you so much!" / "Have a great day!"',
  expected_keywords = ARRAY['thank you','thanks','great','wonderful','appreciate','good','bye'],
  tts_text       = 'Breakfast is from 7 to 10 AM. Enjoy your stay!'
WHERE scenario_id = '33333333-3333-3333-3333-333333333333' AND step_order = 5;