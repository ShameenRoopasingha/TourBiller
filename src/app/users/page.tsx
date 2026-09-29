'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notifications';
import { Loader2, Plus, Trash2, Shield, Truck, Users } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
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

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DRIVER');

    useEffect(() => {
        let isMounted = true;
        
        const initFetch = async () => {
            try {
                const response = await fetch('/api/users');
                const result = await response.json();
                if (!isMounted) return;

                if (response.ok && result.success && result.data) {
                    setUsers(result.data);
                } else {
                    setLoadError(result.error || 'Failed to load users');
                }
            } catch (fetchError) {
                console.error('Error loading users:', fetchError);
                if (isMounted) setLoadError('Failed to load users. Please try again.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        
        initFetch();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);
        formData.set('password', password);
        formData.set('role', role);

        try {
            const response = await fetch('/api/users', { method: 'POST', body: formData });
            const result = await response.json();

            if (response.ok && result.success) {
                router.refresh();
                setName('');
                setEmail('');
                setPassword('');
                setRole('DRIVER');
                setDialogOpen(false);
                const refreshResponse = await fetch('/api/users');
                const refresh = await refreshResponse.json();
                if (refreshResponse.ok && refresh.success && refresh.data) setUsers(refresh.data);
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
            const response = await fetch(`/api/users/${encodeURIComponent(userToDelete.id)}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok && result.success) {
                notify.success('User deleted successfully');
                router.refresh();
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                setDeleteConfirmText('');
                const refreshResponse = await fetch('/api/users');
                const refresh = await refreshResponse.json();
                if (refreshResponse.ok && refresh.success && refresh.data) setUsers(refresh.data);
            } else {
                notify.error(result.error || 'Failed to delete user');
            }
        } catch (deleteError) {
            console.error('Error deleting user:', deleteError);
            notify.error('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-6">
            
            {/* High Warning Deletion Modal */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Delete User Account
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            <p>
                                You are about to permanently delete the account for <strong>{userToDelete?.name}</strong>. 
                                This action <span className="text-red-500 font-bold">cannot be undone</span> and will remove all their access immediately.
                            </p>
                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md text-sm border border-red-200 dark:border-red-900/30">
                                Please type <strong className="select-all">{userToDelete?.name}</strong> to confirm.
                            </div>
                            <Input 
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={userToDelete?.name}
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

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage admin and driver accounts</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new admin or driver account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
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
                                        variant={role === 'ADMIN' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setRole('ADMIN')}
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={role === 'DRIVER' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setRole('DRIVER')}
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Driver
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Accounts
                    </CardTitle>
                    <CardDescription>
                        {users.length} user{users.length !== 1 ? 's' : ''} registered
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadError && (
                        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {loadError}
                        </div>
                    )}
                    {users.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[60px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
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
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    setUserToDelete({ id: user.id, name: user.name });
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
