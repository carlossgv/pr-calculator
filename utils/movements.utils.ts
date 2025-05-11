import { Movement, MovementData, OldMovement } from '@/types/movements.type';
import storageClient from './async-storage.client';
import { MOVEMENTS_STORAGE_KEY } from '@/constants/Files';
import { KG_TO_LBS } from '@/constants/Units';

/**
 * Fetch all movements from AsyncStorage.
 * @returns A list of all movements.
 */
export async function getAllMovements(): Promise<Movement[]> {
  try {
    const movements = await storageClient.getItem<(Movement | OldMovement)[]>(MOVEMENTS_STORAGE_KEY);

    // if movement is OldMovement, convert it to Movement
    if (movements) {
      const convertedMovements = movements.map((movement) => {
        if ('pr' in movement) {
          return convertOldMovementToNew(movement);
        }
        return movement;
      });

      // Filter out any undefined values
      return convertedMovements.filter((movement): movement is Movement => movement !== undefined);
    }

    return [];

  } catch (error) {
    console.error('Error fetching movements:', error);
    return [];
  }
}

function convertOldMovementToNew(oldMovement: OldMovement): Movement {
  return {
    name: oldMovement.name,
    data: [{
      date: new Date(oldMovement.date).toISOString(),
      weight: oldMovement.pr,
      reps: 1,
      set: 0,
    }],
  };
}

/**
 * Create or update a movement in AsyncStorage.
 * @param movement The movement object to save (includes name and pr).
 */
export async function createMovement(movement: Movement): Promise<void> {
  try {
    const movements = await getAllMovements();
    const index = movements.findIndex((m) => m.name === movement.name);

    if (index !== -1) {
      throw new Error('Movement already exists');
    } else {
      // Movement does not exist, create it
      movements.push(movement);
    }

    await storageClient.setItem(MOVEMENTS_STORAGE_KEY, movements);
  } catch (error) {
    console.error('Error saving movement:', error);
  }
}

export async function addMovementData(name: string, data: MovementData): Promise<void> {
  try {
    const movements = await getAllMovements();
    const index = movements.findIndex((m) => m.name === name);

    if (index !== -1) {
      movements[index].data.unshift(data);
      await storageClient.setItem(MOVEMENTS_STORAGE_KEY, movements);
    } else {
      throw new Error('Movement not found');
    }
  } catch (error) {
    console.error('Error adding movement data:', error);
  }
}

export async function getMovement(name: string): Promise<Movement | null> {
  try {
    const movements = await getAllMovements();
    const movement = movements.find((m) => m.name === name);

    if (movement) {
      return movement
    } else {
      throw new Error('Movement not found');
    }
  } catch (error) {
    console.error('Error fetching movement data:', error);
    return null;
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

export async function deleteMovementData(name: string, date: string): Promise<void> {
  try {
    const movements = await getAllMovements();
    const index = movements.findIndex((m) => m.name === name);

    if (index !== -1) {
      const updatedData = movements[index].data.filter((data) => data.date !== date);
      movements[index].data = updatedData;
      await storageClient.setItem(MOVEMENTS_STORAGE_KEY, movements);
    } else {
      throw new Error('Movement not found');
    }
  } catch (error) {
    console.error('Error deleting movement data:', error);
  }
}

export const convertToLbs = (value: number): number => {
  return Math.round(value * KG_TO_LBS);
}

export const convertToKg = (value: number): number => {
  return Math.round(value / KG_TO_LBS);
};
