import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentUser: User | null = null;
const USER_STORAGE_KEY = 'liquidly.user';
let currentToken: string | null = null;
const TOKEN_STORAGE_KEY = 'liquidly.token';

export const userStorage = {
  getUser: (): User | null => {
    return currentUser;
  },

  getToken: (): string => {
    return currentToken || '';
  },

  hydrate: async (): Promise<User | null> => {
    const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
    const rawToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    currentToken = rawToken || null;
    if (!rawUser) {
      currentUser = null;
      return null;
    }
    currentUser = JSON.parse(rawUser) as User;
    return currentUser;
  },

  setUser: async (user: User) => {
    currentUser = user;
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  setToken: async (token: string) => {
    currentToken = token || null;
    if (!token) {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  },

  clearUser: async () => {
    currentUser = null;
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    currentToken = null;
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};
