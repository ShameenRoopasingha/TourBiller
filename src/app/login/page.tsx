'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    ShieldCheck, 
    Loader2, 
    AlertCircle, 
    X, 
    Car, 
    CheckCircle2, 
    Activity, 
    Layers, 
    Receipt, 
    CalendarRange,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 200, y: 200 });

    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const urlError = searchParams.get('error');

    // Handle NextAuth URL errors (e.g., session timeout or invalid callback)
    useEffect(() => {
        if (urlError) {
            if (urlError === 'CredentialsSignin') {
                setError('Invalid email or password. Please verify your credentials.');
            } else if (urlError === 'SessionRequired') {
                setError('Your session has timed out. Please sign in again.');
            } else {
                setError('Authentication required to access the requested console.');
            }
        }
    }, [urlError]);

    // Read remembered workstation email
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem('vigil_remembered_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberDevice(true);
            }
        } catch {
            // Storage access restricted in certain iframe environments
        }
    }, []);

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

        const cleanEmail = email.trim().toLowerCase();

        try {
            // Save or clear remembered workstation email
            if (rememberDevice) {
                try {
                    localStorage.setItem('vigil_remembered_email', cleanEmail);
                } catch {}
            } else {
                try {
                    localStorage.removeItem('vigil_remembered_email');
                } catch {}
            }

            const result = await signIn('credentials', {
                email: cleanEmail,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password. Please verify your credentials.');
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError('Authentication service unreachable. Please try again shortly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center py-6 px-3 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[#040504] text-slate-100 font-sans antialiased">
            {/* Ambient Multi-Layer Architectural Lighting (Bitgard Matte Orange & Amber) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full opacity-35 blur-[140px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(232, 115, 42, 0.28) 0%, rgba(153, 71, 22, 0.12) 50%, transparent 75%)' }}
                />
                <div 
                    className="absolute -bottom-[20%] right-[-10%] w-[650px] h-[450px] rounded-full opacity-25 blur-[150px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(68, 31, 10, 0.08) 50%, transparent 70%)' }}
                />

                {/* Subtle Geometric Precision Grid */}
                <div 
                    className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '36px 36px',
                        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)'
                    }}
                />
            </div>

            {/* Main Stage Container - Strict Vertical Constraint */}
            <div className="relative z-10 w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-stretch items-center justify-between gap-6 lg:gap-8 xl:gap-12 my-auto py-2 sm:py-3">
                
                {/* ============================================================== */}
                {/* LEFT COLUMN: BRAND PRESENCE & MULTI-TENANT PLATFORM DECK        */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full lg:max-w-lg xl:max-w-xl flex flex-col justify-between space-y-3 lg:space-y-4"
                >
                    {/* Multi-Tenant Status Pill */}
                    <div className="inline-flex items-center gap-2 self-start px-2.5 py-0.5 rounded-full bg-[#0A0B0D]/90 border border-white/10 shadow-sm backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300">
                            Enterprise Cloud Platform <span className="text-slate-600">•</span> Multi-Tenant Architecture
                        </span>
                    </div>

                    {/* Authority Headline */}
                    <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-[-0.03em] text-white leading-[1.14] font-subheading">
                            Unified operations & billing for modern tour fleets.
                        </h1>
                        <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-md font-sans font-normal">
                            Dedicated enterprise workspaces for tour operators, vehicle hire agencies, and chauffeur fleets of any scale.
                        </p>
                    </div>

                    {/* Multi-Tenant Feature Deck Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl bg-gradient-to-b from-[#0B0D12]/95 to-[#050608]/95 border border-white/[0.08] p-3 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E8732A]/50 to-transparent" />
                        
                        {/* Deck Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-primary/10 border border-primary/25 text-primary">
                                    <Layers className="w-3 h-3" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.14em] text-slate-400">Platform Capabilities</div>
                                    <div className="text-xs sm:text-[13px] font-bold text-slate-200 font-subheading tracking-tight">Tenant Operations Workspace</div>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wide font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Isolated Database Scope
                            </span>
                        </div>

                        {/* 3 Core Capability Rows */}
                        <div className="space-y-1.5 py-1.5 text-xs">
                            {/* Feature 1 */}
                            <div className="flex items-start gap-2.5 p-1.5 sm:p-2 rounded-xl bg-[#0E1015]/70 border border-white/[0.06]">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                                    <Receipt className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-100 font-bold text-xs sm:text-[13px] font-subheading leading-none mb-1">Branded Invoicing & Meter Billing</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed font-sans font-normal">
                                        Company profiles, bank credentials, meter audits, excess Km charges & dual LKR/USD exchange.
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex items-start gap-2.5 p-1.5 sm:p-2 rounded-xl bg-[#0E1015]/70 border border-white/[0.06]">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                                    <CalendarRange className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-100 font-bold text-xs sm:text-[13px] font-subheading leading-none mb-1">Day-by-Day Tour Itinerary Engine</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed font-sans font-normal">
                                        Multi-day tour scheduling, itemized transport, accommodation & automated client quotations.
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex items-start gap-2.5 p-1.5 sm:p-2 rounded-xl bg-[#0E1015]/70 border border-white/[0.06]">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                                    <Car className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-100 font-bold text-xs sm:text-[13px] font-subheading leading-none mb-1">Fleet Health & Driver Allocations</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed font-sans font-normal">
                                        Dedicated chauffeur assignments, maintenance mileage alerts (oil/filter) & license renewals.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.08] text-center">
                            <div className="p-1.5 rounded-lg bg-[#050608]/80 border border-white/[0.04]">
                                <div className="text-[9px] font-mono text-slate-400 font-medium tracking-wider uppercase">Tenant Security</div>
                                <div className="text-xs font-mono font-bold text-white tracking-wider uppercase">Data Scoped</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-[#050608]/80 border border-white/[0.04]">
                                <div className="text-[9px] font-mono text-slate-400 font-medium tracking-wider uppercase">Currency Engine</div>
                                <div className="text-xs font-mono font-bold text-primary tracking-wider uppercase">LKR / USD Rate</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-[#050608]/80 border border-white/[0.04]">
                                <div className="text-[9px] font-mono text-slate-400 font-medium tracking-wider uppercase">Access Control</div>
                                <div className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">RBAC Enforced</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Strip */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span>Multi-Tenant Architecture</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            <span>Automated Meter Audits</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span>99.99% Uptime SLA</span>
                        </div>
                    </div>
                </motion.div>

                {/* ============================================================== */}
                {/* RIGHT COLUMN: SOVEREIGN LOGIN TERMINAL CARD                    */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm sm:max-w-md xl:max-w-lg shrink-0 flex flex-col justify-between relative"
                >
                    {/* Background Radial Glow (Bitgard Matte Orange Halo) */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-[#E8732A]/25 via-[#E8732A]/5 to-transparent blur-xl pointer-events-none opacity-80" />

                    {/* Interactive Glass Card with Spotlight */}
                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        className="relative flex-1 flex flex-col justify-between rounded-2xl bg-[#090B10]/95 border border-white/[0.12] p-4 sm:p-5 lg:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundImage: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(232, 115, 42, 0.14), transparent 50%)`,
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E8732A] to-transparent opacity-90" />

                        {/* Card Header & Brand Emblem */}
                        <div className="flex flex-col items-center text-center space-y-2 mb-2 sm:mb-2.5">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-[#E8732A]/25 rounded-2xl blur-md group-hover:bg-[#E8732A]/35 transition-all duration-300" />
                                <div className="relative p-2 rounded-2xl bg-card/90 dark:bg-card/70 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_16px_rgba(232,115,42,0.25)] border border-border/70 shrink-0">
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
                                <span className="text-2xl sm:text-3xl font-black tracking-[0.22em] text-white font-heading uppercase pl-[0.22em]">
                                    VIGIL
                                </span>
                                <p className="text-[10px] sm:text-[10.5px] font-mono font-bold tracking-[0.16em] text-primary uppercase">
                                    Vehicle Hire & Travel Management
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 font-sans font-normal">
                                Sign in to your operations workspace
                            </p>
                        </div>

                        {/* Interactive Form */}
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 relative z-10 my-auto py-1">
                            {/* Error Alert Banner */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 shadow-sm"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 font-medium leading-tight">{error}</div>
                                        <button 
                                            type="button" 
                                            onClick={() => setError('')}
                                            className="text-red-400 hover:text-red-200 transition-colors p-0.5"
                                            aria-label="Dismiss error"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Email Input Field */}
                            <div className="space-y-1">
                                <label htmlFor="login-email" className="text-xs font-semibold text-slate-300 tracking-wide cursor-pointer">
                                    Work Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="admin@vigil.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full h-10 sm:h-10.5 pl-9 pr-3 rounded-xl bg-[#06070A]/85 border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-[#080A0F] transition-all duration-200 shadow-inner disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Password Input Field */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="login-password" className="text-xs font-semibold text-slate-300 tracking-wide cursor-pointer">
                                        Password
                                    </label>
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-xs font-semibold text-primary hover:text-primary-300 transition-colors focus:outline-none focus:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full h-10 sm:h-10.5 pl-9 pr-10 rounded-xl bg-[#06070A]/85 border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-[#080A0F] transition-all duration-200 shadow-inner disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Session Preferences */}
                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex items-center gap-1.5 cursor-pointer group select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded bg-[#06070A] border-white/20 text-primary focus:ring-primary/30 focus:ring-offset-0 focus:ring-1 cursor-pointer transition"
                                    />
                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                                        Remember me
                                    </span>
                                </label>
                                <span className="text-[11px] text-slate-400">
                                    Need access?{' '}
                                    <a href="mailto:support@vigiltours.com?subject=New%20Tenant%20Workspace%20Request" className="text-primary hover:underline">
                                        Request Workspace
                                    </a>
                                </span>
                            </div>

                            {/* Tactile High-End Submit Button (Bitgard Matte Orange) */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 sm:h-10.5 mt-2.5 relative group rounded-xl bg-gradient-to-b from-[#F17E34] via-[#E8732A] to-[#D15F18] hover:from-[#EC8353] hover:to-[#C75C1D] text-white font-semibold text-xs sm:text-sm shadow-[0_6px_20px_rgba(232,115,42,0.38),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Card Security & Official Portal Link */}
                        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>256-bit SSL</span>
                            </span>
                            <a 
                                href={process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL || 'https://bitgard.vercel.app/products/vehicle-hire'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] font-semibold text-primary hover:text-primary-300 tracking-wide inline-flex items-center gap-1 transition-colors"
                            >
                                <span>Bitgard Vigil Portal</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Bottom Legal Navigation */}
                    <div className="flex items-center justify-center gap-3 mt-3 pb-2 text-[11px] font-sans text-slate-400 font-normal shrink-0">
                        <Link href="/privacy" className="hover:text-slate-200 transition-colors">
                            Privacy Policy
                        </Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/terms" className="hover:text-slate-200 transition-colors">
                            Terms of Service
                        </Link>
                        <span className="text-slate-600">•</span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Operational
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
