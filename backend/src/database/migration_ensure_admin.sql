-- Migration to ensure an admin user exists
USE hypercasual_game;

INSERT INTO users (username, email, password_hash, is_guest, is_admin)
SELECT 'admin', 'admin@example.com', '$2b$10$2bDGadCe6KwAxF1FgIYwlOEZco9CRYxU882IWh1y5Zo5TdE2f7svS', FALSE, TRUE
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE is_admin = TRUE OR username = 'admin');

-- Also ensure the admin has a level entry
INSERT INTO user_levels (user_id, current_level, stars_earned, total_xp)
SELECT id, 1, 0, 0
FROM users
WHERE username = 'admin' AND id NOT IN (SELECT user_id FROM user_levels);

-- And a streak entry
INSERT INTO user_streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0
FROM users
WHERE username = 'admin' AND id NOT IN (SELECT user_id FROM user_streaks);
