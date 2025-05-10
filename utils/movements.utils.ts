import { Movement } from '@/types/movements.type';
import storageClient from './async-storage.client';
import { MOVEMENTS_STORAGE_KEY } from '@/constants/Files';
import { KG_TO_LBS } from '@/constants/Units';

/**
 * Fetch all movements from AsyncStorage.
 * @returns A list of all movements.
 */
export async function getAllMovements(): Promise<Movement[]> {
  try {
    const movements = await storageClient.getItem<Movement[]>(MOVEMENTS_STORAGE_KEY);
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
export async function saveMovement(movement: Movement): Promise<void> {
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

export const convertToLbs = (value: number): number => {
  return Math.round(value * KG_TO_LBS);
}

export const convertToKg = (value: number): number => {
  return Math.round(value / KG_TO_LBS);
};
