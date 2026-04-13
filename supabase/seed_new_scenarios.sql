-- =============================================
-- 신규 시나리오 4개 추가
-- Supabase Dashboard > SQL Editor 에서 실행
-- =============================================

-- =====================
-- SCENARIO 4: Café
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Café Order',
  'A cozy café in Seattle',
  'LUCY',
  'Cheerful barista who loves helping customers pick the perfect drink',
  '☕',
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '44444444-4444-4444-4444-444444444444', 1,
    'Hi there! Welcome in! What can I get started for you today?',
    '음료를 주문해요 👉 "Can I have a latte, please?" / "I''d like a coffee."',
    ARRAY['can i have','i''d like','i want','latte','coffee','americano','cappuccino','tea','please'],
    'Hi there! Welcome in! What can I get started for you today?'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 2,
    'Great choice! What size? Small, medium, or large?',
    '사이즈를 말해요 👉 "Medium, please." / "Large, please."',
    ARRAY['small','medium','large','please','size'],
    'Great choice! What size? Small, medium, or large?'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 3,
    'And would you like that hot or iced?',
    '온도를 선택해요 👉 "Iced, please." / "Hot, please."',
    ARRAY['hot','iced','cold','please','warm'],
    'And would you like that hot or iced?'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 4,
    'Perfect! Can I get a name for the order?',
    '이름을 알려줘요 👉 "It''s Chris." / "My name is Chris."',
    ARRAY['it''s','my name is','name','i''m','the name is'],
    'Perfect! Can I get a name for the order?'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 5,
    'That''ll be $6.50. Cash or card today?',
    '결제 방법을 말해요 👉 "Card, please." / "I''ll pay by card."',
    ARRAY['card','cash','please','pay','credit','debit','by card'],
    'That''ll be $6.50. Cash or card today?'
  );

-- =====================
-- SCENARIO 5: Taxi
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Taxi Ride',
  'New York City street',
  'JAMES',
  'Friendly and chatty taxi driver who knows the city inside out',
  '🚕',
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '55555555-5555-5555-5555-555555555555', 1,
    'Hey! Where you headed?',
    '목적지를 말해요 👉 "To Times Square, please." / "Can you take me to JFK Airport?"',
    ARRAY['to','please','take me','airport','times square','downtown','hotel','station','can you'],
    'Hey! Where you headed?'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 2,
    'Got it! Traffic''s a little heavy right now. Do you need to be there by a certain time?',
    '도착 시간을 말해요 👉 "I need to be there by 3." / "I have a flight at 5."',
    ARRAY['by','need','flight','time','o''clock','pm','am','at','before','hurry','asap','no rush'],
    'Got it! Traffic''s a little heavy right now. Do you need to be there by a certain time?'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 3,
    'I can take the highway — it''s a bit faster. That okay with you?',
    '동의하면 👉 "Sure, that works." / "Yes, please take the fastest route."',
    ARRAY['sure','okay','fine','yes','that works','go ahead','of course','no problem','fastest','highway'],
    'I can take the highway — it''s a bit faster. That okay with you?'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 4,
    'Here we are! That''s $22.50.',
    '요금을 내요 👉 "Here''s $25. Keep the change." / "Can I pay by card?"',
    ARRAY['here','keep','change','card','cash','pay','thank you','thanks'],
    'Here we are! That''s $22.50.'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 5,
    'Thank you! Do you need a receipt?',
    '영수증 여부를 말해요 👉 "Yes, please." / "No, thank you."',
    ARRAY['yes','please','no','thank you','thanks','receipt','need','want'],
    'Thank you! Do you need a receipt?'
  );

