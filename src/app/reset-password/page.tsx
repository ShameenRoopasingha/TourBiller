'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Aurora from '../../../components/reactbits/Aurora';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['700', '900'] });

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [verifying, setVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setVerifying(false);
                setIsValidToken(false);
                return;
            }

            try {
                const response = await fetch(`/api/auth/password-reset?token=${token}`);
                const result = await response.json();
                
                if (response.ok && result.valid) {
                    setIsValidToken(true);
                } else {
                    setIsValidToken(false);
                }
            } catch (error) {
                console.error('Error verifying token:', error);
                setIsValidToken(false);
            } finally {
                setVerifying(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setResetting(true);

        try {
            const formData = new FormData();
            formData.set('token', token!);
            formData.set('password', password);

            const response = await fetch('/api/auth/password-reset', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Failed to reset password. Please try again.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#000510]">
            {/* Extremely Subtle Animated Background */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
                <Aurora 
                    colorStops={["#00b4d8", "#001845", "#023e8a", "#00b4d8"]} 
                    speed={2} 
                    blur={120} 
                />
            </div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,180,216,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>

            <div className="dark w-full max-w-md shrink-0 mx-auto relative z-10">
                <Card className="w-full shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-black/70 backdrop-blur-2xl border-cyan-500/40 overflow-hidden text-slate-100 relative">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <CardHeader className="text-center space-y-4 pb-4 pt-10">
                        <div className="mx-auto flex flex-col items-center justify-center gap-4">
                            <div className="relative bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,180,216,0.4)] border-2 border-white/50">
                                <div className="absolute inset-0 bg-white rounded-3xl z-0"></div>
                                <Image src="/logo-icon.png" alt="VIGIL Logo Icon" width={72} height={72} className="h-16 w-auto relative z-10 object-contain" priority />
                            </div>
                            <div className="flex flex-col items-center mt-2 drop-shadow-lg">
                                <CardTitle className={`text-3xl font-black tracking-tight text-white pb-1 ${montserrat.className}`}>VIGIL</CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        {verifying ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
                                <p className="text-slate-300 font-medium">Verifying reset link...</p>
                            </div>
                        ) : !isValidToken ? (
                            <div className="text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                    <AlertCircle className="h-8 w-8 text-red-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Invalid or expired link</h3>
                                    <p className="text-sm text-slate-300">
                                        This password reset link is invalid or has expired. Please request a new one.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full h-12 mt-6 bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-bold" asChild>
                                    <Link href="/forgot-password">Request new link</Link>
                                </Button>
                            </div>
                        ) : success ? (
                            <div className="text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(0,180,216,0.3)]">
                                    <CheckCircle2 className="h-8 w-8 text-cyan-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Password reset complete</h3>
                                    <p className="text-sm text-slate-300">
                                        Your password has been successfully reset. You can now log in with your new password.
                                    </p>
                                </div>
                                <Button className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold" asChild>
                                    <Link href="/login">Go to login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="text-center space-y-2 mb-6">
                                    <h2 className="text-xl font-bold text-white flex justify-center items-center gap-2">
                                        <KeyRound className="w-5 h-5 text-cyan-400" />
                                        Create New Password
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        Enter your new password below.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-100 text-sm text-center font-bold shadow-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold text-white tracking-wide">New Password</label>
                                    <PasswordInput
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-black/50 border-cyan-500/40 text-white font-medium placeholder:text-slate-400 focus-visible:ring-cyan-500 shadow-inner"
                                        disabled={resetting}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold text-white tracking-wide">Confirm Password</label>
                                    <PasswordInput
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-12 bg-black/50 border-cyan-500/40 text-white font-medium placeholder:text-slate-400 focus-visible:ring-cyan-500 shadow-inner"
                                        disabled={resetting}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base border border-cyan-400/50 shadow-[0_0_20px_rgba(0,180,216,0.6)] transition-all duration-300" 
                                    disabled={resetting || !password || !confirmPassword}
                                >
                                    {resetting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Reset Password
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
