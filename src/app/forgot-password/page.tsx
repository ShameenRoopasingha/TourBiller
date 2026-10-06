'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Aurora from '../../../components/reactbits/Aurora';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['700', '900'] });

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.set('email', email);

        try {
            const response = await fetch('/api/auth/password-reset/request', { method: 'POST', body: formData });
            const result = await response.json();
            if (response.ok && result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to request reset link.');
            }
        } catch (error) {
            console.error('Error requesting password reset:', error);
            setError('Failed to request reset link. Please try again.');
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
            
            {/* Grid overlay */}
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,180,216,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,216,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>

            <div className="dark w-full max-w-md shrink-0 mx-auto relative z-10">
                <Card className="w-full shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-black/70 backdrop-blur-2xl border-cyan-500/40 overflow-hidden text-slate-100 relative">
                    {/* Decorative glow inside card */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <CardHeader className="text-center space-y-4 pb-4 pt-10">
                        <div className="mx-auto flex flex-col items-center justify-center gap-4">
                            <div className="relative bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,180,216,0.4)] border-2 border-white/50 group hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-white rounded-3xl z-0"></div>
                                <Image src="/logo-icon.png" alt="VIGIL Logo Icon" width={72} height={72} className="h-16 w-auto relative z-10 object-contain" priority />
                            </div>
                            <div className="flex flex-col items-center mt-2 drop-shadow-lg">
                                <CardTitle className={`text-3xl font-black tracking-tight text-white pb-1 ${montserrat.className}`}>VIGIL</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="px-8 pb-10">
                        {success ? (
                            <div className="space-y-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(0,180,216,0.3)]">
                                    <Mail className="h-8 w-8 text-cyan-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Check your email</h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        If an account exists for <span className="font-bold text-cyan-400">{email}</span>, you will receive a password reset link shortly.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full h-12 mt-6 bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 font-bold" asChild>
                                    <Link href="/login">Return to login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="text-center space-y-2 mb-6">
                                    <h2 className="text-xl font-bold text-white flex justify-center items-center gap-2">
                                        <KeyRound className="w-5 h-5 text-cyan-400" />
                                        Forgot Password
                                    </h2>
                                    <p className="text-sm text-slate-400">
                                        Enter your email to receive a reset link.
                                    </p>
                                </div>

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

                                <Button 
                                    type="submit" 
                                    className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base border border-cyan-400/50 shadow-[0_0_20px_rgba(0,180,216,0.6)] transition-all duration-300" 
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sending link...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="mr-2 h-5 w-5" />
                                            Send reset link
                                        </>
                                    )}
                                </Button>

                                <div className="text-center mt-6">
                                    <Link href="/login" className="text-sm font-bold text-cyan-400 hover:text-cyan-200 transition-colors drop-shadow-sm inline-flex items-center">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
