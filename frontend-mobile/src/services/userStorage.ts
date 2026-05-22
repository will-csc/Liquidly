import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let currentUser: User | null = null;
const USER_STORAGE_KEY = 'liquidly.user';
let currentToken: string | null = null;
const TOKEN_STORAGE_KEY = 'liquidly.token';

const canUseSecureStore = Platform.OS !== 'web';

const readToken = async (): Promise<string | null> => {
  if (canUseSecureStore) {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    }
  }
  return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
};

const writeToken = async (token: string) => {
  if (canUseSecureStore) {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
  }
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
};

const removeToken = async () => {
  if (canUseSecureStore) {
    const available = await SecureStore.isAvailableAsync();
    if (available) {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    }
  }
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const userStorage = {
  getUser: (): User | null => {
    return currentUser;
  },

  getToken: (): string => {
    return currentToken || '';
  },

  hydrate: async (): Promise<User | null> => {
    const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
    const rawToken = await readToken();
    currentToken = rawToken || null;
    if (!rawUser) {
      currentUser = null;
      return null;
    }
    try {
      currentUser = JSON.parse(rawUser) as User;
      return currentUser;
    } catch {
      currentUser = null;
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  },

  setUser: async (user: User) => {
    currentUser = user;
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  setToken: async (token: string) => {
    currentToken = token || null;
    if (!token) {
      await removeToken();
      return;
    }
    await writeToken(token);
  },

  clearUser: async () => {
    currentUser = null;
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    currentToken = null;
    await removeToken();
  }
};
