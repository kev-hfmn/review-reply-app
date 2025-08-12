-- Mock Data for Flowrise Reviews
-- Execute this after the main schema to populate with sample data
-- Replace 'YOUR_USER_ID' with your actual auth.users.id

-- First, let's assume we have a test user. You'll need to replace this with your actual user ID
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- REPLACE THIS WITH YOUR ACTUAL USER ID FROM auth.users table
-- Example: SET @user_id = '12345678-1234-1234-1234-123456789abc';

-- 1. Insert sample businesses (you'll need to replace the user_id with actual values)
INSERT INTO businesses (id, user_id, name, location, industry, created_at) VALUES
('a1b2c3d4-1234-5678-9abc-def012345678', '9c6d0dc9-8853-4656-8b2b-d2dc88e2df49', 'Bella Vista Restaurant', 'San Francisco, CA', 'Restaurant', NOW() - INTERVAL '30 days'),
('b2c3d4e5-2345-6789-abcd-ef0123456789', '9c6d0dc9-8853-4656-8b2b-d2dc88e2df49', 'Downtown Dental Care', 'Portland, OR', 'Healthcare', NOW() - INTERVAL '45 days');

-- Business settings will be auto-created by the trigger, but let's update them with some preferences
UPDATE business_settings
SET brand_voice_preset = 'friendly',
    formality_level = 6,
    warmth_level = 8,
    approval_mode = 'auto_4_plus'
WHERE business_id = 'a1b2c3d4-1234-5678-9abc-def012345678';

UPDATE business_settings
SET brand_voice_preset = 'professional',
    formality_level = 8,
    warmth_level = 6,
    approval_mode = 'manual'
WHERE business_id = 'b2c3d4e5-2345-6789-abcd-ef0123456789';

-- 2. Insert sample reviews for Bella Vista Restaurant
INSERT INTO reviews (id, business_id, google_review_id, customer_name, rating, review_text, review_date, status, ai_reply, final_reply, created_at) VALUES

-- Recent reviews (last 7 days) - mostly high ratings
('c1d2e3f4-1234-5678-9abc-def012345678', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_001', 'Sarah Johnson', 5, 'Amazing pasta! The service was excellent and the atmosphere was perfect for our anniversary dinner. Will definitely be back!', NOW() - INTERVAL '2 days', 'posted',
'Thank you so much for choosing Bella Vista for your special anniversary dinner, Sarah! We''re thrilled that our pasta impressed you and that our team provided excellent service. We can''t wait to welcome you back for another memorable evening! 🍝✨',
'Thank you so much for choosing Bella Vista for your special anniversary dinner, Sarah! We''re thrilled that our pasta impressed you and that our team provided excellent service. We can''t wait to welcome you back for another memorable evening! 🍝✨',
NOW() - INTERVAL '2 days'),

('d2e3f4a5-2345-6789-abcd-ef0123456789', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_002', 'Mike Chen', 4, 'Great food and good service. The tiramisu was outstanding. Only complaint is that it was quite noisy during dinner rush.', NOW() - INTERVAL '3 days', 'approved',
'Hi Mike! We''re so glad you enjoyed our food and that our tiramisu was a hit - it''s one of our chef''s specialties! Thank you for the feedback about the noise level. We''re always looking for ways to improve the dining experience and will discuss this with our team.',
NULL, NOW() - INTERVAL '3 days'),

('e3f4a5b6-3456-789a-bcde-f01234567890', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_003', 'Emily Rodriguez', 5, 'Absolutely loved everything! The risotto was creamy perfection and our server Maria was so attentive. Best Italian in the city!', NOW() - INTERVAL '4 days', 'pending',
'Emily, what a wonderful review! We''re so happy you loved our risotto - it''s made fresh daily with authentic Italian techniques. Maria will be delighted to hear your kind words. Thank you for calling us the best Italian in the city - that truly means the world to us!',
NULL, NOW() - INTERVAL '4 days'),

('f4a5b6c7-4567-89ab-cdef-012345678901', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_004', 'James Wilson', 3, 'Food was decent but service was slow. Waited 20 minutes just to order. The pasta was good once it arrived.', NOW() - INTERVAL '5 days', 'needs_edit',
'Thank you for your feedback, James. We apologize for the slow service during your visit. We''ve discussed this with our team to ensure better timing. We''re glad you enjoyed the pasta and hope to provide you with a much better experience next time!',
NULL, NOW() - INTERVAL '5 days'),

('a5b6c7d8-5678-9abc-def0-123456789012', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_005', 'Lisa Park', 5, 'Fantastic date night spot! The wine selection is impressive and the ambiance is romantic. Thank you for a perfect evening!', NOW() - INTERVAL '6 days', 'posted',
'Lisa, we''re so thrilled that Bella Vista was the perfect setting for your date night! Our sommelier takes great pride in our wine selection. Thank you for trusting us with your special evening - we hope to see you again soon!',
'Lisa, we''re so thrilled that Bella Vista was the perfect setting for your date night! Our sommelier takes great pride in our wine selection. Thank you for trusting us with your special evening - we hope to see you again soon!',
NOW() - INTERVAL '6 days'),

-- Older reviews (this month)
('b6c7d8e9-6789-abcd-ef01-234567890123', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_006', 'Robert Thompson', 2, 'Very disappointed. The chicken was dry and my wife''s fish was overcooked. For $80 for two people, we expected much better quality.', NOW() - INTERVAL '12 days', 'needs_edit',
'Robert, we sincerely apologize for the disappointing experience. This is not the quality we strive for at Bella Vista. Please contact us directly so we can make this right and ensure this doesn''t happen again. Your feedback is valuable to us.',
NULL, NOW() - INTERVAL '12 days'),

('c7d8e9fa-789a-bcde-f012-34567890123a', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_007', 'Amanda Lee', 4, 'Love the cozy atmosphere and the staff is always friendly. The pizza was delicious! Just wish you had more vegetarian options.', NOW() - INTERVAL '18 days', 'posted',
'Thank you Amanda! We''re so glad you love our cozy atmosphere and friendly staff. Great suggestion about more vegetarian options - we''re actually working on expanding our vegetarian menu. Stay tuned!',
'Thank you Amanda! We''re so glad you love our cozy atmosphere and friendly staff. Great suggestion about more vegetarian options - we''re actually working on expanding our vegetarian menu. Stay tuned!',
NOW() - INTERVAL '18 days'),

('d8e9fab1-89ab-cdef-0123-4567890123ab', 'a1b2c3d4-1234-5678-9abc-def012345678', 'google_rev_008', 'David Kim', 5, 'Excellent service from start to finish. The gnocchi was incredible and the chocolate cake was to die for. Highly recommend!', NOW() - INTERVAL '25 days', 'posted',
'David, thank you for such a glowing review! Our chef will be so pleased to hear you loved the gnocchi - it''s made fresh in-house daily. And yes, that chocolate cake is pretty special! We appreciate the recommendation and look forward to your next visit.',
'David, thank you for such a glowing review! Our chef will be so pleased to hear you loved the gnocchi - it''s made fresh in-house daily. And yes, that chocolate cake is pretty special! We appreciate the recommendation and look forward to your next visit.',
NOW() - INTERVAL '25 days');

-- 3. Insert sample reviews for Downtown Dental Care
INSERT INTO reviews (id, business_id, google_review_id, customer_name, rating, review_text, review_date, status, ai_reply, final_reply, created_at) VALUES

('e9fab123-9abc-def0-1234-56789012abc3', 'b2c3d4e5-2345-6789-abcd-ef0123456789', 'google_rev_101', 'Jennifer Martinez', 5, 'Dr. Smith and his team are amazing! Very gentle and thorough. The office is clean and modern. Best dental experience I''ve ever had.', NOW() - INTERVAL '1 day', 'pending',
'Thank you for your wonderful review, Jennifer! Dr. Smith and our entire team take great pride in providing gentle, thorough care. We''re delighted that you had such a positive experience and look forward to continuing to serve your dental needs.',
NULL, NOW() - INTERVAL '1 day'),

('f0123456-abcd-ef01-2345-6789abcdef01', 'b2c3d4e5-2345-6789-abcd-ef0123456789', 'google_rev_102', 'Mark Anderson', 4, 'Great cleaning and checkup. Staff was professional and friendly. Only downside was the wait time, but overall satisfied.', NOW() - INTERVAL '8 days', 'approved',
'Thank you for your feedback, Mark. We''re pleased you were satisfied with your cleaning and checkup, and that you found our staff professional and friendly. We apologize for the wait time and are working to improve our scheduling efficiency.',
NULL, NOW() - INTERVAL '8 days'),

('a123456b-cdef-0123-4567-89abcdef0123', 'b2c3d4e5-2345-6789-abcd-ef0123456789', 'google_rev_103', 'Carol White', 5, 'Outstanding root canal treatment! I was nervous but Dr. Smith explained everything and made me feel comfortable. Highly recommend this practice.', NOW() - INTERVAL '15 days', 'posted',
'Carol, we''re so grateful for your kind words! Dr. Smith believes in clear communication and patient comfort, especially for procedures like root canals. Thank you for recommending our practice - it means so much to our team.',
'Carol, we''re so grateful for your kind words! Dr. Smith believes in clear communication and patient comfort, especially for procedures like root canals. Thank you for recommending our practice - it means so much to our team.',
NOW() - INTERVAL '15 days'),

('b23456cd-ef01-2345-6789-abcdef012345', 'b2c3d4e5-2345-6789-abcd-ef0123456789', 'google_rev_104', 'Steve Johnson', 1, 'Terrible experience. Waited 45 minutes past my appointment time and then felt rushed during the actual cleaning. Very unprofessional.', NOW() - INTERVAL '20 days', 'needs_edit',
'Steve, we sincerely apologize for the long wait time and the rushed feeling during your appointment. This is not the standard of care we strive for. Please contact our office manager so we can address these concerns and improve your future experiences.',
NULL, NOW() - INTERVAL '20 days');

-- 4. Insert sample activities
INSERT INTO activities (business_id, type, description, metadata, created_at) VALUES

-- Bella Vista activities
('a1b2c3d4-1234-5678-9abc-def012345678', 'review_received', 'New 5-star review from Sarah Johnson', '{"review_id": "c1d2e3f4-1234-5678-9abc-def012345678", "rating": 5}', NOW() - INTERVAL '2 days'),
('a1b2c3d4-1234-5678-9abc-def012345678', 'reply_posted', 'Reply posted to Sarah Johnson''s review', '{"review_id": "c1d2e3f4-1234-5678-9abc-def012345678"}', NOW() - INTERVAL '2 days'),
('a1b2c3d4-1234-5678-9abc-def012345678', 'review_received', 'New 4-star review from Mike Chen', '{"review_id": "d2e3f4a5-2345-6789-abcd-ef0123456789", "rating": 4}', NOW() - INTERVAL '3 days'),
('a1b2c3d4-1234-5678-9abc-def012345678', 'reply_approved', 'Reply approved for Mike Chen''s review', '{"review_id": "d2e3f4a5-2345-6789-abcd-ef0123456789"}', NOW() - INTERVAL '3 days'),
('a1b2c3d4-1234-5678-9abc-def012345678', 'review_received', 'New 5-star review from Emily Rodriguez', '{"review_id": "e3f4a5b6-3456-789a-bcde-f01234567890", "rating": 5}', NOW() - INTERVAL '4 days'),

-- Dental activities
('b2c3d4e5-2345-6789-abcd-ef0123456789', 'review_received', 'New 5-star review from Jennifer Martinez', '{"review_id": "e9fab123-9abc-def0-1234-56789012abc3", "rating": 5}', NOW() - INTERVAL '1 day'),
('b2c3d4e5-2345-6789-abcd-ef0123456789', 'review_received', 'New 4-star review from Mark Anderson', '{"review_id": "f0123456-abcd-ef01-2345-6789abcdef01", "rating": 4}', NOW() - INTERVAL '8 days'),
('b2c3d4e5-2345-6789-abcd-ef0123456789', 'settings_updated', 'Updated brand voice settings', '{"changes": ["approval_mode", "formality_level"]}', NOW() - INTERVAL '10 days');

-- 5. Insert sample weekly digest for last week
INSERT INTO weekly_digests (business_id, week_start, week_end, total_reviews, rating_breakdown, positive_themes, improvement_themes, highlights, generated_at) VALUES

-- Bella Vista last week digest
('a1b2c3d4-1234-5678-9abc-def012345678',
 DATE_TRUNC('week', NOW() - INTERVAL '7 days'),
 DATE_TRUNC('week', NOW() - INTERVAL '7 days') + INTERVAL '6 days',
 5,
 '{"1": 0, "2": 1, "3": 1, "4": 1, "5": 2}',
 ARRAY['excellent service', 'amazing pasta', 'great atmosphere', 'outstanding tiramisu', 'romantic ambiance', 'impressive wine selection'],
 ARRAY['noise level during rush', 'slow service timing', 'expand vegetarian options'],
 '[
   {"type": "best_review", "customer": "Sarah Johnson", "rating": 5, "snippet": "Amazing pasta! The service was excellent..."},
   {"type": "improvement_opportunity", "customer": "James Wilson", "rating": 3, "snippet": "Food was decent but service was slow..."}
 ]',
 NOW() - INTERVAL '1 day'),

-- Downtown Dental last week digest
('b2c3d4e5-2345-6789-abcd-ef0123456789',
 DATE_TRUNC('week', NOW() - INTERVAL '7 days'),
 DATE_TRUNC('week', NOW() - INTERVAL '7 days') + INTERVAL '6 days',
 3,
 '{"1": 1, "2": 0, "3": 0, "4": 1, "5": 1}',
 ARRAY['professional staff', 'gentle care', 'modern office', 'clear communication', 'comfortable experience'],
 ARRAY['wait times', 'appointment scheduling', 'rushed feeling'],
 '[
   {"type": "best_review", "customer": "Jennifer Martinez", "rating": 5, "snippet": "Dr. Smith and his team are amazing! Very gentle..."},
   {"type": "concern", "customer": "Steve Johnson", "rating": 1, "snippet": "Waited 45 minutes past appointment time..."}
 ]',
 NOW() - INTERVAL '1 day');
