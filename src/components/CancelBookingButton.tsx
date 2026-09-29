'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CancelBookingButton({
    bookingId,
    customerName,
    redirectAfterSuccess = false,
}: {
    bookingId: string;
    customerName: string;
    redirectAfterSuccess?: boolean;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');

    const handleCancel = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { method: 'PATCH' });
            const result = await response.json();
            if (!response.ok || !result.success) {
                setError(result.error || 'Failed to cancel booking');
                return;
            }
            setOpen(false);
            router.refresh();
            if (redirectAfterSuccess) router.push('/bookings');
        } catch (requestError) {
            console.error('Error cancelling booking:', requestError);
            setError('Failed to cancel booking. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <CalendarX className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently cancel the booking for {customerName}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            void handleCancel();
                        }}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Yes, cancel it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}