import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCompanySubscriptionStatus } from '@/lib/subscription';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { SignOutButton } from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function SubscriptionRequiredPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const companyId = (session.user as { companyId?: string }).companyId;
  const subState = companyId ? await getCompanySubscriptionStatus(companyId) : null;

  if (subState && (!subState.enforcementActive || subState.active)) {
    redirect('/');
  }

  const portalUrl =
    process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vigil';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-destructive/40 bg-card p-8 shadow-xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Subscription Inactive or Expired
          </h1>
          <p className="text-sm text-muted-foreground">
            Your workspace subscription ({subState?.entitlements.label || 'Starter'}
            {subState?.billingCycle ? ` • ${subState.billingCycle}` : ''}) is currently{' '}
            <strong className="text-foreground">
              {subState?.status || 'NONE'}
            </strong>
            {subState?.currentPeriodEnd
              ? ` (period end: ${new Date(subState.currentPeriodEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })})`
              : ''}
            . Renew or activate a Vigil plan on Bitgard to restore workspace access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
          >
            <span>Manage Subscription on Bitgard</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <div className="inline-flex items-center justify-center">
            <SignOutButton />
          </div>
        </div>

        <div className="pt-3 border-t border-border text-xs text-muted-foreground">
          Already renewed?{' '}
          <Link href="/" className="text-primary hover:underline font-medium">
            Re-check Subscription Status
          </Link>
        </div>
      </div>
    </div>
  );
}
