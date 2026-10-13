import { NextRequest, NextResponse } from 'next/server';
import { getLiveExchangeRate, convertCurrencyAmount } from '@/lib/exchange-rate';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from') || 'USD';
        const to = searchParams.get('to') || 'LKR';
        const amountStr = searchParams.get('amount');

        if (amountStr) {
            const amount = parseFloat(amountStr);
            if (!isNaN(amount)) {
                const converted = await convertCurrencyAmount(amount, from, to);
                return NextResponse.json({ success: true, ...converted });
            }
        }

        const rateData = await getLiveExchangeRate(from, to);
        return NextResponse.json({ success: true, ...rateData });
    } catch (error) {
        console.error('Error in exchange-rate API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve exchange rate' },
            { status: 500 }
        );
    }
}
