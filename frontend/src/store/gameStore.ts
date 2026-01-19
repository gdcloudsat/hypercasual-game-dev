import { create } from 'zustand';
import api from '../services/api';

interface GameState {
  sessionToken: string | null;
  currentScore: number;
  currentLevel: number;
  difficulty: string;
  gameType: string;
  isPlaying: boolean;
  startSession: (difficulty: string, gameType: string) => Promise<void>;
  submitScore: (points: number, level: number, gameType: string) => Promise<any>;
  updateScore: (points: number) => void;
  updateLevel: (level: number) => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionToken: null,
  currentScore: 0,
  currentLevel: 1,
  difficulty: 'easy',
  gameType: 'color_sort',
  isPlaying: false,

  startSession: async (difficulty: string, gameType: string = 'color_sort') => {
    try {
      const response = await api.post('/game/start-session', { difficulty, gameType });
      const { sessionToken, startLevel } = response.data;

      set({
        sessionToken,
        difficulty,
        gameType,
        currentScore: 0,
        currentLevel: startLevel || 1,
        isPlaying: true,
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  },

  submitScore: async (points: number, level: number, gameType: string = 'color_sort') => {
    const { sessionToken, difficulty } = get();
    if (!sessionToken) {
      throw new Error('No active session');
    }

    try {
      const response = await api.post('/game/submit-score', {
        points,
        level,
        difficulty,
        sessionToken,
        gameType,
      });

      set({ isPlaying: false });
      return response.data;
    } catch (error) {
      console.error('Failed to submit score:', error);
      throw error;
    }
  },

  updateScore: (points: number) => {
    set({ currentScore: points });
  },

  updateLevel: (level: number) => {
    set({ currentLevel: level });
  },

  endGame: () => {
    set({ isPlaying: false });
  },

  resetGame: () => {
    set({
      sessionToken: null,
      currentScore: 0,
      currentLevel: 1,
      gameType: 'color_sort',
      isPlaying: false,
    });
  },
}));
