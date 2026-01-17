# Games Documentation

## Overview
The platform now includes three exciting hyper-casual games:
1. **Color Sort** - Strategy puzzle game
2. **Bubble Shooter** - Classic bubble matching game
3. **Rolling Ball** - Physics-based platformer

## Game Types

### Color Sort 🎨
Sort colored water into matching tubes to complete levels.

**Features:**
- 3-8 colors based on difficulty
- 4 slots per tube
- Move counter
- Points earned per successful move
- Levels with increasing complexity

**Controls:**
- Click a tube to select it
- Click another tube to pour water
- Water only moves if the target tube has space and matching colors

**Scoring:**
- Easy: 3 colors (12 tubes)
- Medium: 5 colors (20 tubes)
- Hard: 7 colors (28 tubes)
- Expert: 8 colors (32 tubes)

### Bubble Shooter 🫧
Shoot colored bubbles to match 3 or more of the same color and pop them.

**Features:**
- Aim with mouse movement
- Click to shoot bubbles
- Match 3+ bubbles of the same color
- Points scale with bubble count
- Hexagonal bubble layout
- Physics-based bouncing off walls

**Controls:**
- Move mouse to aim
- Click to shoot bubble
- Aim line indicator shows trajectory

**Scoring:**
- 3 bubbles = 30 points
- 4 bubbles = 40 points
- 5+ bubbles = 50+ points
- Bonus for clearing all bubbles

**Difficulty Settings:**
- Easy: 5 rows of bubbles
- Medium: 7 rows of bubbles
- Hard: 10 rows of bubbles
- Expert: 12 rows of bubbles

### Rolling Ball 🎱
Navigate a ball through platforms, collecting all coins to complete the level.

**Features:**
- Physics-based ball movement
- Jumping mechanics
- Moving platforms (medium+ difficulty)
- Coin collection
- Multiple levels
- Collision detection

**Controls:**
- Arrow keys or WASD to move
- Arrow Up / W / Space to jump
- Double jump enabled

**Scoring:**
- 50 points per coin
- Bonus for completing level
- Streak bonuses for quick completion

**Difficulty Settings:**
- Easy: 8 platforms, 5 coins, no moving platforms
- Medium: 12 platforms, 10 coins, 2 moving platforms
- Hard: 16 platforms, 15 coins, 4 moving platforms
- Expert: 20 platforms, 20 coins, 6 moving platforms

## Ad Rewards System

### How It Works
After completing a level in any game, an ad modal appears:

**Watch Ad (5 seconds):**
- +50 XP
- +25 Coins
- Counts toward ad statistics
- Rewards are instant

**Skip Ad:**
- No rewards
- Counts toward skip statistics
- Immediate continuation

### Ad Statistics
The system tracks:
- Total ads watched
- Total ads skipped
- Total coins earned from ads
- Total XP earned from ads
- Last ad watched timestamp

### Ad API Endpoints
- `POST /ads/watch` - Record ad watched, award rewards
- `POST /ads/skip` - Record ad skipped
- `GET /ads/rewards` - Get current reward amounts
- `GET /ads/stats` - Get user ad statistics

## Difficulty Multipliers
All games use the same difficulty multiplier system:
- **Easy**: 1.0x
- **Medium**: 1.5x
- **Hard**: 2.0x
- **Expert**: 3.0x

Final Score = Base Score × Difficulty Multiplier

## Game Selection Flow
1. Navigate to Game page
2. Select game type (Color Sort, Bubble Shooter, Rolling Ball)
3. Select difficulty (Easy, Medium, Hard, Expert)
4. Click "Start Game"
5. Play and earn points
6. Complete level to trigger ad
7. Watch or skip ad
8. End game to submit score
9. View results and earn XP

## Technical Implementation

### Backend
- **Game Sessions**: Tracks game type, difficulty, session token
- **Game Scores**: Records final score, level, difficulty, game type
- **Ad Rewards**: Tables for ad watches and user stats
- **Anti-Cheat**: Minimum session duration, maximum score per level

### Frontend
- **Canvas-Based Games**: Bubble Shooter and Rolling Ball use HTML5 Canvas
- **State Management**: Zustand for game state (score, level, session)
- **Real-Time Scoring**: Score updates reflected immediately
- **Level Completion**: Triggers ad modal

### Database Schema
```sql
game_sessions:
  - game_type ENUM('color_sort', 'bubble_shooter', 'rolling_ball')
  - session_token, user_id, is_active

game_scores:
  - game_type ENUM('color_sort', 'bubble_shooter', 'rolling_ball')
  - points, level, difficulty, user_id

ad_rewards:
  - reward_type, amount, ad_shown, watched_at

user_ad_stats:
  - total_ads_watched, total_ads_skipped
  - total_coins_from_ads, total_xp_from_ads
```

## Animation Features
- **Floating Emojis**: Animated background elements on home page
- **Card Animations**: Fade-in with staggered delays
- **Hover Effects**: Scale and transform on hover
- **Pulse Effect**: On primary CTA buttons
- **Smooth Transitions**: All state changes animated

## Visual Design
- **Gradient Backgrounds**: Purple-to-blue gradients
- **Glassmorphism**: Frosted glass effects on cards
- **Emoji Icons**: Used throughout for visual appeal
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Games**: Game canvases use dark themes

## Future Enhancements
- Multiplayer modes
- Leaderboards per game type
- Tournament mode
- Power-ups
- Daily challenges
- More game types
- Achievements specific to each game
