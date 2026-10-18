import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDocumentEmail } from '@/lib/email-service';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            to,
            subject,
            message,
            documentType,
            documentId,
            pdfBase64,
            filename,
        } = body;

        if (!to || typeof to !== 'string' || !to.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'A valid recipient email address is required.' },
                { status: 400 }
            );
        }

        if (!documentType || !['quotation', 'bill'].includes(documentType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid document type. Must be quotation or bill.' },
                { status: 400 }
            );
        }

        const companyId = (session.user as any).companyId;
        const profile = companyId
            ? await prisma.businessProfile.findUnique({ where: { id: companyId } })
            : null;

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';

        if (documentType === 'quotation') {
            const quotation = await prisma.quotation.findFirst({
                where: {
                    id: documentId,
                    ...(companyId ? { companyId } : {}),
                },
                include: {
                    tourSchedule: true,
                },
            });

            if (!quotation) {
                return NextResponse.json(
                    { success: false, error: 'Quotation not found.' },
                    { status: 404 }
                );
            }

            const dates = (quotation.startDate && quotation.endDate)
                ? `${new Date(quotation.startDate).toLocaleDateString('en-GB')} - ${new Date(quotation.endDate).toLocaleDateString('en-GB')}`
                : undefined;

            const onlineUrl = origin ? `${origin}/quotations/${quotation.id}/print` : undefined;

            const result = await sendDocumentEmail({
                to,
                subject,
                documentType: 'quotation',
                documentNumber: quotation.quotationNumber,
                customerName: quotation.customerName,
                totalAmount: quotation.totalAmount,
                advanceAmount: quotation.advanceAmount || 0,
                currency: profile?.currency || 'LKR',
                tourName: quotation.tourSchedule?.name || (quotation.pickupLocation && quotation.dropLocation ? `${quotation.pickupLocation} to ${quotation.dropLocation}` : undefined),
                vehicleNo: quotation.vehicleNo || undefined,
                dates,
                onlineUrl,
                customMessage: message,
                companyName: profile?.companyName,
                companyEmail: profile?.email || undefined,
                companyPhone: profile?.phone || undefined,
                companyAddress: profile?.address || undefined,
                pdfBase64,
                filename: filename || `Quotation-${quotation.quotationNumber}.pdf`,
            });

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error, isKeyMissing: result.isKeyMissing },
                    { status: result.isKeyMissing ? 422 : 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: `Quotation #${quotation.quotationNumber} has been successfully sent to ${to}.`,
                messageId: result.messageId,
            });
        } else {
            // Bill / Receipt
            const bill = await prisma.bill.findFirst({
                where: {
                    id: documentId,
                    ...(companyId ? { companyId } : {}),
                },
            });

            if (!bill) {
                return NextResponse.json(
                    { success: false, error: 'Invoice/Bill not found.' },
                    { status: 404 }
                );
            }

            const dates = (bill.startDate && bill.endDate)
                ? `${new Date(bill.startDate).toLocaleDateString('en-GB')} - ${new Date(bill.endDate).toLocaleDateString('en-GB')}`
                : undefined;

            const onlineUrl = origin ? `${origin}/bills/${bill.id}/print` : undefined;

            const result = await sendDocumentEmail({
                to,
                subject,
                documentType: 'bill',
                documentNumber: bill.billNumber,
                customerName: bill.customerName,
                totalAmount: bill.totalAmount,
                advanceAmount: bill.advanceAmount || 0,
                currency: bill.currency || profile?.currency || 'LKR',
                tourName: bill.route,
                vehicleNo: bill.vehicleNo,
                dates,
                onlineUrl,
                customMessage: message,
                companyName: profile?.companyName,
                companyEmail: profile?.email || undefined,
                companyPhone: profile?.phone || undefined,
                companyAddress: profile?.address || undefined,
                pdfBase64,
                filename: filename || `Invoice-${bill.billNumber}.pdf`,
            });

            if (!result.success) {
                return NextResponse.json(
                    { success: false, error: result.error, isKeyMissing: result.isKeyMissing },
                    { status: result.isKeyMissing ? 422 : 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: `Invoice #${bill.billNumber} has been successfully sent to ${to}.`,
                messageId: result.messageId,
            });
        }
    } catch (err: any) {
        console.error('API /api/email/send error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Internal server error while sending email.' },
            { status: 500 }
        );
    }
}
