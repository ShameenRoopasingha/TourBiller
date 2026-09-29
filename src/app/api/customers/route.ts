import { NextRequest, NextResponse } from 'next/server';
import { createCustomer, getCustomers, updateCustomer } from '@/lib/customer-actions';

export async function GET(req: NextRequest) {
    try {
        const searchQuery = new URL(req.url).searchParams.get('q') || undefined;
        const result = await getCustomers(searchQuery);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching customers:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const result = await createCustomer(formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating customer:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
        const formData = await req.formData();
        const result = await updateCustomer(id, formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating customer:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
