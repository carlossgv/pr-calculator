import { User } from "@/types/user.type";

export const FILE_NAME = 'movements.json';
export const MOVEMENTS_STORAGE_KEY = 'movements';
export const USER_STORAGE_KEY = 'user';
export const DEFAULT_USER: User = {
  gender: "M",
  preferences: {
    weightUnit: 'lb',
  }
}

