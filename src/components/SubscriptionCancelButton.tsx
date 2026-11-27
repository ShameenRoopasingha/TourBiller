'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, XCircle } from 'lucide-react';
import { cancelCompanySubscription } from '@/lib/subscription-actions';
import { notify } from '@/lib/notifications';
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

export function SubscriptionCancelButton({
    planLabel,
    billingCycleLabel,
    renewalDateLabel,
    portalUrl,
}: {
    planLabel: string;
    billingCycleLabel: string;
    renewalDateLabel?: string | null;
    portalUrl: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [fallbackPortalUrl, setFallbackPortalUrl] = useState<string | null>(null);

    const handleConfirmCancel = async () => {
        setLoading(true);
        setError('');
        setFallbackPortalUrl(null);
        try {
            const result = await cancelCompanySubscription(reason);
            if (!result.success) {
                const message = result.error || 'Failed to cancel subscription.';
                notify.error(message);
                setError(message);
                setFallbackPortalUrl(result.portalUrl || portalUrl);
                return;
            }

            notify.success(
                result.remoteBillingCancelled
                    ? 'Subscription cancelled and automatic renewal stopped.'
                    : 'Workspace subscription cancelled.'
            );
            setOpen(false);
            setReason('');
            router.refresh();
        } catch (err) {
            console.error('Failed to cancel subscription:', err);
            const message = 'Unexpected error cancelling subscription. Please try again.';
            notify.error(message);
            setError(message);
            setFallbackPortalUrl(portalUrl);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive">
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Cancel Subscription
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel {planLabel} Subscription?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                You are cancelling your <strong>{planLabel}</strong> ({billingCycleLabel}) plan
                                {renewalDateLabel ? ` scheduled to renew on ${renewalDateLabel}` : ''}.
                            </p>
                            <p>
                                Confirming will stop automatic recurring billing on Bitgard/Dodo and mark this workspace license as <strong>CANCELLED</strong> immediately.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-1.5">
                    <label htmlFor="cancel-sub-reason" className="text-xs font-medium text-foreground">
                        Cancellation reason (optional)
                    </label>
                    <textarea
                        id="cancel-sub-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={200}
                        rows={2}
                        disabled={loading}
                        placeholder="e.g., Seasonal pause, switching tiers, or no longer needed"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>

                {error && (
                    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-1.5">
                        <p>{error}</p>
                        {fallbackPortalUrl && (
                            <a
                                href={fallbackPortalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold underline"
                            >
                                Open Bitgard Billing Portal
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            event.preventDefault();
                            void handleConfirmCancel();
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirm Cancellation
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
