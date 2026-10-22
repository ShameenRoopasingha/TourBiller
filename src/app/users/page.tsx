'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notifications';
import { Loader2, Plus, Trash2, Shield, Truck, Search, CheckCircle2, Clock, MailCheck, Send, KeyRound, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFuzzySearch } from '@/lib/use-fuzzy-search';
import { verifyUserEmail, resendVerificationEmail, adminGenerateResetLink } from '@/lib/user-actions';

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: Date | null;
    createdAt: Date;
};

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Email verification dialog state
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
    const [manualOtpCode, setManualOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Admin reset password modal state
    const [resetLinkModalOpen, setResetLinkModalOpen] = useState(false);
    const [generatedResetLink, setGeneratedResetLink] = useState('');
    const [resetUserTarget, setResetUserTarget] = useState<User | null>(null);
    const [isGeneratingReset, setIsGeneratingReset] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DRIVER');

    // Fuse.js Fuzzy search for users
    const { query: searchQuery, setQuery: setSearchQuery, results: filteredUsers } = useFuzzySearch(
        users,
        [
            { name: 'name', weight: 0.4 },
            { name: 'email', weight: 0.4 },
            { name: 'role', weight: 0.2 },
        ],
        { threshold: 0.35 }
    );

    const initFetch = async () => {
        try {
            const response = await fetch('/api/users');
            const result = await response.json();

            if (response.ok && result.success && result.data) {
                setUsers(result.data);
            } else {
                setLoadError(result.error || 'Failed to load users');
            }
        } catch (fetchError) {
            console.error('Error loading users:', fetchError);
            setLoadError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initFetch();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                notify.success('User created successfully. A verification code has been dispatched to their email.');
                setDialogOpen(false);
                setName('');
                setEmail('');
                setPassword('');
                setRole('DRIVER');
                await initFetch();
            } else {
                setError(result.error || 'Failed to create user');
            }
        } catch (createError) {
            console.error('Error creating user:', createError);
            setError('Failed to create user. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/users/${userToDelete.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok && result.success) {
                notify.success('User deleted successfully');
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                setDeleteConfirmText('');
                await initFetch();
            } else {
                notify.error(result.error || 'Failed to delete user');
            }
        } catch (delError) {
            console.error('Error deleting user:', delError);
            notify.error('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleManualVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyingUser || !manualOtpCode.trim()) return;

        setIsVerifying(true);
        try {
            const res = await verifyUserEmail(verifyingUser.email, manualOtpCode.trim());
            if (res.success) {
                notify.success(`Email verified successfully for ${verifyingUser.name}!`);
                setVerifyDialogOpen(false);
                setManualOtpCode('');
                setVerifyingUser(null);
                await initFetch();
            } else {
                notify.error(res.error || 'Verification failed. Please check the code.');
            }
        } catch (err: any) {
            notify.error(err?.message || 'Failed to verify email');
        } finally {
            setIsVerifying(false);
        }
    };

        const handleAdminReset = async (user: User) => {
        setIsGeneratingReset(true);
        try {
            const res = await adminGenerateResetLink(user.id);
            if (res.success && res.data?.resetLink) {
                setGeneratedResetLink(res.data.resetLink);
                setResetUserTarget(user);
                setResetLinkModalOpen(true);
                notify.success(`Password reset link generated for ${user.name}`);
            } else {
                notify.error(res.error || 'Failed to generate reset link');
            }
        } catch (err: any) {
            notify.error(err?.message || 'Failed to generate reset link');
        } finally {
            setIsGeneratingReset(false);
        }
    };

    const copyResetLink = () => {
        if (!generatedResetLink) return;
        navigator.clipboard.writeText(generatedResetLink);
        notify.success('Password reset link copied to clipboard!');
    };

    const handleResend = async (user: User) => {
        setIsResending(true);
        try {
            const res = await resendVerificationEmail(user.id);
            if (res.success) {
                notify.success(`Verification email resent to ${user.email}!`);
            } else {
                notify.error(res.error || 'Failed to resend verification email');
            }
        } catch (err: any) {
            notify.error(err?.message || 'Failed to resend verification email');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                This action cannot be undone. This will permanently delete the user account
                                for <strong>{userToDelete?.name}</strong>.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                To confirm, please type <strong>{userToDelete?.name}</strong> below:
                            </p>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type user name to confirm"
                                className="mt-2"
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteConfirmText('');
                            setUserToDelete(null);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        <Button 
                            variant="destructive" 
                            disabled={deleteConfirmText !== userToDelete?.name || isDeleting}
                            onClick={confirmDelete}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete User
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Email Verification Dialog */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MailCheck className="h-5 w-5 text-primary" />
                            Verify Email Address
                        </DialogTitle>
                        <DialogDescription>
                            Verify email for <strong>{verifyingUser?.name}</strong> ({verifyingUser?.email}).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleManualVerify} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1.5">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                Enter 6-Digit OTP Code
                            </label>
                            <Input
                                value={manualOtpCode}
                                onChange={(e) => setManualOtpCode(e.target.value.trim())}
                                placeholder="e.g. 123456"
                                className="font-mono tracking-widest text-center text-lg"
                                maxLength={32}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the code sent to the user&apos;s email address or click Resend below.
                            </p>
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center pt-2">
                            {verifyingUser && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isResending}
                                    onClick={() => handleResend(verifyingUser)}
                                >
                                    {isResending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                                    Resend Email
                                </Button>
                            )}
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button type="button" variant="ghost" onClick={() => setVerifyDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isVerifying || !manualOtpCode.trim()}>
                                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Verification
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            
            {/* Admin Password Reset Link Dialog */}
            <Dialog open={resetLinkModalOpen} onOpenChange={setResetLinkModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Password Reset Link
                        </DialogTitle>
                        <DialogDescription>
                            Direct password reset link generated for <strong>{resetUserTarget?.name}</strong> ({resetUserTarget?.email}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                One-Time Reset URL (Valid for 1 Hour)
                            </label>
                            <div className="p-2.5 rounded-lg bg-muted/60 border border-border text-xs font-mono break-all select-all">
                                {generatedResetLink}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="flex-1"
                                onClick={copyResetLink}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Link
                            </Button>
                            <Button 
                                type="button" 
                                className="flex-1"
                                asChild
                            >
                                <a href={generatedResetLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open Link
                                </a>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users & Staff</h1>
                    <p className="text-muted-foreground text-sm">Manage admin and driver accounts with open-source email verification</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto shadow-xs">
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new admin or driver account. The email will be validated in real-time.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Domain MX records will be verified via native DNS to ensure real email deliverability.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <PasswordInput
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={role === 'DRIVER' ? 'default' : 'outline'}
                                        onClick={() => setRole('DRIVER')}
                                        className="flex-1"
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Driver
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={role === 'ADMIN' ? 'default' : 'outline'}
                                        onClick={() => setRole('ADMIN')}
                                        className="flex-1"
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Company User Directory</CardTitle>
                    <CardDescription>
                        All administrators and drivers assigned to your tenant account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Fuse.js Search Bar */}
                    <div className="flex items-center mb-6">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Fuzzy search users (e.g. name, email, role)..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loadError && (
                        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {loadError}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            {searchQuery ? `No users matching "${searchQuery}"` : 'No users found.'}
                        </div>
                    ) : (
                        <>
                            {/* Mobile View (Card-based) */}
                            <div className="grid gap-3 md:hidden">
                                {filteredUsers.map((user) => (
                                    <Card key={user.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-base text-foreground">{user.name}</h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Reset Password"
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 h-8 w-8 shrink-0"
                                                    onClick={() => handleAdminReset(user)}
                                                    disabled={isGeneratingReset}
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 shrink-0"
                                                    onClick={() => {
                                                        setUserToDelete({ id: user.id, name: user.name });
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Status badges */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                user.role === 'ADMIN'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-secondary text-secondary-foreground'
                                            }`}>
                                                {user.role === 'ADMIN' ? (
                                                    <Shield className="h-3 w-3" />
                                                ) : (
                                                    <Truck className="h-3 w-3" />
                                                )}
                                                {user.role}
                                            </span>

                                            {user.emailVerified ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                        <Clock className="h-3 w-3" />
                                                        Pending
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 text-[10px] px-2 text-primary hover:text-primary font-medium"
                                                        onClick={() => {
                                                            setVerifyingUser(user);
                                                            setVerifyDialogOpen(true);
                                                        }}
                                                    >
                                                        Verify Code
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right text-muted-foreground text-[11px] pt-2 border-t border-border/50">
                                            Registered: {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Desktop View (Table-based) */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Email Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        user.role === 'ADMIN'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-secondary text-secondary-foreground'
                                                    }`}>
                                                        {user.role === 'ADMIN' ? (
                                                            <Shield className="h-3 w-3" />
                                                        ) : (
                                                            <Truck className="h-3 w-3" />
                                                        )}
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {user.emailVerified ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                Pending
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs px-2.5 text-primary hover:text-primary hover:bg-primary/5"
                                                                onClick={() => {
                                                                    setVerifyingUser(user);
                                                                    setVerifyDialogOpen(true);
                                                                }}
                                                            >
                                                                Verify
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Generate Password Reset Link"
                                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                            onClick={() => handleAdminReset(user)}
                                                            disabled={isGeneratingReset}
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={() => {
                                                                setUserToDelete({ id: user.id, name: user.name });
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
