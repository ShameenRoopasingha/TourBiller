import { revalidatePath } from 'next/cache';

/**
 * Centralized revalidation map.
 * Maps each entity type to all the route paths that display data from that entity.
 * When a mutation occurs on an entity, all listed paths are revalidated,
 * ensuring perfect data sync across all pages.
 */
const REVALIDATION_MAP: Record<string, string[]> = {
    bill: ['/bills', '/', '/bookings'],
    customer: ['/customers', '/quotations/new', '/bills/new', '/bookings/new', '/'],
    vehicle: ['/vehicles', '/quotations/new', '/bills/new', '/bookings/new', '/'],
    tourSchedule: ['/tour-schedules', '/quotations/new', '/quotations', '/'],
    quotation: ['/quotations', '/tour-schedules', '/'],
    booking: ['/bookings', '/', '/bills/new'],
    businessProfile: ['/settings', '/bills', '/quotations'],
};

/**
 * Revalidate all paths affected by mutations on the given entity types.
 * Deduplicates paths automatically when multiple entities are specified.
 */
export function revalidateFor(...entities: string[]) {
    try {
        const pathsToRevalidate = new Set<string>();

        for (const entity of entities) {
            const paths = REVALIDATION_MAP[entity];
            if (paths) {
                for (const path of paths) {
                    pathsToRevalidate.add(path);
                }
            }
        }

        if (pathsToRevalidate.size === 0) {
            // Fallback if entity not mapped, just refresh current data
            revalidatePath('/');
        } else {
            // Revalidate each specific path
            for (const path of pathsToRevalidate) {
                revalidatePath(path);
            }
        }
    } catch (e) {
        console.error('Revalidation error:', e);
    }
}
