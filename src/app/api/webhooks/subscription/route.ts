import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        // PayHere sends data as application/x-www-form-urlencoded
        const textBody = await request.text();
        const params = new URLSearchParams(textBody);

        const merchantId = params.get('merchant_id');
        const orderId = params.get('order_id');
        const payhereAmount = params.get('payhere_amount');
        const payhereCurrency = params.get('payhere_currency');
        const statusCode = params.get('status_code');
        const md5sig = params.get('md5sig');
        
        const password = params.get('custom_1');
        const companyName = params.get('custom_2');
        const email = params.get('customer_email');

        // Verify status code is 2 (Success)
        if (statusCode !== '2') {
            return NextResponse.json({ success: false, error: 'Payment not successful' }, { status: 400 });
        }

        if (!email || !companyName || !password) {
            return NextResponse.json(
                { success: false, error: 'Missing required custom fields (email, companyName, password)' },
                { status: 400 }
            );
        }

        // Verify Signature (Optional but recommended for production)
        // const secret = process.env.PAYHERE_SECRET;
        // if (secret) {
        //     const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
        //     const amountFormatted = parseFloat(payhereAmount || '0').toFixed(2);
        //     const hashString = merchantId + orderId + amountFormatted + payhereCurrency + statusCode + hashedSecret;
        //     const generatedSig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
        //     if (generatedSig !== md5sig) {
        //          return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
        //     }
        // }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ success: true, message: 'User already exists and subscription updated.' });
        }

        // Create a new BusinessProfile (Tenant)
        const businessProfile = await prisma.businessProfile.create({
            data: {
                companyName: companyName,
            }
        });

        // Hash the password received from the website
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the Owner User linked to this new BusinessProfile
        const newUser = await prisma.user.create({
            data: {
                email,
                name: 'Owner',
                password: hashedPassword,
                role: 'ADMIN',
                companyId: businessProfile.id,
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Subscription created successfully'
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
