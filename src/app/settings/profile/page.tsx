import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from './ProfileForm';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
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

    return (
        <div className="container mx-auto max-w-2xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground">Manage your account details and password.</p>
            </div>

            <ProfileForm user={{ id: user.id, name: user.name, email: user.email, role: user.role }} />
        </div>
    );
}
