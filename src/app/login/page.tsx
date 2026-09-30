'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Aurora from '../../../components/reactbits/Aurora';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const handleSubmit = async (e: React.FormEvent) => {
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
                setError('Invalid email or password');
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
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

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 sm:px-8">
                
                {/* Left Side: Hero Text & Branding */}
                <div className="hidden lg:flex flex-col w-full max-w-xl text-white space-y-8 drop-shadow-2xl">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-900/40 border border-cyan-400/30 text-cyan-50 text-sm font-semibold backdrop-blur-md shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            <span>Secure Access Portal</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
                            Elevate Your <br/> <span className="text-cyan-400">Fleet Management.</span>
                        </h1>
                        <p className="text-lg xl:text-xl text-white/95 leading-relaxed font-medium max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            VIGIL provides a comprehensive smart travel management platform to seamlessly schedule tours, dispatch drivers, and monitor financial analytics in real-time.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-5 pt-6 border-t border-cyan-500/30">
                        <div className="flex items-center gap-3 text-white drop-shadow-md">
                            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 shadow-inner">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-base tracking-wide">Smart Scheduling</span>
                        </div>
                        <div className="flex items-center gap-3 text-white drop-shadow-md">
                            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 shadow-inner">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-base tracking-wide">Automated Billing</span>
                        </div>
                        <div className="flex items-center gap-3 text-white drop-shadow-md">
                            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 shadow-inner">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-base tracking-wide">Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-3 text-white drop-shadow-md">
                            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 shadow-inner">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-base tracking-wide">Vehicle Maintenance</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="dark w-full max-w-md shrink-0 mx-auto lg:mx-0">
                    <Card className="w-full shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-black/70 backdrop-blur-2xl border-cyan-500/40 overflow-hidden text-slate-100 relative">
                        {/* Decorative glow inside card */}
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                        
                        <CardHeader className="text-center space-y-4 pb-4 pt-10">
                            <div className="mx-auto flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/40 blur-2xl rounded-full scale-150"></div>
                                    <Image src="/VIGIL-logo.png" alt="VIGIL" width={112} height={112} className="h-28 w-auto drop-shadow-[0_0_25px_rgba(0,180,216,0.8)] relative z-10" priority />
                                </div>
                                <div className="flex flex-col items-center mt-3 drop-shadow-lg">
                                    <CardTitle className="text-4xl font-black tracking-tight text-white pb-1">VIGIL</CardTitle>
                                    <span className="text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase leading-tight mt-1">Smart Travel Management</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-100 text-sm text-center font-bold shadow-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold text-white tracking-wide">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-black/50 border-cyan-500/40 text-white font-medium placeholder:text-slate-400 focus-visible:ring-cyan-500 shadow-inner"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-white tracking-wide">Password</label>
                                        <Link href="/forgot-password" className="text-xs font-bold text-cyan-400 hover:text-cyan-200 transition-colors drop-shadow-sm">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <PasswordInput
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-black/50 border-cyan-500/40 text-white font-medium placeholder:text-slate-400 focus-visible:ring-cyan-500 shadow-inner"
                                        disabled={loading}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 mt-8 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base border border-cyan-400/50 shadow-[0_0_20px_rgba(0,180,216,0.6)] transition-all duration-300" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="mr-2 h-5 w-5" />
                                            Sign In
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
