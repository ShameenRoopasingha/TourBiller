'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Loader2,
    Plus,
    Trash2,
    Wrench,
    Zap,
    Fuel,
    Settings,
    MoreHorizontal,
    AlertCircle,
    Car,
    ChevronDown,
    ChevronUp,
    Droplets,
    Filter,
    Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import {
    addVehicleExpense,
    getVehicleExpenses,
    deleteVehicleExpense,
    type VehicleExpense,
    type VehicleExpenseCategory
} from '@/lib/vehicle-expense-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface VehicleExpenseManagerProps {
    vehicleNo: string;
    bookingId?: string;
    userRole?: string;
}

const CATEGORIES: { label: string; value: VehicleExpenseCategory; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; bg: string }[] = [
    { label: 'Repair', value: 'REPAIR', icon: Wrench, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' },
    { label: 'Breakdown', value: 'BREAKDOWN', icon: Zap, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
    { label: 'Fuel', value: 'FUEL', icon: Fuel, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Service', value: 'SERVICE', icon: Settings, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    { label: 'Oil Change', value: 'OIL_CHANGE', icon: Droplets, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    { label: 'Filters', value: 'FILTER_CHANGE', icon: Filter, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
    { label: 'Wash', value: 'BODY_WASH', icon: Sparkles, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
    { label: 'Other', value: 'OTHER', icon: MoreHorizontal, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/40' },
];

export function VehicleExpenseManager({ vehicleNo, bookingId, userRole = 'ADMIN' }: VehicleExpenseManagerProps) {
    const isDriver = userRole === 'DRIVER';
    const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<VehicleExpenseCategory>('REPAIR');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showDescription, setShowDescription] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        const result = await getVehicleExpenses(vehicleNo);
        if (result.success && result.data) {
            setExpenses(result.data);
        } else {
            setError(result.error || 'Failed to fetch expenses');
        }
        setLoading(false);
    }, [vehicleNo]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getVehicleExpenses(vehicleNo);
                if (isMounted) {
                    if (result.success && result.data) {
                        setExpenses(result.data);
                    } else {
                        setError(result.error || 'Failed to fetch expenses');
                    }
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchData();
        return () => {
            isMounted = false;
        };
    }, [vehicleNo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) {
            setError('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(false);

        const result = await addVehicleExpense({
            vehicleNo,
            amount: Number(amount),
            category,
            description,
            date: new Date(date),
            bookingId: bookingId || '',
            driverId: '',
        });

        if (result.success) {
            setAmount('');
            setDescription('');
            setShowDescription(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            fetchExpenses();
        } else {
            setError(result.error || 'Failed to add expense');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        const result = await deleteVehicleExpense(id);
        if (result.success) {
            fetchExpenses();
        } else {
            setError(result.error || 'Failed to delete expense');
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // ===== MOBILE LAYOUT (for drivers) =====
    if (isDriver) {
        return (
            <div className="space-y-5">
                {/* Add Expense Form */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Add Expense</CardTitle>
                        <CardDescription>Tap a category and enter the amount</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Category Grid — 2x4 large icon tiles */}
                            <div className="grid grid-cols-4 gap-2">
                                {CATEGORIES.map((cat) => {
                                    const isSelected = category === cat.value;
                                    return (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setCategory(cat.value)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-h-[72px] ${
                                                isSelected
                                                    ? `${cat.bg} border-current ${cat.color} shadow-sm scale-[1.02]`
                                                    : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <cat.icon className={`h-6 w-6 mb-1 ${isSelected ? cat.color : ''}`} />
                                            <span className="text-[10px] font-semibold leading-tight text-center">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Amount Input — Large */}
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">Rs.</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="pl-12 h-14 text-2xl font-bold text-center"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Optional Description Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowDescription(!showDescription)}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showDescription ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Add a note (optional)
                            </button>
                            {showDescription && (
                                <Textarea
                                    placeholder="e.g. Front tire puncture near Kandy..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                />
                            )}

                            {/* Date Toggle */}
                            <button
                                type="button"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showDatePicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Change date (default: today)
                            </button>
                            {showDatePicker && (
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-12"
                                />
                            )}

                            {/* Error / Success messages */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                                    <AlertDescription className="text-green-700 dark:text-green-400 font-medium">
                                        ✅ Expense added successfully!
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button — big and prominent */}
                            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                                Add Expense
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Expense History — Card based */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-semibold">Expense History</h3>
                        {expenses.length > 0 && (
                            <span className="text-sm font-bold text-red-500">
                                Total: Rs. {totalExpenses.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-10 text-center">
                                <Car className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {expenses.map((exp) => {
                                const config = CATEGORIES.find(c => c.value === exp.category) || CATEGORIES[CATEGORIES.length - 1];
                                return (
                                    <Card key={exp.id} className="overflow-hidden">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                                <config.icon className={`h-5 w-5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{config.label}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {exp.description || format(new Date(exp.date), 'dd MMM yyyy')}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold">Rs. {exp.amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {format(new Date(exp.date), 'dd MMM')}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ===== ADMIN / DESKTOP LAYOUT (original) =====
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add New Expense</CardTitle>
                    <CardDescription>Record a new repair, breakdown, or fuel charge for {vehicleNo}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (Rs.)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <Button
                                        key={cat.value}
                                        type="button"
                                        variant={category === cat.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCategory(cat.value)}
                                        className="flex items-center gap-1"
                                    >
                                        <cat.icon className="h-3 w-3" />
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Details about the repair or fuel station..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Add Expense
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-lg">Expense History</CardTitle>
                        <CardDescription>Past records for this vehicle</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg border-dashed">
                            <p className="text-muted-foreground">No expenses recorded yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((exp) => (
                                        <TableRow key={exp.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(exp.date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${exp.category === 'REPAIR' ? 'bg-orange-100 text-orange-700' :
                                                    exp.category === 'BREAKDOWN' ? 'bg-red-100 text-red-700' :
                                                        exp.category === 'FUEL' ? 'bg-blue-100 text-blue-700' :
                                                            exp.category === 'SERVICE' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {exp.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[150px]">
                                                {exp.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                Rs. {exp.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                    onClick={() => handleDelete(exp.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
