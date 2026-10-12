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
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Montserrat, Plus_Jakarta_Sans } from 'next/font/google';

const montserrat = Montserrat({ 
    subsets: ['latin'], 
    weight: ['600', '700', '800', '900'] 
});

const plusJakarta = Plus_Jakarta_Sans({ 
    subsets: ['latin'], 
    weight: ['400', '500', '600', '700'] 
});

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
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
        <div className={`relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8 overflow-x-hidden bg-[#060911] text-slate-100 ${plusJakarta.className}`}>
            {/* Ambient Multi-Layer Architectural Lighting */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full opacity-30 blur-[130px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(30, 58, 138, 0.2) 50%, transparent 75%)' }}
                />
                <div 
                    className="absolute -bottom-[20%] right-[-10%] w-[700px] h-[500px] rounded-full opacity-20 blur-[140px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(30, 64, 175, 0.15) 50%, transparent 70%)' }}
                />

                {/* Subtle Geometric Precision Grid */}
                <div 
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm backdrop-blur-md self-start">
                        <KeyRound className="w-3.5 h-3.5 text-blue-400" />
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
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-blue-500/20 via-blue-600/5 to-transparent blur-xl pointer-events-none opacity-75" />

                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        className="relative rounded-2xl bg-[#0c121f]/90 border border-slate-700/60 p-5 sm:p-6 lg:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundImage: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.12), transparent 50%)`,
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80" />

                        {/* Emblem */}
                        <div className="flex flex-col items-center text-center space-y-2.5 mb-5">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-blue-500/25 rounded-2xl blur-md group-hover:bg-blue-400/35 transition-all duration-300" />
                                <div className="relative p-2 rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.35),0_0_12px_rgba(59,130,246,0.25)] border border-white shrink-0">
                                    <Image 
                                        src="/logo-icon.png" 
                                        alt="VIGIL Platform Icon" 
                                        width={36} 
                                        height={36} 
                                        className="h-8 w-auto object-contain" 
                                        priority 
                                    />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <span className={`text-2xl font-black tracking-tight text-white ${montserrat.className}`}>
                                    VIGIL
                                </span>
                                <h2 className="text-sm font-semibold text-slate-200">
                                    Account Recovery
                                </h2>
                                <p className="text-xs text-slate-400">
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
                                    <h3 className="text-base font-bold text-white">Verification Email Dispatched</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        If an active account corresponds to <span className="font-semibold text-blue-400">{email}</span>, a secure one-time reset link has been dispatched.
                                    </p>
                                </div>
                                <Link 
                                    href="/login" 
                                    className="w-full h-10 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                                    Return to Console Login
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
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
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
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
                                            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-900/95 transition-all duration-200 shadow-inner disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full h-10 mt-3 relative group rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs sm:text-sm shadow-[0_6px_16px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                            <span>Issuing recovery token...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Dispatch Recovery Link</span>
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
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-center">
                            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">
                                Encrypted session • Rate limiting active
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
