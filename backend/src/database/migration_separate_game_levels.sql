-- Migration: Add per-game levels
-- This migration adds support for tracking levels separately for each game

CREATE TABLE IF NOT EXISTS user_game_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    game_type ENUM('color_sort', 'bubble_shooter', 'rolling_ball') NOT NULL,
    current_level INT NOT NULL DEFAULT 1,
    stars_earned INT NOT NULL DEFAULT 0,
    total_xp INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game (user_id, game_type),
    INDEX idx_game_type (game_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
