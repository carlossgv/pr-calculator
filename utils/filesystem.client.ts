import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FILE_NAME, MOVEMENTS_STORAGE_KEY } from '@/constants/Files';

class FileSystemClient {
  /**
   * Writes data to a JSON file.
   * @param filename - The name of the file (e.g., 'data.json').
   * @param data - The data to be written to the file.
   * @returns The URI of the created file.
   */
  async writeJSON(filename: string, data: object): Promise<string> {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    const jsonData = JSON.stringify(data, null, 2);

    await FileSystem.writeAsStringAsync(fileUri, jsonData);
    return fileUri;
  }

  /**
   * Shares a file if sharing is available. Otherwise, alerts the user.
   * @param fileUri - The URI of the file to share.
   */
  async shareFile(fileUri: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error(`Sharing is not available. File saved to: ${fileUri}`);
    }
  }

  /**
   * Loads a JSON file from a URI and saves its contents to Async Storage.
   * @param fileUri - The URI of the JSON file to load.
   * @param storageKey - The key under which the JSON data should be saved in Async Storage.
   */
  async loadJSONToAsyncStorage(fileUri: string, storageKey: string = MOVEMENTS_STORAGE_KEY): Promise<void> {
    try {
      // Read the contents of the JSON file
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Parse the JSON data
      const jsonData = JSON.parse(fileContent);

      // Save the JSON data to Async Storage
      await AsyncStorage.setItem(storageKey, JSON.stringify(jsonData));
    } catch (error) {
      console.error('Error loading JSON to Async Storage:', error);
      throw new Error('Failed to load JSON into Async Storage.');
    }
  }
}

export default new FileSystemClient();
