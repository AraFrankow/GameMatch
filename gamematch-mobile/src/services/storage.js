import * as SecureStore from 'expo-secure-store';

export const storage = {
  async guardar(key, value) {
    try {
      await SecureStore.setItemAsync(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    } catch (e) {
      console.error('Error al guardar en SecureStore:', e);
    }
  },

  async obtener(key) {
    try {
      const res = await SecureStore.getItemAsync(key);
      if (!res) return null;
      try {
        return JSON.parse(res);
      } catch {
        return res;
      }
    } catch (e) {
      console.error('Error al obtener de SecureStore:', e);
      return null;
    }
  },

  async eliminar(key) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('Error al eliminar de SecureStore:', e);
    }
  }
};