import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-CA"); // YYYY-MM-DD format
}
