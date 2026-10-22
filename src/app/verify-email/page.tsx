'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyUserEmail } from '@/lib/user-actions';
import { notify } from '@/lib/notifications';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const tokenParam = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailParam);
    const [otpCode, setOtpCode] = useState(tokenParam.length === 6 ? tokenParam : '');
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // If direct token link provided, auto-verify on mount
    useEffect(() => {
        if (tokenParam && emailParam && status === 'idle') {
            handleVerify(emailParam, tokenParam);
        }
    }, [tokenParam, emailParam]);

    const handleVerify = async (targetEmail: string, codeOrToken: string) => {
        if (!targetEmail.trim()) {
            setErrorMessage('Please enter your email address.');
            setStatus('error');
            return;
        }

        if (!codeOrToken.trim()) {
            setErrorMessage('Please enter the 6-digit verification code or token.');
            setStatus('error');
            return;
        }

        setStatus('verifying');
        setErrorMessage('');

        try {
            const res = await verifyUserEmail(targetEmail, codeOrToken);
            if (res.success) {
                setStatus('success');
                notify.success('Email successfully verified! Your account is now active.');
            } else {
                setStatus('error');
                setErrorMessage(res.error || 'Verification failed. The code may be invalid or expired.');
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err?.message || 'A network error occurred. Please try again.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleVerify(email, otpCode);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-lg shadow-primary/5">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">VIGIL Tour Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Open-Source Email Verification Portal</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-xl">
                            {status === 'success' ? 'Email Verified Successfully!' : 'Account Activation'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {status === 'success'
                                ? 'Your email address has been confirmed and your access is now enabled.'
                                : 'Enter your 6-digit verification code below to verify your email address.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === 'verifying' && (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="text-sm text-slate-300 font-medium">Verifying your email token...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-semibold text-emerald-400">Verification Complete</p>
                                    <p className="text-xs text-slate-400">You may now log in to the Vigil console or driver application.</p>
                                </div>
                                <Button asChild className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                                    <Link href="/login">
                                        Proceed to Sign In <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}

                        {(status === 'idle' || status === 'error') && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {status === 'error' && (
                                    <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="yourname@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-950/60 border-slate-800 text-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                                        <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                                        6-Digit OTP Code
                                    </label>
                                    <Input
                                        type="text"
                                        maxLength={32}
                                        placeholder="e.g. 123456"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.trim())}
                                        className="bg-slate-950/60 border-slate-800 text-white text-center font-mono tracking-widest text-lg"
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                                    Verify Email
                                </Button>
                            </form>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2 pt-0 pb-6 text-center border-t border-slate-800/60 text-xs text-slate-400 mt-2">
                        <p className="mt-3">
                            Already verified?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
