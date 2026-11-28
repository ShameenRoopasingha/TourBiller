'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { notify } from '@/lib/notifications';
import { ShieldCheck, ShieldAlert, Loader2, KeyRound, Copy, Check, RefreshCw } from 'lucide-react';

interface MfaSettingsCardProps {
    initialEnabled: boolean;
    initialBackupCodesRemaining: number;
}

export function MfaSettingsCard({
    initialEnabled,
    initialBackupCodesRemaining,
}: MfaSettingsCardProps) {
    const [mfaEnabled, setMfaEnabled] = useState(initialEnabled);
    const [backupCodesRemaining, setBackupCodesRemaining] = useState(initialBackupCodesRemaining);

    const [setupStep, setSetupStep] = useState<'idle' | 'qr'>('idle');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [manualSecret, setManualSecret] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [plainBackupCodes, setPlainBackupCodes] = useState<string[]>([]);
    const [copiedCodes, setCopiedCodes] = useState(false);

    const [disableMode, setDisableMode] = useState<'none' | 'disable' | 'regenerate'>('none');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [busy, setBusy] = useState(false);

    const startSetup = async () => {
        setBusy(true);
        try {
            const res = await fetch('/api/profile/mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'begin' }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                notify.error(data.error || 'Failed to start 2FA setup.');
                return;
            }
            setQrDataUrl(data.qrDataUrl);
            setManualSecret(data.manualSecret);
            setVerifyCode('');
            setPlainBackupCodes([]);
            setSetupStep('qr');
        } catch {
            notify.error('Unable to start authenticator setup.');
        } finally {
            setBusy(false);
        }
    };

    const confirmEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await fetch('/api/profile/mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'enable', code: verifyCode.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                notify.error(data.error || 'Invalid authenticator code.');
                return;
            }
            setMfaEnabled(true);
            setSetupStep('idle');
            setVerifyCode('');
            setPlainBackupCodes(data.backupCodes || []);
            setBackupCodesRemaining((data.backupCodes || []).length);
            notify.success('Two-factor authentication enabled.');
        } catch {
            notify.error('Failed to verify 2FA code.');
        } finally {
            setBusy(false);
        }
    };

    const handleManageAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            const isDisable = disableMode === 'disable';
            const res = await fetch('/api/profile/mfa', {
                method: isDisable ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    isDisable
                        ? { currentPassword, code: confirmCode.trim() }
                        : { action: 'regenerate', currentPassword, code: confirmCode.trim() }
                ),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                notify.error(data.error || 'Verification failed.');
                return;
            }
            if (isDisable) {
                setMfaEnabled(false);
                setPlainBackupCodes([]);
                setBackupCodesRemaining(0);
                notify.success('Two-factor authentication disabled.');
            } else {
                setPlainBackupCodes(data.backupCodes || []);
                setBackupCodesRemaining((data.backupCodes || []).length);
                notify.success('New backup recovery codes generated.');
            }
            setDisableMode('none');
            setCurrentPassword('');
            setConfirmCode('');
        } catch {
            notify.error('Failed to update MFA settings.');
        } finally {
            setBusy(false);
        }
    };

    const copyBackupCodes = async () => {
        try {
            await navigator.clipboard.writeText(plainBackupCodes.join('\n'));
            setCopiedCodes(true);
            setTimeout(() => setCopiedCodes(false), 2000);
        } catch {
            notify.error('Unable to copy to clipboard.');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {mfaEnabled ? (
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                        )}
                        <CardTitle>Two-Factor Authentication (MFA / 2FA)</CardTitle>
                    </div>
                    <span
                        className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full ${
                            mfaEnabled
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                    >
                        {mfaEnabled ? 'ENABLED' : 'NOT ENABLED'}
                    </span>
                </div>
                <CardDescription>
                    Protect your account with a 6-digit TOTP authenticator app (Google Authenticator, Authy, 1Password) and single-use recovery backup codes.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {plainBackupCodes.length > 0 && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <div className="font-semibold text-sm text-foreground">
                                    Save Your Single-Use Backup Recovery Codes
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Shown only once. Store these safely in case you lose access to your authenticator device.
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={copyBackupCodes}>
                                {copiedCodes ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                                {copiedCodes ? 'Copied' : 'Copy All'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                            {plainBackupCodes.map((code) => (
                                <div
                                    key={code}
                                    className="rounded-md border border-border bg-background px-2.5 py-1.5 text-center font-semibold tracking-wider"
                                >
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!mfaEnabled && setupStep === 'idle' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
                        <div className="text-sm text-muted-foreground">
                            Authenticator 2FA adds a required 6-digit verification step after password sign-in.
                        </div>
                        <Button type="button" onClick={startSetup} disabled={busy}>
                            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                            Set Up Authenticator App
                        </Button>
                    </div>
                )}

                {!mfaEnabled && setupStep === 'qr' && (
                    <form onSubmit={confirmEnable} className="space-y-4 rounded-lg border border-border p-4 bg-muted/20">
                        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                            {qrDataUrl && (
                                <div className="p-2 bg-white rounded-xl border border-border shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt="Vigil 2FA QR Code" width={180} height={180} />
                                </div>
                            )}
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                    1. Scan this QR code in Google Authenticator, Authy, or Microsoft Authenticator.
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Manual Setup Key</Label>
                                    <div className="mt-1 font-mono text-xs bg-background border border-border rounded-md px-3 py-2 break-all select-all">
                                        {manualSecret}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mfa-verify-code">2. Enter the 6-digit code to activate</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="mfa-verify-code"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                            placeholder="123456"
                                            maxLength={10}
                                            className="max-w-[180px] font-mono tracking-widest"
                                            required
                                        />
                                        <Button type="submit" disabled={busy}>
                                            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Verify &amp; Enable
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setSetupStep('idle')}
                                            disabled={busy}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                )}

                {mfaEnabled && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
                            <div className="text-sm">
                                <span className="font-medium text-foreground">Authenticator protection active</span>
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                    Unused single-use backup codes remaining: <strong>{backupCodesRemaining}</strong>
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDisableMode(disableMode === 'regenerate' ? 'none' : 'regenerate')}
                                >
                                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                    Regenerate Backup Codes
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDisableMode(disableMode === 'disable' ? 'none' : 'disable')}
                                >
                                    Disable 2FA
                                </Button>
                            </div>
                        </div>

                        {disableMode !== 'none' && (
                            <form onSubmit={handleManageAction} className="rounded-lg border border-border p-4 space-y-3 bg-muted/20">
                                <div className="text-sm font-semibold">
                                    {disableMode === 'disable'
                                        ? 'Confirm password and 2FA code to disable Two-Factor Authentication'
                                        : 'Confirm password and current 6-digit authenticator code to regenerate backup codes'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mfa-confirm-password">Current Password</Label>
                                        <PasswordInput
                                            id="mfa-confirm-password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mfa-confirm-code">
                                            {disableMode === 'disable' ? 'Authenticator or Backup Code' : '6-Digit Authenticator Code'}
                                        </Label>
                                        <Input
                                            id="mfa-confirm-code"
                                            value={confirmCode}
                                            onChange={(e) => setConfirmCode(e.target.value)}
                                            placeholder="123456"
                                            className="font-mono tracking-wider"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant={disableMode === 'disable' ? 'destructive' : 'default'}
                                        size="sm"
                                        disabled={busy}
                                    >
                                        {busy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                                        {disableMode === 'disable' ? 'Confirm Disable 2FA' : 'Generate Fresh Codes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setDisableMode('none');
                                            setCurrentPassword('');
                                            setConfirmCode('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
