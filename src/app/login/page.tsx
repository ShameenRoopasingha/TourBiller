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
import Topography from '@/components/Backgrounds/Topography';

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
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0 bg-[#000510]">
                <Topography
                    lowColor="#001845"    // Deep Navy
                    midColor="#00b4d8"    // Cyan
                    highColor="#caf0f8"   // Very Light Cyan
                    speed={0.4}
                    morphAmount={3.0}
                    morphSpeed={0.05}
                    bands={2.5}
                    thickness={0.012}
                    scale={1.2}
                    colorMode="elevation"
                    contrast={2.0}
                    brightness={1.5}
                    opacity={0.8}
                    mouseInteraction={true}
                    mouseRadius={0.4}
                    mouseStrength={0.5}
                />
            </div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 px-4 sm:px-8">
                
                {/* Left Side: Hero Text & Branding */}
                <div className="hidden lg:flex flex-col w-full max-w-xl text-white space-y-8">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium backdrop-blur-md">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Secure Access Portal</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-cyan-100 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm leading-tight">
                            Elevate Your <br/> Fleet Management.
                        </h1>
                        <p className="text-lg xl:text-xl text-cyan-100/70 leading-relaxed font-light max-w-lg">
                            VIGIL provides a comprehensive smart travel management platform to seamlessly schedule tours, dispatch drivers, and monitor financial analytics in real-time.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyan-500/20">
                        <div className="flex items-center gap-3 text-cyan-100/80">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">Smart Scheduling</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyan-100/80">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">Automated Billing</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyan-100/80">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-3 text-cyan-100/80">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">Vehicle Maintenance</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="dark w-full max-w-md shrink-0 mx-auto lg:mx-0">
                    <Card className="w-full shadow-[0_0_40px_rgba(0,180,216,0.1)] bg-black/60 backdrop-blur-xl border-cyan-500/30 overflow-hidden text-slate-100 relative">
                        {/* Decorative glow inside card */}
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                        
                        <CardHeader className="text-center space-y-4 pb-4 pt-10">
                            <div className="mx-auto flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-full scale-150"></div>
                                    <Image src="/VIGIL-logo.png" alt="VIGIL" width={112} height={112} className="h-28 w-auto drop-shadow-[0_0_25px_rgba(0,180,216,0.6)] relative z-10" priority />
                                </div>
                                <div className="flex flex-col items-center mt-3">
                                    <CardTitle className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent pb-1">VIGIL</CardTitle>
                                    <span className="text-xs font-bold tracking-[0.2em] text-cyan-200/80 uppercase leading-tight mt-1">Smart Travel Management</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <label className="text-sm font-semibold text-cyan-50/80">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 bg-black/40 border-cyan-500/20 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-cyan-50/80">Password</label>
                                        <Link href="/forgot-password" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <PasswordInput
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 bg-black/40 border-cyan-500/20 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500/50"
                                        disabled={loading}
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-base border-0 shadow-[0_0_20px_rgba(0,180,216,0.4)] transition-all duration-300" 
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
