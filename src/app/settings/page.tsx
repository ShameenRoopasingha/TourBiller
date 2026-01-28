import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getBusinessProfile } from '@/lib/actions';
import { BusinessProfileForm } from '@/components/BusinessProfileForm';

async function SettingsContent() {
    const result = await getBusinessProfile();
    const profile = result.success ? result.data : undefined;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
            <BusinessProfileForm initialData={profile} />
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
