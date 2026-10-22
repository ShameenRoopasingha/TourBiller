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
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#040504] font-sans antialiased">
            {/* Ambient Multi-Layer Architectural Lighting (Bitgard Matte Orange & Amber) */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div 
                    className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full opacity-35 blur-[140px]"
                    style={{ background: 'radial-gradient(circle, rgba(232, 115, 42, 0.28) 0%, rgba(153, 71, 22, 0.12) 50%, transparent 75%)' }}
                />
                <div 
                    className="absolute -bottom-[20%] right-[-10%] w-[700px] h-[500px] rounded-full opacity-25 blur-[150px]"
                    style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(68, 31, 10, 0.08) 50%, transparent 70%)' }}
                />
            </div>
            
            {/* Grid overlay */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 sm:px-8">
                
                {/* Left Side: Hero Text & Branding */}
                <div className="hidden lg:flex flex-col w-full max-w-xl text-white space-y-8 drop-shadow-2xl">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono uppercase tracking-wider backdrop-blur-md shadow-lg">
                            <KeyRound className="w-4 h-4 text-primary" />
                            <span>Universal Credential Recovery</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-[-0.03em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight font-subheading">
                            Reset Your <br/> <span className="text-primary">Secure Access.</span>
                        </h1>
                        <p className="text-base xl:text-lg text-white/90 leading-relaxed font-sans font-normal max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            Verify your identity using your 6-digit OTP code or direct secure link to regain immediate console access.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#090B10]/80 border border-white/10 backdrop-blur-md space-y-2 max-w-md">
                        <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
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
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-[#E8732A]/25 via-[#E8732A]/5 to-transparent blur-xl pointer-events-none opacity-80" />
                    <Card className="w-full shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] bg-[#090B10]/95 backdrop-blur-2xl border-white/[0.12] overflow-hidden text-slate-100 relative">
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8732A] to-transparent opacity-90" />
                        
                        <CardHeader className="text-center space-y-3 pb-3 pt-8">
                            <div className="mx-auto flex flex-col items-center justify-center gap-2">
                                <div className="relative group">
                                    <div className="absolute -inset-1.5 bg-[#E8732A]/25 rounded-2xl blur-md group-hover:bg-[#E8732A]/35 transition-all duration-300" />
                                    <div className="relative bg-white p-3 rounded-2xl shadow-sm border border-white shrink-0">
                                        <Image src="/logo-icon.png" alt="VIGIL Logo Icon" width={60} height={60} className="h-12 w-auto relative z-10 object-contain" priority />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-black tracking-[0.22em] text-white font-heading uppercase pl-[0.22em]">VIGIL</CardTitle>
                                <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.16em]">Password Reset & Account Recovery</p>
                            </div>
                        </CardHeader>

                        <CardContent className="px-6 pb-8">
                            {verifying ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 relative z-10">
                                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    <p className="text-slate-400 font-medium text-sm">Verifying one-time reset link...</p>
                                </div>
                            ) : success ? (
                                <div className="text-center space-y-5 relative z-10 py-2">
                                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-bold text-white">Password Reset Complete</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Your password has been securely updated. You can now sign in to your workspace using your new password.
                                        </p>
                                    </div>
                                    <Button className="w-full h-11 mt-4 bg-gradient-to-b from-[#F17E34] via-[#E8732A] to-[#D15F18] hover:from-[#EC8353] hover:to-[#C75C1D] text-white font-bold text-sm border-none shadow-[0_6px_20px_rgba(232,115,42,0.38)]" asChild>
                                        <Link href="/login">Sign In Now &rarr;</Link>
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    {/* Mode Indicator / Switcher */}
                                    <div className="flex items-center justify-between p-1 bg-[#06070A] rounded-lg border border-white/10 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setMode('otp')}
                                            className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'otp' ? 'bg-primary shadow text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            6-Digit OTP Code
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('token')}
                                            disabled={!token}
                                            className={`flex-1 py-1.5 rounded-md transition-all ${mode === 'token' ? 'bg-primary shadow text-white font-bold' : 'text-slate-500 cursor-not-allowed'}`}
                                        >
                                            Direct Link {token ? '✓' : ''}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-center font-medium shadow-sm flex items-center justify-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* If OTP mode: require email and 6-digit OTP code */}
                                    {mode === 'otp' && (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-300 tracking-wide flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-primary" />
                                                    <span>Work Email Address</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="admin@vigiltours.com"
                                                    required
                                                    disabled={resetting}
                                                    className="w-full h-10 px-3 rounded-lg bg-[#06070A]/85 border border-white/10 text-slate-100 text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-300 tracking-wide flex items-center justify-between">
                                                    <span>6-Digit Reset OTP Code</span>
                                                    <span className="text-[10px] text-primary font-semibold">Sent to Email</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                    placeholder="123456"
                                                    required
                                                    disabled={resetting}
                                                    className="w-full h-11 text-center font-mono font-black text-xl tracking-[0.3em] rounded-lg bg-[#06070A] border border-primary/40 text-primary placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {mode === 'token' && isValidToken && (
                                        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                            <span>One-time secure link verified successfully</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-300 tracking-wide">New Password</label>
                                        <PasswordInput
                                            placeholder="Enter at least 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-10 bg-[#06070A]/85 border-white/10 text-slate-100 text-xs font-medium placeholder:text-slate-500 focus-visible:ring-primary shadow-inner"
                                            disabled={resetting}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-300 tracking-wide">Confirm New Password</label>
                                        <PasswordInput
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="h-10 bg-[#06070A]/85 border-white/10 text-slate-100 text-xs font-medium placeholder:text-slate-500 focus-visible:ring-primary shadow-inner"
                                            disabled={resetting}
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full h-11 mt-3 bg-gradient-to-b from-[#F17E34] via-[#E8732A] to-[#D15F18] hover:from-[#EC8353] hover:to-[#C75C1D] text-white font-bold text-xs sm:text-sm border-none shadow-[0_6px_20px_rgba(232,115,42,0.38)] transition-all duration-200 cursor-pointer" 
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
                                            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                            <span>Request fresh OTP code</span>
                                        </Link>

                                        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-center gap-1.5 text-center">
                                            <Globe className="w-3 h-3 text-primary shrink-0" />
                                            <span className="text-[11px] text-slate-400">
                                                Admin account on Bitgard?{' '}
                                                <a 
                                                    href={process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vehicle-hire'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-primary hover:text-primary-300 underline inline-flex items-center gap-0.5"
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
            <div className="min-h-screen bg-[#040504] flex items-center justify-center text-white">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
