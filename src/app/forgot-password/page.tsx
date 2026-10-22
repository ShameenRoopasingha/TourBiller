'use client';

import { useState, useRef, FormEvent } from 'react';
import { 
    Mail, 
    ArrowLeft, 
    KeyRound, 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ShieldCheck,
    ArrowRight,
    ExternalLink,
    Globe
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
    const bitgardPortalUrl = process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vehicle-hire';
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [devResetLink, setDevResetLink] = useState('');
    const [devOtpCode, setDevOtpCode] = useState('');
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 200, y: 200 });

    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.set('email', email);

        try {
            const response = await fetch('/api/auth/password-reset/request', { 
                method: 'POST', 
                body: formData 
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSuccess(true);
                if (result.resetLink || result.data?.resetLink) {
                    setDevResetLink(result.resetLink || result.data?.resetLink);
                }
                if (result.otpCode || result.data?.otpCode) {
                    setDevOtpCode(result.otpCode || result.data?.otpCode);
                }
            } else {
                setError(result.error || 'Failed to request password reset link.');
            }
        } catch {
            setError('Recovery service unreachable. Please try again shortly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8 overflow-x-hidden bg-[#040504] text-slate-100 font-sans antialiased">
            {/* Ambient Multi-Layer Architectural Lighting (Bitgard Matte Orange & Amber) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full opacity-35 blur-[140px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(232, 115, 42, 0.28) 0%, rgba(153, 71, 22, 0.12) 50%, transparent 75%)' }}
                />
                <div 
                    className="absolute -bottom-[20%] right-[-10%] w-[700px] h-[500px] rounded-full opacity-25 blur-[150px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(68, 31, 10, 0.08) 50%, transparent 70%)' }}
                />

                {/* Subtle Geometric Precision Grid */}
                <div 
                    className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)'
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 xl:gap-14 my-auto py-2 sm:py-4">
                {/* Left Side: Brand Context */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="hidden lg:flex flex-col w-full max-w-lg space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0B0D]/90 border border-white/10 shadow-sm backdrop-blur-md self-start">
                        <KeyRound className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-semibold tracking-wide text-slate-300">
                            Cryptographic Credential Recovery
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Restore access to your operations workspace.
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                            Security tokens and reset links are dispatched exclusively to verified enterprise email accounts under active domain records.
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Security Notice
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Password reset tokens expire within 60 minutes of generation. For urgent access re-authentication or fleet credential provisioning, contact your system administrator.
                        </p>
                    </div>
                </motion.div>

                {/* Right Side: Recovery Terminal */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm sm:max-w-md shrink-0 relative"
                >
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-[#E8732A]/25 via-[#E8732A]/5 to-transparent blur-xl pointer-events-none opacity-80" />

                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        className="relative rounded-2xl bg-[#090B10]/95 border border-white/[0.12] p-5 sm:p-6 lg:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundImage: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232, 115, 42, 0.14), transparent 50%)`,
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8732A] to-transparent opacity-90" />

                        {/* Emblem */}
                        <div className="flex flex-col items-center text-center space-y-2.5 mb-5">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-[#E8732A]/25 rounded-2xl blur-md group-hover:bg-[#E8732A]/35 transition-all duration-300" />
                                <div className="relative p-2 rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_16px_rgba(232,115,42,0.3)] border border-white shrink-0">
                                    <Image 
                                        src="/logo-icon.png" 
                                        alt="VIGIL Platform Icon" 
                                        width={40} 
                                        height={40} 
                                        className="h-9 w-auto object-contain" 
                                        priority 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-2xl font-black tracking-[0.22em] text-white font-heading uppercase pl-[0.22em]">
                                    VIGIL
                                </span>
                                <h2 className="text-[11px] font-mono font-bold text-primary uppercase tracking-[0.16em]">
                                    Account Recovery
                                </h2>
                                <p className="text-xs text-slate-400 font-sans font-normal">
                                    Enter your work email address to receive a secure reset link
                                </p>
                            </div>
                        </div>

                        {success ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4 text-center py-2"
                            >
                                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-white">6-Digit OTP Dispatched</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        If an active account corresponds to <span className="font-semibold text-primary">{email}</span>, a 6-digit reset OTP code and secure link have been dispatched.
                                    </p>
                                </div>

                                {devOtpCode && (
                                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary-200 text-center space-y-2 my-2">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                            Local Mode Reset OTP Code
                                        </div>
                                        <div className="text-2xl font-black tracking-[0.25em] text-white font-mono bg-[#06070A] py-2 rounded-lg border border-white/10">
                                            {devOtpCode}
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            Use this 6-digit code on the reset page or click the link below:
                                        </p>
                                    </div>
                                )}

                                {devResetLink && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs text-left space-y-2 my-1">
                                        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Direct Local Link</span>
                                        </div>
                                        <a 
                                            href={devResetLink}
                                            className="w-full h-8 inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-colors shadow-sm"
                                        >
                                            Reset Password Directly Now &rarr;
                                        </a>
                                    </div>
                                )}

                                <Link 
                                    href={`/reset-password?email=${encodeURIComponent(email)}`}
                                    className="w-full h-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#F17E34] via-[#E8732A] to-[#D15F18] hover:from-[#EC8353] hover:to-[#C75C1D] text-white font-semibold text-xs shadow-md transition-colors"
                                >
                                    Enter 6-Digit OTP to Reset Now &rarr;
                                </Link>

                                <Link 
                                    href="/login" 
                                    className="w-full h-9 inline-flex items-center justify-center rounded-xl bg-[#0E1015] hover:bg-[#151821] text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                                    Return to Console Login
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                {/* Option 1: Official Bitgard Portal for Admins & Owners */}
                                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#180F08] via-[#100D0A] to-[#0A0B0D] border border-primary/30 space-y-2 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                            <Globe className="w-3.5 h-3.5 text-primary" />
                                            <span>Bitgard &bull; Vigil Product Portal</span>
                                        </div>
                                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                            Admin / Owner
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        Admins who registered & subscribed via Bitgard can retrieve licenses and manage credentials on the official Vigil product portal:
                                    </p>
                                    <a 
                                        href={bitgardPortalUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full h-8.5 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                                    >
                                        <span>Open Vigil on Official Bitgard Website</span>
                                        <ExternalLink className="w-3.5 h-3.5 text-primary-200" />
                                    </a>
                                </div>

                                {/* Divider */}
                                <div className="relative flex items-center justify-center my-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                                    <span className="relative bg-[#090B10] px-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                        OR In-App 6-Digit Email OTP
                                    </span>
                                </div>

                                {/* Option 2: 6-Digit OTP for Drivers & Local Accounts */}
                                <form onSubmit={handleSubmit} className="space-y-3">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -6, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -6, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 shadow-sm"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                            <div className="flex-1 font-medium leading-relaxed">{error}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center justify-between">
                                        <span>Work Email Address</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Required</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            placeholder="dispatch@vigiltours.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-[#06070A]/85 border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-[#080A0F] transition-all duration-200 shadow-inner disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full h-10 mt-3 relative group rounded-xl bg-gradient-to-b from-[#F17E34] via-[#E8732A] to-[#D15F18] hover:from-[#EC8353] hover:to-[#C75C1D] text-white font-semibold text-xs sm:text-sm shadow-[0_6px_20px_rgba(232,115,42,0.38),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                            <span>Issuing 6-digit OTP code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send 6-Digit OTP & Reset Link</span>
                                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="text-center pt-2">
                                    <Link 
                                        href="/login" 
                                        className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Back to sign in</span>
                                    </Link>
                                </div>
                            </form>
                        </div>
                    )}

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-center">
                            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">
                                Enterprise-grade 256-bit SSL encryption
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
