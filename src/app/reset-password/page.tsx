'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Mail, ShieldCheck, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Aurora from '../../../components/reactbits/Aurora';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const initialEmail = searchParams.get('email') || '';

    // If token is present, start in token verification mode; otherwise start in OTP mode
    const [mode, setMode] = useState<'token' | 'otp'>(token ? 'token' : 'otp');
    const [verifying, setVerifying] = useState(!!token);
    const [isValidToken, setIsValidToken] = useState(false);

    // Form inputs
    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Auto-verify token if present in URL
    useEffect(() => {
        if (!token) {
            setVerifying(false);
            setIsValidToken(false);
            return;
        }

        const checkToken = async () => {
            try {
                const response = await fetch(`/api/auth/password-reset?token=${encodeURIComponent(token)}`);
                const result = await response.json();
                
                if (response.ok && (result.valid || result.data === true)) {
                    setIsValidToken(true);
                    setMode('token');
                } else {
                    setIsValidToken(false);
                    // Automatically offer OTP mode if link is invalid or expired
                    setMode('otp');
                }
            } catch (err) {
                console.error('Error verifying token:', err);
                setIsValidToken(false);
                setMode('otp');
            } finally {
                setVerifying(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'otp') {
            if (!email.trim()) {
                setError('Please provide your work email address');
                return;
            }
            if (!otpCode.trim() || otpCode.trim().length < 6) {
                setError('Please enter the 6-digit OTP code sent to your email');
                return;
            }
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setResetting(true);

        try {
            const formData = new FormData();
            if (mode === 'token' && isValidToken) {
                formData.set('token', token);
            } else {
                formData.set('email', email.trim().toLowerCase());
                formData.set('otpCode', otpCode.trim());
            }
            formData.set('password', password);

            const response = await fetch('/api/auth/password-reset', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to reset password. Please verify your OTP code.');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
            setError('Failed to reset password. Please check connection and try again.');
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#000510]">
            {/* Subtle Animated Background */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
                <Aurora 
                    colorStops={["#00b4d8", "#001845", "#023e8a", "#00b4d8"]} 
                    speed={2} 
                    blur={120} 
                />
            </div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,180,216,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 sm:px-8">
                
                {/* Left Side: Hero Text & Branding */}
                <div className="hidden lg:flex flex-col w-full max-w-xl text-white space-y-8 drop-shadow-2xl">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-900/40 border border-cyan-400/30 text-cyan-50 text-sm font-semibold backdrop-blur-md shadow-lg">
                            <KeyRound className="w-4 h-4 text-cyan-400" />
                            <span>Universal Credential Recovery</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
                            Reset Your <br/> <span className="text-cyan-400">Secure Access.</span>
                        </h1>
                        <p className="text-lg xl:text-xl text-white/95 leading-relaxed font-medium max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            Verify your identity using your 6-digit OTP code or direct secure link to regain immediate console access.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-2 max-w-md">
                        <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Zero-Lockout Security</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Admins, owners, and drivers can reset access at any time using standard email OTP codes without relying on an active dashboard session.
                        </p>
                    </div>
                </div>

                {/* Right Side Card */}
                <div className="w-full max-w-md shrink-0 mx-auto lg:mx-0 relative z-10">
                    <Card className="w-full shadow-[0_16px_60px_rgba(0,0,0,0.4)] bg-white/95 backdrop-blur-3xl border-white/80 overflow-hidden text-slate-900 relative">
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none"></div>
                        
                        <CardHeader className="text-center space-y-3 pb-3 pt-8">
                            <div className="mx-auto flex flex-col items-center justify-center gap-2">
                                <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-slate-100 group">
                                    <Image src="/logo-icon.png" alt="VIGIL Logo Icon" width={60} height={60} className="h-12 w-auto relative z-10 object-contain" priority />
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 font-montserrat">VIGIL</CardTitle>
                                <p className="text-xs text-slate-500 font-medium">Password Reset & Account Recovery</p>
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 pb-8">
                            {verifying ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 relative z-10">
                                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                    <p className="text-slate-600 font-medium text-sm">Verifying one-time reset link...</p>
                                </div>
                            ) : success ? (
                                <div className="text-center space-y-5 relative z-10 py-2">
                                    <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-bold text-slate-900">Password Reset Complete</h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Your password has been securely updated. You can now sign in to your workspace using your new password.
                                        </p>
                                    </div>
                                    <Button className="w-full h-11 mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm border-none shadow-md" asChild>
                                        <Link href="/login">Sign In Now &rarr;</Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    {/* Mode Indicator / Switcher */}
                                    <div className="flex items-center justify-between p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setMode('otp')}
                                            className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'otp' ? 'bg-white shadow text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            6-Digit OTP Code
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('token')}
                                            disabled={!token}
                                            className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'token' ? 'bg-white shadow text-blue-700' : 'text-slate-400 cursor-not-allowed'}`}
                                        >
                                            Direct Link {token ? '✓' : ''}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium shadow-sm flex items-center justify-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* If OTP mode: require email and 6-digit OTP code */}
                                    {mode === 'otp' && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>Work Email Address</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="admin@vigiltours.com"
                                                    required
                                                    disabled={resetting}
                                                    className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center justify-between">
                                                    <span>6-Digit Reset OTP Code</span>
                                                    <span className="text-[10px] text-blue-600 font-semibold">Sent to Email</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                    placeholder="123456"
                                                    required
                                                    disabled={resetting}
                                                    className="w-full h-11 text-center font-mono font-black text-xl tracking-[0.3em] rounded-lg bg-slate-50 border border-blue-200 text-blue-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {mode === 'token' && isValidToken && (
                                        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>One-time secure link verified successfully</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 tracking-wide">New Password</label>
                                        <PasswordInput
                                            placeholder="Enter at least 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-10 bg-slate-50 border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus-visible:ring-blue-500 shadow-inner"
                                            disabled={resetting}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 tracking-wide">Confirm New Password</label>
                                        <PasswordInput
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-10 bg-slate-50 border-slate-200 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus-visible:ring-blue-500 shadow-inner"
                                            disabled={resetting}
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 mt-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs sm:text-sm border-none shadow-md transition-all duration-200 cursor-pointer" 
                                        disabled={resetting || !password || !confirmPassword || (mode === 'otp' && (!email || otpCode.length < 6))}
                                    >
                                        {resetting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Resetting Password...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Save New Password
                                            </>
                                        )}
                                    </Button>

                                    <div className="text-center pt-1 space-y-2">
                                        <Link 
                                            href="/forgot-password" 
                                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                            <span>Request fresh OTP code</span>
                                        </Link>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-center">
                                            <Globe className="w-3 h-3 text-cyan-600 shrink-0" />
                                            <span className="text-[11px] text-slate-500">
                                                Admin account on Bitgard?{' '}
                                                <a 
                                                    href={process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vehicle-hire'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-cyan-600 hover:text-cyan-700 underline inline-flex items-center gap-0.5"
                                                >
                                                    Manage on Bitgard Portal <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            </span>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#000510] flex items-center justify-center text-white">
                <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
