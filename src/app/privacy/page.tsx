import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - VIGIL',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#060911] text-slate-200 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Privacy & Tenant Data Policy</h1>
                        <p className="text-xs text-slate-400">VIGIL Multi-Tenant Fleet Operations Platform</p>
                    </div>
                </div>

                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <p>
                        VIGIL provides dedicated, tenant-isolated tour management and fleet invoicing infrastructure. Each organization&apos;s data—including customer records, booking schedules, vehicle expense logs, and billing statements—is strictly segregated under cryptographic tenant boundaries.
                    </p>
                    <h2 className="text-sm font-semibold text-white pt-2">Data Isolation & Security</h2>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Multi-tenant database records are scoped strictly by organization ID.</li>
                        <li>Session tokens are encrypted using industry-standard JWT signatures.</li>
                        <li>Customer contact information and driver itineraries are never shared across tenants.</li>
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
