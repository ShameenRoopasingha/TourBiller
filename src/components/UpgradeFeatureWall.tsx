'use client';

import Link from 'next/link';
import { Lock, ArrowUpRight, Settings, ShieldCheck } from 'lucide-react';

interface UpgradeFeatureWallProps {
    featureName: string;
    description: string;
    requiredTier?: 'Professional' | 'Enterprise';
    currentPlan?: string;
    upgradeHref?: string;
}

export function UpgradeFeatureWall({
    featureName,
    description,
    requiredTier = 'Professional',
    currentPlan = 'Starter',
    upgradeHref = 'https://bitgard.vercel.app/checkout/vigil?tier=professional',
}: UpgradeFeatureWallProps) {
    return (
        <div className="max-w-2xl mx-auto my-8 rounded-2xl border border-amber-500/30 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{requiredTier} Plan Feature</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                        {featureName}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border/60 p-4 text-xs sm:text-sm text-muted-foreground">
                Your workspace is currently on the{' '}
                <span className="font-semibold text-foreground">{currentPlan}</span> plan. Upgrade to{' '}
                <span className="font-semibold text-amber-400">{requiredTier}</span> or{' '}
                <span className="font-semibold text-amber-400">Enterprise</span> to unlock this capability along with up to 25–75 vehicles and multiple admin workstations.
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                    href={upgradeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow transition"
                >
                    <span>Upgrade to {requiredTier}</span>
                    <ArrowUpRight className="w-4 h-4" />
                </a>
                <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background/60 hover:bg-muted text-foreground font-medium text-sm transition"
                >
                    <Settings className="w-4 h-4" />
                    <span>View Current Plan</span>
                </Link>
            </div>
        </div>
    );
}
