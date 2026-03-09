'use client';

import { useState } from 'react';
import { updateProfile, updatePassword } from '@/lib/profile-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save, KeyRound } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileFormProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const { update } = useSession();
    const router = useRouter();

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setUpdatingProfile(true);

        const formData = new FormData();
        formData.set('name', name);
        formData.set('email', email);

        const result = await updateProfile(formData);
        
        if (result.success) {
            setProfileSuccess('Profile updated successfully.');
            // Update session data
            await update({ name, email });
            router.refresh();
        } else {
            setProfileError(result.error || 'Failed to update profile.');
        }
        
        setUpdatingProfile(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }

        setUpdatingPassword(true);

        const formData = new FormData();
        formData.set('currentPassword', currentPassword);
        formData.set('newPassword', newPassword);

        const result = await updatePassword(formData);
        
        if (result.success) {
            setPasswordSuccess('Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordError(result.error || 'Failed to update password.');
        }
        
        setUpdatingPassword(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your name and email address.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                        {profileError && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                                {profileError}
                            </div>
                        )}
                        {profileSuccess && (
                            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-md border border-green-500/20">
                                {profileSuccess}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Input value={user.role} disabled className="bg-muted" />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4 flex justify-end">
                    <Button form="profile-form" type="submit" disabled={updatingProfile}>
                        {updatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Ensure your account is securely protected.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="password-form" onSubmit={handleUpdatePassword} className="space-y-4">
                        {passwordError && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-md border border-green-500/20">
                                {passwordSuccess}
                            </div>
                        )}
                        <div className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <Input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4 flex justify-end">
                    <Button form="password-form" type="submit" variant="secondary" disabled={updatingPassword}>
                        {updatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                        Update Password
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
