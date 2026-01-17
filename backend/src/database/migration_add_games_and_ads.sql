-- Migration: Add game types and ads tables
-- This migration adds support for multiple games and ad rewards system

-- Update game_sessions table to add game_type column
ALTER TABLE game_sessions
ADD COLUMN game_type ENUM('color_sort', 'bubble_shooter', 'rolling_ball') DEFAULT 'color_sort' AFTER session_token,
ADD INDEX idx_game_type (game_type);

-- Update game_scores table to add game_type column
ALTER TABLE game_scores
ADD COLUMN game_type ENUM('color_sort', 'bubble_shooter', 'rolling_ball') DEFAULT 'color_sort' AFTER difficulty,
ADD INDEX idx_game_type (game_type);

-- Create ad_rewards table
CREATE TABLE IF NOT EXISTS ad_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_type ENUM('coins', 'xp', 'points') NOT NULL,
    amount INT NOT NULL DEFAULT 0,
    ad_shown BOOLEAN DEFAULT TRUE,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_reward_type (reward_type),
    INDEX idx_watched_at (watched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_ad_stats table
CREATE TABLE IF NOT EXISTS user_ad_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_ads_watched INT NOT NULL DEFAULT 0,
    total_ads_skipped INT NOT NULL DEFAULT 0,
    total_coins_from_ads INT NOT NULL DEFAULT 0,
    total_xp_from_ads INT NOT NULL DEFAULT 0,
    last_ad_watched_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
