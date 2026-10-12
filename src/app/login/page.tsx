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
    Clock, 
    CheckCircle2, 
    Activity, 
    Radio
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
        <div className={`relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-x-hidden bg-[#060911] text-slate-100 ${plusJakarta.className}`}>
            {/* Ambient Multi-Layer Architectural Lighting */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Deep radial blooms */}
                <div 
                    className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full opacity-35 blur-[140px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(30, 58, 138, 0.2) 50%, transparent 75%)' }}
                />
                <div 
                    className="absolute -bottom-[20%] right-[-10%] w-[800px] h-[600px] rounded-full opacity-25 blur-[150px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(30, 64, 175, 0.15) 50%, transparent 70%)' }}
                />
                <div 
                    className="absolute top-1/3 -left-[15%] w-[600px] h-[600px] rounded-full opacity-20 blur-[130px] pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)' }}
                />

                {/* Subtle Geometric Precision Grid */}
                <div 
                    className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '48px 48px',
                        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)'
                    }}
                />

                {/* Micro Noise Texture Overlay */}
                <div 
                    className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-screen"
                    style={{
                        backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* Main Stage Grid Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 xl:gap-24 py-8">
                
                {/* ============================================================== */}
                {/* LEFT COLUMN: BRAND PRESENCE & MISSION CONTROL TELEMETRY DECK   */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full lg:max-w-xl xl:max-w-2xl flex flex-col space-y-8"
                >
                    {/* Live Node Status Pill */}
                    <div className="inline-flex items-center gap-3 self-start px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.4)] backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-slate-300">
                            Enterprise Gateway <span className="text-slate-500">•</span> London Core Cluster
                        </span>
                    </div>

                    {/* Authority Headline */}
                    <div className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                            Precision fleet intelligence & tour logistics.
                        </h1>
                        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl font-normal">
                            The unified operational command for premium chauffeur fleets, multi-day itineraries, and real-time fiscal billing.
                        </p>
                    </div>

                    {/* Operational Telemetry Card (Replaces generic 4-checkmark AI grid) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl relative overflow-hidden group"
                    >
                        {/* Top sheen hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        
                        {/* Telemetry Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    <Radio className="w-4 h-4 animate-pulse" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Mission Monitor</div>
                                    <div className="text-sm font-bold text-slate-200">The Savoy London ➔ Silverstone Classic Tour</div>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                In Transit
                            </span>
                        </div>

                        {/* Dispatch Details Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
                                    <Car className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-slate-400 font-medium">Assigned Asset</div>
                                    <div className="text-slate-200 font-semibold">Mercedes V-Class Extra Long</div>
                                    <div className="text-slate-500 font-mono text-[11px]">Plate: LJ73 VGL</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                                <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-slate-400 font-medium">Chauffeur / ETA</div>
                                    <div className="text-slate-200 font-semibold">D. Sterling (Lead Driver)</div>
                                    <div className="text-emerald-400 font-medium text-[11px]">On Schedule • ETA 10:45 AM</div>
                                </div>
                            </div>
                        </div>

                        {/* Telemetry Metric Badges */}
                        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-center">
                            <div className="p-2 rounded-lg bg-slate-950/50">
                                <div className="text-[11px] text-slate-400 font-medium">Fleet Availability</div>
                                <div className="text-base sm:text-lg font-bold text-white tracking-tight font-mono tabular-nums">99.8%</div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/50">
                                <div className="text-[11px] text-slate-400 font-medium">Active Tours</div>
                                <div className="text-base sm:text-lg font-bold text-white tracking-tight font-mono tabular-nums">18 Active</div>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/50">
                                <div className="text-[11px] text-slate-400 font-medium">Sync Latency</div>
                                <div className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight font-mono tabular-nums">14ms</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust & Compliance Strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            <span>SOC-2 Type II Certified</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            <span>ISO/IEC 27001 Ready</span>
                        </div>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span>99.99% Guaranteed SLA</span>
                        </div>
                    </div>
                </motion.div>

                {/* ============================================================== */}
                {/* RIGHT COLUMN: REFINED SOVEREIGN LOGIN TERMINAL CARD            */}
                {/* ============================================================== */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md shrink-0 relative"
                >
                    {/* Background Radial Glow beneath Card */}
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-blue-500/20 via-blue-600/5 to-transparent blur-xl pointer-events-none opacity-75" />

                    {/* Interactive Glass Card with Spotlight */}
                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        className="relative rounded-2xl bg-[#0c121f]/90 border border-slate-700/60 p-7 sm:p-9 shadow-[0_30px_70px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl overflow-hidden transition-all duration-300"
                        style={{
                            backgroundImage: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.12), transparent 50%)`,
                        }}
                    >
                        {/* Elegant Top Radiant Hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-80" />

                        {/* Card Header & Brand Emblem */}
                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-blue-500/20 rounded-2xl blur-lg group-hover:bg-blue-500/30 transition-all duration-300" />
                                <div className="relative p-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">
                                    <Image 
                                        src="/logo-icon.png" 
                                        alt="VIGIL Platform Icon" 
                                        width={48} 
                                        height={48} 
                                        className="h-10 w-auto object-contain drop-shadow" 
                                        priority 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`text-2xl sm:text-3xl font-black tracking-tight text-white ${montserrat.className}`}>
                                        VIGIL
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/15 border border-blue-400/30 text-blue-300">
                                        PRO
                                    </span>
                                </div>
                                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                                    Tour & Fleet Operations
                                </p>
                            </div>

                            <div className="pt-2 text-center">
                                <h2 className="text-lg font-semibold text-slate-200">
                                    Sign in to your console
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Enter authorized credentials to continue
                                </p>
                            </div>
                        </div>

                        {/* Interactive Form */}
                        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                            {/* Error Alert Banner */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -8, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -8, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 shadow-md"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 font-medium leading-relaxed">{error}</div>
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
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 tracking-wide flex items-center justify-between">
                                    <span>Work Email</span>
                                    <span className="text-[11px] text-slate-400 font-normal">Required</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                        <Mail className="w-4 h-4" />
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
                                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-100 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-900/95 transition-all duration-200 shadow-inner disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Password Input Field */}
                            <div className="space-y-1.5">
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
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                        <Lock className="w-4 h-4" />
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
                                        className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-900/70 border border-slate-700/70 text-slate-100 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-900/95 transition-all duration-200 shadow-inner disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Session Preferences */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={rememberDevice}
                                        onChange={(e) => setRememberDevice(e.target.checked)}
                                        className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer transition"
                                    />
                                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                                        Trust this workstation for 30 days
                                    </span>
                                </label>
                            </div>

                            {/* Tactile High-End Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 mt-4 relative group rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-sm shadow-[0_8px_20px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                        <span>Authenticating session...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Access Dispatch Console</span>
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Card Security Footnote */}
                        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[11px] text-slate-400">
                                End-to-end cryptographic encryption • Authorized personnel only
                            </span>
                        </div>
                    </div>

                    {/* Bottom Legal Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400 font-medium">
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">
                            Security Standard
                        </Link>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Systems Nominal
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
