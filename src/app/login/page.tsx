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
import Grainient from '@/components/Grainient';

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
            <div className="absolute inset-0 z-0 scale-110">
                <Grainient 
                    color1="#001845" // Deep Navy
                    color2="#00b4d8" // Cyan/Bright Blue
                    color3="#023e8a" // Royal Blue
                    zoom={0.8}
                    timeSpeed={0.15}
                    noiseScale={1.5}
                    grainAmount={0.05}
                    className="opacity-50 dark:opacity-40"
                />
            </div>

            <Card className="relative w-full max-w-md shadow-2xl z-10 bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/30 dark:border-white/10 overflow-hidden">
                <CardHeader className="text-center space-y-3 pb-2 pt-8">
                    <div className="mx-auto flex flex-col items-center justify-center gap-3">
                        <Image src="/virgil-logo.png" alt="VIRGIL" width={96} height={96} className="h-24 w-auto drop-shadow-md" priority />
                        <div className="flex flex-col items-center mt-2">
                            <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent pb-1">VIRGIL</CardTitle>
                            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase leading-tight mt-1">Smart Travel Management.</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <PasswordInput
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-5"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
