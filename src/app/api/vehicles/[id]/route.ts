import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { updateVehicle } from '@/lib/vehicle-actions';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const result = await updateVehicle(id, formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating vehicle:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
        }

        const vehicle = await prisma.vehicle.findFirst({
            where: { id, companyId: authCheck.companyId },
            select: { vehicleNo: true }
        });
        if (!vehicle) {
            return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
        }

        const vno = vehicle.vehicleNo;
        const cid = authCheck.companyId;

        // Check for related records
        const relatedItems: string[] = [];

        const expenses = await prisma.vehicleExpense.count({ where: { vehicleNo: vno, companyId: cid } });
        if (expenses > 0) relatedItems.push(`${expenses} expense(s)`);

        const bills = await prisma.bill.count({ where: { vehicleNo: vno, companyId: cid } });
        if (bills > 0) relatedItems.push(`${bills} bill(s)`);

        const bookings = await prisma.booking.count({ where: { vehicleNo: vno, companyId: cid } });
        if (bookings > 0) relatedItems.push(`${bookings} booking(s)`);

        const quotations = await prisma.quotation.count({ where: { vehicleNo: vno, companyId: cid } });
        if (quotations > 0) relatedItems.push(`${quotations} quotation(s)`);

        const tours = await prisma.tourSchedule.count({ where: { vehicleNo: vno, companyId: cid } });
        if (tours > 0) relatedItems.push(`${tours} tour schedule(s)`);

        if (relatedItems.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Cannot delete vehicle "${vno}": it has ${relatedItems.join(', ')} linked. Remove or reassign those records first.`,
            }, { status: 400 });
        }

        const _res = await prisma.vehicle.deleteMany({
            where: { id, companyId: cid },
        });
        if (_res.count === 0) {
            return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete vehicle' }, { status: 500 });
    }
}
