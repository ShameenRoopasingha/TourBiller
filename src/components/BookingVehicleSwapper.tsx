'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Car, AlertTriangle, RefreshCw, Check, Loader2, Phone, DollarSign, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { swapBookingVehicle } from '@/lib/booking-actions';
import { notify } from '@/lib/notifications';
import type { EmergencyVehicleSwapOptions } from '@/lib/validations';

interface FleetVehicleItem {
    vehicleNo: string;
    model: string | null;
    category: string;
    status: string;
    seats: number | null;
}

interface BookingVehicleSwapperProps {
    bookingId: string;
    currentVehicleNo: string;
    bookingStatus?: string;
    fleetVehicles: FleetVehicleItem[];
    isAdmin?: boolean;
    pendingBreakdownReport?: {
        reason?: string;
        meterReading?: string;
        location?: string;
        note?: string;
        timestamp?: Date | string;
    } | null;
}

const COMMON_BREAKDOWN_REASONS = [
    'Engine Failure / Overheating',
    'Flat Tyre / Blowout',
    'Brake / Steering Problem',
    'Electrical / Alternator',
    'Clutch / Transmission Issue',
    'Accident / Collision',
    'AC / Cooling Breakdown',
    'Other Mechanical Defect',
];

export function BookingVehicleSwapper({
    bookingId,
    currentVehicleNo,
    bookingStatus,
    fleetVehicles,
    isAdmin = true,
    pendingBreakdownReport,
}: BookingVehicleSwapperProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Swap Form State
    const [swapType, setSwapType] = useState<'FLEET' | 'EXTERNAL'>('FLEET');
    const [selectedFleetVehicleNo, setSelectedFleetVehicleNo] = useState('');
    const [externalVehicleNo, setExternalVehicleNo] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierPhone, setSupplierPhone] = useState('');
    const [hireCost, setHireCost] = useState('');
    const [expenseType, setExpenseType] = useState<'COMPANY' | 'CUSTOMER'>('COMPANY');

    // Audit State
    const [breakdownMeterReading, setBreakdownMeterReading] = useState(pendingBreakdownReport?.meterReading || '');
    const [newVehicleStartMeter, setNewVehicleStartMeter] = useState('');
    const [location, setLocation] = useState(pendingBreakdownReport?.location || '');
    const [reason, setReason] = useState(pendingBreakdownReport?.reason || 'Engine Failure / Overheating');
    const [notes, setNotes] = useState(pendingBreakdownReport?.note || '');
    const [markOldVehicleMaintenance, setMarkOldVehicleMaintenance] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const isOngoingOrConfirmed = bookingStatus === 'ONGOING' || bookingStatus === 'CONFIRMED' || bookingStatus === 'OVERDUE';
    const currentFleetInfo = fleetVehicles.find(v => v.vehicleNo.toUpperCase() === currentVehicleNo.toUpperCase());

    // Available fleet vehicles excluding current vehicle
    const eligibleFleetVehicles = fleetVehicles.filter(
        v => v.vehicleNo.toUpperCase() !== currentVehicleNo.toUpperCase() && v.status !== 'RETIRED'
    );

    const handleOpenModal = () => {
        if (pendingBreakdownReport) {
            if (pendingBreakdownReport.meterReading) setBreakdownMeterReading(pendingBreakdownReport.meterReading);
            if (pendingBreakdownReport.location) setLocation(pendingBreakdownReport.location);
            if (pendingBreakdownReport.reason) setReason(pendingBreakdownReport.reason);
            if (pendingBreakdownReport.note) setNotes(pendingBreakdownReport.note);
        }
        setError(null);
        setOpen(true);
    };

    const handleCloseModal = () => {
        setError(null);
        setOpen(false);
    };

    const handleConfirmSwap = () => {
        setError(null);

        const targetVehicleNo = swapType === 'FLEET' ? selectedFleetVehicleNo.trim() : externalVehicleNo.trim();

        if (!targetVehicleNo) {
            setError(swapType === 'FLEET' ? 'Please select a replacement fleet vehicle.' : 'Please enter the external vehicle registration number.');
            return;
        }

        if (targetVehicleNo.toUpperCase() === currentVehicleNo.toUpperCase()) {
            setError('Replacement vehicle must be different from the currently assigned vehicle.');
            return;
        }

        if (!breakdownMeterReading.trim()) {
            setError('Breakdown Odometer / Meter Reading is strictly required.');
            return;
        }

        if (!newVehicleStartMeter.trim()) {
            setError('Replacement vehicle start odometer / meter reading is strictly required.');
            return;
        }

        if (!location.trim()) {
            setError('Breakdown location is required.');
            return;
        }

        if (!reason.trim()) {
            setError('Breakdown reason / issue is required.');
            return;
        }

        const costNum = hireCost.trim() ? parseFloat(hireCost) : undefined;
        if (swapType === 'EXTERNAL' && hireCost.trim() && (isNaN(costNum!) || costNum! < 0)) {
            setError('Please enter a valid hire cost amount.');
            return;
        }

        startTransition(async () => {
            const swapData: EmergencyVehicleSwapOptions = {
                swapType,
                newVehicleNo: targetVehicleNo.toUpperCase(),
                breakdownMeterReading: breakdownMeterReading.trim(),
                newVehicleStartMeter: newVehicleStartMeter.trim(),
                location: location.trim(),
                reason: reason.trim(),
                notes: notes.trim() || undefined,
                supplierName: swapType === 'EXTERNAL' ? supplierName.trim() || undefined : undefined,
                supplierPhone: swapType === 'EXTERNAL' ? supplierPhone.trim() || undefined : undefined,
                hireCost: swapType === 'EXTERNAL' ? costNum : undefined,
                expenseType: swapType === 'EXTERNAL' ? expenseType : undefined,
                markOldVehicleMaintenance,
            };

            const res = await swapBookingVehicle(bookingId, swapData);
            if (res.success) {
                notify.success(`Vehicle replaced with ${targetVehicleNo.toUpperCase()} successfully.`);
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || 'Failed to replace vehicle');
                notify.error(res.error || 'Failed to replace vehicle');
            }
        });
    };

    return (
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                        <Car className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground tracking-tight">
                                {currentVehicleNo}
                            </h3>
                            {currentFleetInfo ? (
                                <Badge variant="outline" className="text-xs bg-muted/50">
                                    {currentFleetInfo.model || currentFleetInfo.category} {currentFleetInfo.seats ? `• ${currentFleetInfo.seats} seats` : ''}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                    External / Hired
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Assigned tour vehicle
                        </p>
                    </div>
                </div>

                {isAdmin && isOngoingOrConfirmed && (
                    <Button 
                        onClick={handleOpenModal}
                        variant="outline" 
                        size="sm"
                        className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 font-semibold"
                    >
                        <ShieldAlert className="h-4 w-4 mr-1.5 text-red-500" />
                        🚨 Emergency Vehicle Swap
                    </Button>
                )}
            </div>

            {/* Emergency Vehicle Swap Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xl">
                            <ShieldAlert className="h-6 w-6" />
                            Emergency Mid-Tour Vehicle Swap
                        </DialogTitle>
                        <DialogDescription>
                            Replace broken vehicle <strong>{currentVehicleNo}</strong> mid-tour. You can assign an available fleet vehicle or hire an external outsourced vehicle.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-5 py-2">
                        {/* Replacement Vehicle Type Switcher */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Replacement Vehicle Source</Label>
                            <Tabs value={swapType} onValueChange={(val) => setSwapType(val as 'FLEET' | 'EXTERNAL')} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="FLEET" className="font-semibold">
                                        🏢 Company Fleet Vehicle
                                    </TabsTrigger>
                                    <TabsTrigger value="EXTERNAL" className="font-semibold">
                                        🤝 Outsourced Hire (External)
                                    </TabsTrigger>
                                </TabsList>

                                {/* Tab 1: Company Fleet Vehicle */}
                                <TabsContent value="FLEET" className="space-y-4 pt-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Select Replacement Vehicle <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            value={selectedFleetVehicleNo}
                                            onChange={(e) => setSelectedFleetVehicleNo(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="">— Select an Available Fleet Vehicle —</option>
                                            {eligibleFleetVehicles.map((v) => (
                                                <option key={v.vehicleNo} value={v.vehicleNo}>
                                                    {v.vehicleNo} {v.model ? `(${v.model})` : ''} - {v.category} {v.seats ? `[${v.seats} seats]` : ''} ({v.status})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            Availability for tour dates will be verified automatically upon confirmation.
                                        </p>
                                    </div>
                                </TabsContent>

                                {/* Tab 2: Outsourced Third-Party Hire */}
                                <TabsContent value="EXTERNAL" className="space-y-4 pt-3">
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 dark:text-amber-300 text-xs">
                                        ℹ️ This vehicle is not in our company fleet. A <strong>Vehicle Expense</strong> entry will be automatically recorded for the hire cost.
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">
                                                External Vehicle Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                placeholder="e.g. WP-CAB-9988"
                                                value={externalVehicleNo}
                                                onChange={(e) => setExternalVehicleNo(e.target.value.toUpperCase())}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Supplier / Vendor Name</Label>
                                            <Input
                                                placeholder="e.g. Kumara Rent A Car"
                                                value={supplierName}
                                                onChange={(e) => setSupplierName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Supplier Contact Number</Label>
                                            <Input
                                                placeholder="e.g. 077 123 4567"
                                                value={supplierPhone}
                                                onChange={(e) => setSupplierPhone(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Hire Cost Amount (Rs.)</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 25000"
                                                value={hireCost}
                                                onChange={(e) => setHireCost(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Expense Charged To</Label>
                                        <div className="flex items-center gap-4 pt-1">
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="expenseType"
                                                    value="COMPANY"
                                                    checked={expenseType === 'COMPANY'}
                                                    onChange={() => setExpenseType('COMPANY')}
                                                    className="accent-primary"
                                                />
                                                <span>Company Operational Expense</span>
                                            </label>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="expenseType"
                                                    value="CUSTOMER"
                                                    checked={expenseType === 'CUSTOMER'}
                                                    onChange={() => setExpenseType('CUSTOMER')}
                                                    className="accent-primary"
                                                />
                                                <span>Customer Chargeable</span>
                                            </label>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Mandatory Odometer Audit Section */}
                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <RefreshCw className="h-4 w-4 text-primary" /> Odometer Readings & Location Audit
                            </h4>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Old Vehicle ({currentVehicleNo}) Breakdown Meter <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="e.g. 45820"
                                        value={breakdownMeterReading}
                                        onChange={(e) => setBreakdownMeterReading(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Meter reading at time of failure.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        New Vehicle Start Meter <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="e.g. 12500"
                                        value={newVehicleStartMeter}
                                        onChange={(e) => setNewVehicleStartMeter(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Initial meter when continuing tour.</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Breakdown Location <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="e.g. Habarana Junction / Kandy Road"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        Defect / Breakdown Reason <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {COMMON_BREAKDOWN_REASONS.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Additional Details / Notes</Label>
                                <Textarea
                                    placeholder="Describe breakdown circumstances, replacement arrangements, or passenger comments..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={markOldVehicleMaintenance}
                                        onChange={(e) => setMarkOldVehicleMaintenance(e.target.checked)}
                                        className="rounded accent-primary"
                                    />
                                    <span>Mark old fleet vehicle ({currentVehicleNo}) status as <strong>MAINTENANCE</strong> in inventory</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleCloseModal} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmSwap} 
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing Swap...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirm Emergency Swap
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