-- =====================
-- SCENARIO 6: Shopping
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Shopping',
  'A department store in New York',
  'KATE',
  'Helpful and upbeat store clerk who loves fashion',
  '🛍️',
  6
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '66666666-6666-6666-6666-666666666666', 1,
    'Hi! Welcome! Can I help you find something today?',
    '찾는 것을 말해요 👉 "I''m looking for a jacket." / "Do you have any sneakers?"',
    ARRAY['looking for','need','want','do you have','jacket','shirt','pants','shoes','sneakers','dress','i''m looking'],
    'Hi! Welcome! Can I help you find something today?'
  ),
  (
    '66666666-6666-6666-6666-666666666666', 2,
    'Of course! What size are you?',
    '사이즈를 말해요 👉 "I''m a medium." / "I wear a size 10."',
    ARRAY['small','medium','large','xl','size','i''m a','i wear','i take','about'],
    'Of course! What size are you?'
  ),
  (
    '66666666-6666-6666-6666-666666666666', 3,
    'We have this in black, white, and navy. Any preference?',
    '색상을 골라요 👉 "I''ll take the black one." / "Do you have it in blue?"',
    ARRAY['black','white','navy','blue','red','color','one','that one','i''ll take','prefer','like'],
    'We have this in black, white, and navy. Any preference?'
  ),
  (
    '66666666-6666-6666-6666-666666666666', 4,
    'Nice choice! Would you like to try it on? The fitting rooms are in the back.',
    '피팅룸을 이용해요 👉 "Yes, please." / "Sure, I''d like to try it on."',
    ARRAY['yes','please','sure','try','fitting room','on','i''d like','that would be','great'],
    'Nice choice! Would you like to try it on? The fitting rooms are in the back.'
  ),
  (
    '66666666-6666-6666-6666-666666666666', 5,
    'How was the fit? Are you going to take it?',
    '구매 의사를 말해요 👉 "I''ll take it! How much is it?" / "It fits great. I''ll buy it."',
    ARRAY['take it','buy','i''ll','how much','price','fits','great','perfect','yes','purchase'],
    'How was the fit? Are you going to take it?'
  );

-- =====================
-- SCENARIO 7: Pharmacy
-- =====================
INSERT INTO scenarios (id, name, location, npc_name, npc_personality, thumbnail, order_index)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'Pharmacy',
  'A pharmacy in San Francisco',
  'CHEN',
  'Knowledgeable and caring pharmacist who takes time to help every customer',
  '💊',
  7
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogue_steps (scenario_id, step_order, npc_line, hint_template, expected_keywords, tts_text)
VALUES
  (
    '77777777-7777-7777-7777-777777777777', 1,
    'Hello! How can I help you today?',
    '증상을 설명해요 👉 "I have a headache." / "I need something for a cold."',
    ARRAY['headache','cold','fever','cough','pain','stomachache','sore throat','i have','i need','something for'],
    'Hello! How can I help you today?'
  ),
  (
    '77777777-7777-7777-7777-777777777777', 2,
    'I see. How long have you had these symptoms?',
    '기간을 말해요 👉 "Since this morning." / "For about two days."',
    ARRAY['since','morning','yesterday','days','hours','today','a few','for about','started'],
    'I see. How long have you had these symptoms?'
  ),
  (
    '77777777-7777-7777-7777-777777777777', 3,
    'Are you currently taking any other medications?',
    '복용 중인 약 여부를 말해요 👉 "No, I''m not taking anything." / "Just vitamins."',
    ARRAY['no','not','nothing','none','just','vitamins','only','taking','medication','anything'],
    'Are you currently taking any other medications?'
  ),
  (
    '77777777-7777-7777-7777-777777777777', 4,
    'I recommend this ibuprofen. Take one tablet every 8 hours with food. Does that work for you?',
    '이해했다고 말해요 👉 "Yes, that works." / "Okay, thank you. How much is it?"',
    ARRAY['yes','okay','sure','thank you','how much','price','cost','that works','understand','fine'],
    'I recommend this ibuprofen. Take one tablet every 8 hours with food. Does that work for you?'
  ),
  (
    '77777777-7777-7777-7777-777777777777', 5,
    'It''s $9.99. Is there anything else I can help you with today?',
    '마무리해요 👉 "No, that''s all. Thank you!" / "That''s everything, thanks."',
    ARRAY['no','that''s all','everything','thanks','thank you','nothing else','that''s it','all good'],
    'It''s $9.99. Is there anything else I can help you with today?'
  );
