import storageClient from './async-storage.client';

const MOVEMENTS_STORAGE_KEY = 'movements';

/**
 * Fetch all movements from AsyncStorage.
 * @returns A list of all movements.
 */
export async function getAllMovements(): Promise<{ name: string; pr: number }[]> {
  try {
    const movements = await storageClient.getItem<{ name: string; pr: number }[]>(MOVEMENTS_STORAGE_KEY);
    return movements || [];
  } catch (error) {
    console.error('Error fetching movements:', error);
    return [];
  }
}

/**
 * Create or update a movement in AsyncStorage.
 * @param movement The movement object to save (includes name and pr).
 */
export async function saveMovement(movement: { name: string; pr: number }): Promise<void> {
  try {
    const movements = await getAllMovements();
    const index = movements.findIndex((m) => m.name === movement.name);

    if (index !== -1) {
      // Movement exists, update it
      movements[index] = movement;
    } else {
      // Movement does not exist, create it
      movements.push(movement);
    }

    await storageClient.setItem(MOVEMENTS_STORAGE_KEY, movements);
  } catch (error) {
    console.error('Error saving movement:', error);
  }
}

/**
 * Delete a movement from AsyncStorage.
 * @param name The name of the movement to delete.
 */
export async function deleteMovement(name: string): Promise<void> {
  try {
    const movements = await getAllMovements();
    const updatedMovements = movements.filter((movement) => movement.name !== name);
    await storageClient.setItem(MOVEMENTS_STORAGE_KEY, updatedMovements);
  } catch (error) {
    console.error('Error deleting movement:', error);
  }
}
