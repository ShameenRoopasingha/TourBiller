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
    AlertCircle
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

const CATEGORIES: { label: string; value: VehicleExpenseCategory; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { label: 'Repair', value: 'REPAIR', icon: Wrench },
    { label: 'Breakdown', value: 'BREAKDOWN', icon: Zap },
    { label: 'Fuel', value: 'FUEL', icon: Fuel },
    { label: 'Service', value: 'SERVICE', icon: Settings },
    { label: 'Oil Change', value: 'OIL_CHANGE', icon: Settings },
    { label: 'Filters', value: 'FILTER_CHANGE', icon: Settings },
    { label: 'Wash', value: 'BODY_WASH', icon: Settings },
    { label: 'Other', value: 'OTHER', icon: MoreHorizontal },
];

export function VehicleExpenseManager({ vehicleNo, bookingId, userRole = 'ADMIN' }: VehicleExpenseManagerProps) {
    const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<VehicleExpenseCategory>('REPAIR');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
                                                {userRole !== 'DRIVER' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                        onClick={() => handleDelete(exp.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
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
