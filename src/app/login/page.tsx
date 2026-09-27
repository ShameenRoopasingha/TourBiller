'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
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
        <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-hidden">
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

            <div className="dark relative w-full max-w-md z-10">
                <Card className="w-full shadow-[0_0_40px_rgba(0,180,216,0.1)] bg-black/50 backdrop-blur-xl border-cyan-500/20 overflow-hidden text-slate-100">
                    <CardHeader className="text-center space-y-3 pb-2 pt-8">
                        <div className="mx-auto flex flex-col items-center justify-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-150"></div>
                                <Image src="/VIGIL-logo.png" alt="VIGIL" width={96} height={96} className="h-24 w-auto drop-shadow-[0_0_15px_rgba(0,180,216,0.5)] relative z-10" priority />
                            </div>
                            <div className="flex flex-col items-center mt-2">
                                <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent pb-1">VIGIL</CardTitle>
                                <span className="text-sm font-semibold tracking-wide text-cyan-100/70 uppercase leading-tight mt-1">Smart Travel Management.</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cyan-50/80">Email</label>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-black/40 border-cyan-500/20 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-cyan-50/80">Password</label>
                                    <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <PasswordInput
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-black/40 border-cyan-500/20 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50"
                                    disabled={loading}
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all duration-300" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
