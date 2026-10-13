interface CachedRates {
    timestamp: number;
    base: string;
    rates: Record<string, number>;
}

let cachedData: CachedRates | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch latest exchange rates from Open Exchange Rates API (free, reliable, no key needed)
 */
export async function getLiveRates(baseCurrency = 'USD'): Promise<Record<string, number>> {
    const base = baseCurrency.toUpperCase().trim();
    const now = Date.now();

    if (cachedData && cachedData.base === base && (now - cachedData.timestamp) < CACHE_DURATION_MS) {
        return cachedData.rates;
    }

    try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
            next: { revalidate: 3600 }, // Next.js fetch cache for 1 hour
        });

        if (!res.ok) {
            throw new Error(`Exchange rate API responded with status ${res.status}`);
        }

        const data = await res.json();
        if (data && data.rates) {
            cachedData = {
                timestamp: now,
                base,
                rates: data.rates,
            };
            return data.rates;
        }
    } catch (error) {
        console.error('Failed to fetch live exchange rates:', error);
    }

    // Fallback static rates if network is unavailable
    return {
        USD: 1,
        LKR: 305.0,
        EUR: 0.92,
        GBP: 0.78,
        AUD: 1.50,
        CAD: 1.38,
        SGD: 1.34,
        INR: 83.5,
    };
}

/**
 * Get specific conversion rate between two currencies (e.g., USD -> LKR)
 */
export async function getLiveExchangeRate(fromCurrency = 'USD', toCurrency = 'LKR'): Promise<{
    rate: number;
    from: string;
    to: string;
    timestamp: number;
}> {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();

    if (from === to) {
        return { rate: 1, from, to, timestamp: Date.now() };
    }

    const rates = await getLiveRates(from);
    const targetRate = rates[to];

    if (targetRate) {
        return {
            rate: targetRate,
            from,
            to,
            timestamp: Date.now(),
        };
    }

    // Inverted fallback if direct rate missing
    const usdRates = await getLiveRates('USD');
    const fromInUsd = usdRates[from] || 1;
    const toInUsd = usdRates[to] || 305;
    const calculatedRate = toInUsd / fromInUsd;

    return {
        rate: calculatedRate,
        from,
        to,
        timestamp: Date.now(),
    };
}

/**
 * Convert an amount between currencies
 */
export async function convertCurrencyAmount(
    amount: number,
    fromCurrency = 'LKR',
    toCurrency = 'USD'
): Promise<{
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    from: string;
    to: string;
}> {
    const { rate, from, to } = await getLiveExchangeRate(fromCurrency, toCurrency);
    return {
        originalAmount: amount,
        convertedAmount: Number((amount * rate).toFixed(2)),
        rate,
        from,
        to,
    };
}
