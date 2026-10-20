/**
 * Centralized Date & Time Utilities for TourBiller (VIGIL)
 * 
 * Ensures consistent timezone handling (Asia/Colombo / Sri Lanka Standard Time UTC+05:30)
 * across both Server Components (Node.js runtime) and Client Components.
 */

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Colombo';

/**
 * Format a Date, ISO string, or timestamp into a localized Date & Time string.
 * Example: "20/10/2026, 00:00:00" or custom format options.
 */
export function formatAppDateTime(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string; includeSeconds?: boolean }
): string {
    if (!date) return '-';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: options?.timeZone || APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: options?.includeSeconds ?? true ? '2-digit' : undefined,
        hour12: false,
    };

    return d.toLocaleString('en-GB', {
        ...defaultOptions,
        ...options,
    });
}

/**
 * Format a Date, ISO string, or timestamp into a localized Date string.
 * Example: "20/10/2026"
 */
export function formatAppDate(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string }
): string {
    if (!date) return '-';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: options?.timeZone || APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };

    return d.toLocaleDateString('en-GB', {
        ...defaultOptions,
        ...options,
    });
}

/**
 * Format a Date, ISO string, or timestamp into a localized Time string.
 * Example: "00:00" or "23:59"
 */
export function formatAppTime(
    date: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string }
): string {
    if (!date) return '-';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: options?.timeZone || APP_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    return d.toLocaleTimeString('en-GB', {
        ...defaultOptions,
        ...options,
    });
}

/**
 * Format a Date range cleanly (e.g. "20/10/2026, 00:00:00 to 20/10/2026, 23:59:00")
 */
export function formatAppDateRange(
    startDate: Date | string | number | null | undefined,
    endDate?: Date | string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string; includeSeconds?: boolean }
): string {
    if (!startDate) return '-';
    const startStr = formatAppDateTime(startDate, options);
    if (!endDate) return startStr;
    const endStr = formatAppDateTime(endDate, options);
    return `${startStr} to ${endStr}`;
}
