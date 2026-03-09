import { Suspense } from 'react';
import { Loader2, UserCircle, Briefcase } from 'lucide-react';
import { getBusinessProfile } from '@/lib/actions';
import { BusinessProfileForm } from '@/components/BusinessProfileForm';
import ProfileForm from '@/components/ProfileForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from '@/lib/prisma';

async function SettingsContent() {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect('/login');
    }

    const result = await getBusinessProfile();
    const profile = result.success ? result.data : undefined;
    
    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and business preferences.</p>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 max-w-md' : 'grid-cols-1 max-w-[200px]'}`}>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> Account
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="business" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Business Profile
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="account" className="pt-4">
                    <ProfileForm user={{ id: user.id, name: user.name, email: user.email, role: user.role }} />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="business" className="pt-4">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold tracking-tight">Business Information</h2>
                            <p className="text-sm text-muted-foreground">
                                These details appear on invoices and reports. Only administrators can modify business settings.
                            </p>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <BusinessProfileForm initialData={profile as any} />
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-10">
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }>
                <SettingsContent />
            </Suspense>
        </div>
    );
}
