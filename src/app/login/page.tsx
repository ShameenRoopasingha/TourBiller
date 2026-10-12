'use client';

import { useState, useRef, FormEvent } from 'react';
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
    CalendarRange
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

        try {
            const result = await signIn('credentials', {
                email,
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
        <div className={`relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-5 lg:p-6 xl:p-8 overflow-x-hidden bg-[#060911] text-slate-100 ${plusJakarta.className}`}>
            {/* Ambient Multi-Layer Architectural Lighting */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Deep radial blooms */}
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

                {/* Micro Noise Texture Overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-screen"
                    style={{
                        backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* Main Stage Grid Container - Compact Vertical Envelope */}
            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 xl:gap-14 my-auto py-2 sm:py-4">
                
                {/* ============================================================== */}
                {/* LEFT COLUMN: BRAND PRESENCE & MULTI-TENANT PLATFORM DECK        */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full lg:max-w-lg xl:max-w-xl flex flex-col space-y-3.5 lg:space-y-4"
                >
                    {/* Multi-Tenant Status Pill */}
                    <div className="inline-flex items-center gap-2.5 self-start px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-sm backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-semibold tracking-wide text-slate-300">
                            Enterprise Cloud Platform <span className="text-slate-500">•</span> Multi-Tenant Architecture
                        </span>
                    </div>

                    {/* Authority Headline */}
                    <div className="space-y-1.5">
                        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                            Unified operations & billing for modern tour fleets.
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg font-normal">
                            Isolated enterprise workspaces designed for tour agencies, vehicle hire operators, and chauffeur fleets of any scale.
                        </p>
                    </div>

                    {/* Multi-Tenant Feature Deck Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-3.5 sm:p-4.5 shadow-[0_15px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl relative overflow-hidden group"
                    >
                        {/* Top sheen hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        
                        {/* Deck Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    <Layers className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Platform Capabilities</div>
                                    <div className="text-xs sm:text-sm font-bold text-slate-200">Tenant Operations Workspace</div>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Tenant Partitioned
                            </span>
                        </div>

                        {/* 3 Core Capability Rows */}
                        <div className="space-y-2 py-2.5 text-xs">
                            {/* Feature 1: Invoicing & Billing */}
                            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <div className="p-1.5 rounded-lg bg-slate-800/80 text-blue-400 shrink-0 mt-0.5">
                                    <Receipt className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-200 font-semibold text-xs">Branded Invoicing & Meter Billing</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed">
                                        Custom company profiles, bank details, start/end meter tracking, excess Km charges, and dual LKR/USD currencies.
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2: Day-by-Day Itineraries */}
                            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 shrink-0 mt-0.5">
                                    <CalendarRange className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-200 font-semibold text-xs">Day-by-Day Tour Itinerary Engine</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed">
                                        Multi-day tour scheduling, itemized transport, accommodation, and activity costing with instant quotation generation.
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3: Fleet Maintenance & Chauffeurs */}
                            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <div className="p-1.5 rounded-lg bg-slate-800/80 text-emerald-400 shrink-0 mt-0.5">
                                    <Car className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-slate-200 font-semibold text-xs">Fleet Health & Driver Allocations</div>
                                    <div className="text-slate-400 text-[11px] leading-relaxed">
                                        Dedicated chauffeur assignments, vehicle maintenance alerts (oil, filter, license expiry), and trip activity audits.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Tenant Metric Badges */}
                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800/80 text-center">
                            <div className="p-1.5 rounded-lg bg-slate-950/50">
                                <div className="text-[10px] text-slate-400 font-medium">Tenant Isolation</div>
                                <div className="text-xs sm:text-sm font-bold text-white tracking-tight">Strict Scoping</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-950/50">
                                <div className="text-[10px] text-slate-400 font-medium">Currency Engine</div>
                                <div className="text-xs sm:text-sm font-bold text-white tracking-tight">Multi-Currency</div>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-950/50">
                                <div className="text-[10px] text-slate-400 font-medium">Access Control</div>
                                <div className="text-xs sm:text-sm font-bold text-emerald-400 tracking-tight">RBAC Enforced</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust & Compliance Strip */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-0.5 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Multi-Tenant Architecture</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Automated Invoicing</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                            <span>99.99% Uptime</span>
                        </div>
                    </div>
                </motion.div>

                {/* ============================================================== */}
                {/* RIGHT COLUMN: COMPACT SOVEREIGN LOGIN TERMINAL CARD            */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm sm:max-w-md shrink-0 relative"
                >
                    {/* Background Radial Glow beneath Card */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-blue-500/20 via-blue-600/5 to-transparent blur-xl pointer-events-none opacity-75" />

                    {/* Interactive Glass Card with Spotlight */}
                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        className="relative rounded-2xl bg-[#0c121f]/90 border border-slate-700/60 p-5 sm:p-6 lg:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundImage: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.12), transparent 50%)`,
                        }}
                    >
                        {/* Elegant Top Radiant Hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80" />

                        {/* Card Header & Brand Emblem */}
                        <div className="flex flex-col items-center text-center space-y-2.5 mb-5">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-blue-500/20 rounded-2xl blur-md group-hover:bg-blue-500/30 transition-all duration-300" />
                                <div className="relative p-2 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">
                                    <Image 
                                        src="/logo-icon.png" 
                                        alt="VIGIL Platform Icon" 
                                        width={36} 
                                        height={36} 
                                        className="h-8 w-auto object-contain drop-shadow" 
                                        priority 
                                    />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`text-2xl font-black tracking-tight text-white ${montserrat.className}`}>
                                        VIGIL
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-blue-500/15 border border-blue-400/30 text-blue-300">
                                        PRO
                                    </span>
                                </div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                                    Tour & Fleet Operations
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 pt-0.5">
                                Sign in with authorized enterprise credentials
                            </p>
                        </div>

                        {/* Interactive Form */}
                        <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                            {/* Error Alert Banner */}
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
                                        <button 
                                            type="button" 
                                            onClick={() => setError('')}
                                            className="text-red-400 hover:text-red-200 transition-colors p-0.5"
                                            aria-label="Dismiss error"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Email Input Field */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center justify-between">
                                    <span>Work Email</span>
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

                            {/* Password Input Field */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-300 tracking-wide">
                                        Password
                                    </label>
                                    <Link 
                                        href="/forgot-password" 
                                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="Enter your security token or password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="w-full h-10 pl-9 pr-10 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-900/95 transition-all duration-200 shadow-inner disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Session Preferences */}
                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer transition"
                                    />
                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                                        Trust this workstation for 30 days
                                    </span>
                                </label>
                            </div>

                            {/* Tactile High-End Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-10 mt-3 relative group rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-xs sm:text-sm shadow-[0_6px_16px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                        <span>Authenticating session...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Access Dispatch Console</span>
                                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Card Security Footnote */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-center">
                            <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-400">
                                End-to-end cryptographic encryption • Authorized personnel only
                            </span>
                        </div>
                    </div>

                    {/* Bottom Legal Navigation */}
                    <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-slate-400 font-medium">
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                            Privacy
                        </Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">
                            Security
                        </Link>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Nominal
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
