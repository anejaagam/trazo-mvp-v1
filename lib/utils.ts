import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

/**
 * Date and Time Formatting Utilities
 * Consolidated from multiple components to reduce duplication
 */

/**
 * Format a date string to localized short format (e.g., "Jan 15, 2025")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string to include time (e.g., "Jan 15, 2025, 02:30 PM")
 * @param dateString - ISO date string
 * @param includeYear - Whether to include year (default: false)
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string, includeYear: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  if (includeYear) {
    options.year = 'numeric';
  }
  
  return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Format a timestamp to relative time ago (e.g., "5 min ago", "2h ago", "3d ago")
 * @param timestamp - ISO date string or timestamp
 * @returns Relative time string
 */
export function formatTimeAgo(timestamp: string): string {
  const minutesAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
}

/**
 * Format a timestamp to full localized date and time
 * @param timestamp - ISO date string
 * @returns Full localized date/time string
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}
