import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentUser: User | null = null;
const USER_STORAGE_KEY = 'liquidly.user';

export const userStorage = {
  getUser: (): User | null => {
    return currentUser;
  },

  hydrate: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      currentUser = null;
      return null;
    }
    currentUser = JSON.parse(raw) as User;
    return currentUser;
  },

  setUser: async (user: User) => {
    currentUser = user;
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  clearUser: async () => {
    currentUser = null;
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }
};
