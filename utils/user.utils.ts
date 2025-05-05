import { User } from "@/types/user.type";
import storageClient from "./async-storage.client";
import { DEFAULT_USER, USER_STORAGE_KEY } from "@/constants/Files";

export async function getUser(): Promise<User | null> {
  try {
    const user = await storageClient.getItem<User>(USER_STORAGE_KEY);

    if (!user) {
      await saveUser(DEFAULT_USER)
    }

    return user 
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    await storageClient.setItem(USER_STORAGE_KEY, user);
  } catch (error) {
    console.error('Error saving user:', error);
  }
}
