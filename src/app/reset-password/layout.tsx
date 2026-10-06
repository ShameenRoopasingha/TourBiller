import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Reset Password - VIGIL',
};

export default async function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (session) {
        redirect('/');
    }
    
    return <>{children}</>;
}
