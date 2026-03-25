'use client';

import { useState } from 'react';
import {
    Loader2,
    Wrench,
    Fuel,
    Hotel,
    Car,
    CircleStop,
    AlertTriangle,
    X,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addVehicleExpense } from '@/lib/vehicle-expense-actions';
import { logTripActivity, type TripActivityType } from '@/lib/trip-activity-actions';

interface MacroAction {
    type: TripActivityType;
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    needsAmount: boolean;
    expenseCategory?: string;
    placeholder?: string;
}

const MACRO_ACTIONS: MacroAction[] = [
    {
        type: 'FUEL_FILL', label: 'Fuel Fill', icon: Fuel,
        color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800',
        needsAmount: true, expenseCategory: 'FUEL', placeholder: 'e.g. IOC Kandy - 20L'
    },
    {
        type: 'FLAT_TIRE', label: 'Flat Tire', icon: Wrench,
        color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800',
        needsAmount: true, expenseCategory: 'REPAIR', placeholder: 'e.g. Front left tire replaced'
    },
    {
        type: 'BREAKDOWN', label: 'Breakdown', icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800',
        needsAmount: true, expenseCategory: 'BREAKDOWN', placeholder: 'e.g. Engine overheated near Galle'
    },
    {
        type: 'STOP', label: 'Stop', icon: CircleStop,
        color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800',
        needsAmount: false, placeholder: 'e.g. Lunch stop at Kandy'
    },
    {
        type: 'HOTEL_CHECKIN', label: 'Hotel', icon: Hotel,
        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800',
        needsAmount: false, placeholder: 'e.g. Grand Hotel, Nuwara Eliya'
    },
    {
        type: 'RESUME', label: 'Resume', icon: Car,
        color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800',
        needsAmount: false, placeholder: 'e.g. Continuing to Ella'
    },
];

interface QuickActionSheetProps {
    bookingId: string;
    vehicleNo: string;
    onComplete: () => void;
}

export function QuickActionSheet({ bookingId, vehicleNo, onComplete }: QuickActionSheetProps) {
    const [selectedAction, setSelectedAction] = useState<MacroAction | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!selectedAction) return;
        if (selectedAction.needsAmount && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
            setError('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        setError(null);

        let expenseId: string | undefined;

        // If this macro needs an expense, create it first
        if (selectedAction.needsAmount && selectedAction.expenseCategory) {
            const expenseResult = await addVehicleExpense({
                vehicleNo,
                amount: Number(amount),
                category: selectedAction.expenseCategory as 'FUEL' | 'REPAIR' | 'BREAKDOWN',
                description: note || selectedAction.label,
                date: new Date(),
                bookingId,
                driverId: '',
            });

            if (!expenseResult.success) {
                setError(expenseResult.error || 'Failed to add expense');
                setSubmitting(false);
                return;
            }
            expenseId = expenseResult.data || undefined;
        }

        // Log the trip activity
        const activityResult = await logTripActivity(bookingId, selectedAction.type, note || undefined, expenseId);

        if (activityResult.success) {
            setSuccess(true);
            setTimeout(() => {
                setSelectedAction(null);
                setAmount('');
                setNote('');
                setSuccess(false);
                onComplete();
            }, 1200);
        } else {
            setError(activityResult.error || 'Failed to log activity');
        }
        setSubmitting(false);
    };

    // Success state
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-700 dark:text-green-400">Logged successfully!</p>
            </div>
        );
    }

    // Detail view for a selected macro
    if (selectedAction) {
        const Icon = selectedAction.icon;
        return (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg ${selectedAction.bg} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${selectedAction.color}`} />
                        </div>
                        <h3 className="font-semibold text-lg">{selectedAction.label}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedAction(null); setError(null); }}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {selectedAction.needsAmount && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">Rs.</span>
                            <Input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-12 h-14 text-2xl font-bold text-center"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Note (optional)</label>
                    <Textarea
                        placeholder={selectedAction.placeholder}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="text-sm"
                        autoFocus={!selectedAction.needsAmount}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                )}

                <Button
                    className="w-full h-12 text-base font-semibold"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                        <Icon className="h-5 w-5 mr-2" />
                    )}
                    {selectedAction.needsAmount ? `Log ${selectedAction.label} & Expense` : `Log ${selectedAction.label}`}
                </Button>
            </div>
        );
    }

    // Macro grid
    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-base">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
                {MACRO_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.type}
                            onClick={() => setSelectedAction(action)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 ${action.border} ${action.bg} transition-all active:scale-95 min-h-[80px]`}
                        >
                            <Icon className={`h-7 w-7 mb-1.5 ${action.color}`} />
                            <span className={`text-xs font-semibold ${action.color}`}>{action.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
