import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageClient {
  /**
   * Save a value to AsyncStorage.
   * @param key The key to save the value under.
   * @param value The value to save (can be any serializable object).
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving data to key "${key}":`, error);
    }
  }

  /**
   * Retrieve a value from AsyncStorage.
   * @param key The key to retrieve the value from.
   * @returns The parsed value, or `null` if not found.
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving data for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove a value from AsyncStorage.
   * @param key The key to remove.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}":`, error);
    }
  }

  /**
   * Retrieve all keys and their associated values from AsyncStorage.
   * @returns An array of key-value pairs.
   */
  async getAllItems(): Promise<{ key: string; value: any }[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      return stores.map(([key, value]) => ({
        key,
        value: value != null ? JSON.parse(value) : null,
      }));
    } catch (error) {
      console.error('Error retrieving all items:', error);
      return [];
    }
  }

  /**
   * Clear all AsyncStorage data (use with caution).
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }
}

const storageClient = new StorageClient();
export default storageClient;
