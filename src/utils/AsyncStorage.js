// Temporary AsyncStorage polyfill for development
// This file provides a fallback when @react-native-async-storage/async-storage is not installed

let storage = {};

const AsyncStoragePolyfill = {
  getItem: async key => {
    return storage[key] || null;
  },

  setItem: async (key, value) => {
    storage[key] = value;
    return true;
  },

  removeItem: async key => {
    delete storage[key];
    return true;
  },

  multiRemove: async keys => {
    keys.forEach(key => delete storage[key]);
    return true;
  },

  clear: async () => {
    storage = {};
    return true;
  },
};

// Try to import the real AsyncStorage, fall back to polyfill if not available
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('AsyncStorage not found, using polyfill for development');
  AsyncStorage = AsyncStoragePolyfill;
}

export default AsyncStorage;
