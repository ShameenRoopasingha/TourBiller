export interface BillItineraryItem {
    dayNumber: number;
    title: string;
    distanceKm: number;
    accommodation: number;
    meals: number;
    activities: number;
    otherCosts: number;
}

export interface BillItinerarySnapshot {
    scheduleName?: string;
    route?: string;
    items: BillItineraryItem[];
}

export function parseBillItinerary(value: unknown): BillItinerarySnapshot {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) {
            return { items: parsed as BillItineraryItem[] };
        }
        if (parsed && typeof parsed === 'object') {
            const snapshot = parsed as Partial<BillItinerarySnapshot>;
            return {
                scheduleName: typeof snapshot.scheduleName === 'string' ? snapshot.scheduleName : undefined,
                route: typeof snapshot.route === 'string' ? snapshot.route : undefined,
                items: Array.isArray(snapshot.items) ? snapshot.items : [],
            };
        }
    } catch {
        // Older or malformed snapshots should not prevent invoice rendering.
    }

    return { items: [] };
}