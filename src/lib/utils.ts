import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type ActionResult } from "./validations"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSafeItems<T>(result: ActionResult<T[]>): T[] {
    return result.success && result.data ? result.data : [];
}
