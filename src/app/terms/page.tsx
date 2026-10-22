import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Security Standard - VIGIL',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#060911] text-slate-200 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Security Standard & Service Terms</h1>
                        <p className="text-xs text-slate-400">Operational Compliance & Tenant Governance</p>
                    </div>
                </div>

                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <p>
                        Access to the VIGIL dispatch and tour management platform is restricted to authorized personnel of licensed tenant organizations. All API transactions and administrative actions are logged and audited.
                    </p>
                    <h2 className="text-sm font-semibold text-white pt-2">Authorized Use & Governance</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Each organization account must maintain verified administrative credentials.</li>
                        <li>Automated billing calculations and kilometer meter logs are generated for commercial accountability.</li>
                        <li>Rate limits are enforced on all public authentication gateways to prevent unauthorized credential stuffing.</li>
                    </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <Link 
                        href="/login" 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Return to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
