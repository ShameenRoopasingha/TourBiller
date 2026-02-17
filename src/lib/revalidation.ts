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
 *
 * @example
 *   revalidateFor('bill');                // After creating/updating/deleting a bill
 *   revalidateFor('bill', 'booking');     // After a bill creation that also closes a booking
 */
export function revalidateFor(...entities: string[]) {
    const paths = new Set<string>();
    for (const entity of entities) {
        const entityPaths = REVALIDATION_MAP[entity];
        if (entityPaths) {
            for (const p of entityPaths) {
                paths.add(p);
            }
        }
    }
    for (const path of paths) {
        revalidatePath(path);
    }
}
