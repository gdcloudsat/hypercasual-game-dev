import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  guestLogin: async () => {
    try {
      const response = await api.post('/auth/guest-login', {});
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await api.post('/auth/validate');
      if (response.data.valid) {
        set({ 
          user: response.data.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ isLoading: false, isAuthenticated: false });
    }
  },
}));
