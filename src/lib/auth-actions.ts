'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { type ActionResult, PasswordResetRequestSchema, PasswordResetConfirmSchema } from '@/lib/validations';
import crypto from 'crypto';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/open-source-mailer';
import { hashOpaqueToken } from '@/lib/crypto-utils';

/**
 * Request a password reset OTP and link (forgot password)
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult<{ isDevFallback?: boolean; resetLink?: string; otpCode?: string }>> {
    try {
        const raw = { email: formData.get('email') };
        const parsed = PasswordResetRequestSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Email is required' };
        }
        const { email } = parsed.data;

        // Rate limit: 5 password reset requests per email per 15 minutes
        const { limited, retryAfterMs } = await checkDistributedRateLimit(`pwd-reset:${email}`, 5, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return { success: false, error: `Too many reset attempts. Please try again in ${retryMinutes} minute(s).` };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        
        // We always return success even if user not found to prevent email enumeration
        if (!user) {
            return { success: true };
        }

        // Generate a 6-digit OTP code using CSPRNG and a secure random token
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        // Delete any existing tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        });

        // Save only SHA-256 hashes of the reset token & OTP at rest
        await prisma.passwordResetToken.create({
            data: {
                email,
                token: hashOpaqueToken(token),
                otpCode: hashOpaqueToken(otpCode),
                expires
            }
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        
        // Dispatch password reset email via open-source Nodemailer (or Dev console fallback)
        const mailResult = await sendPasswordResetEmail({
            to: email,
            name: user.name,
            resetLink,
            otpCode,
        });

        if (!mailResult.success) {
            return { success: false, error: mailResult.error || 'Failed to send password reset email' };
        }

        if (mailResult.isDevFallback && process.env.NODE_ENV !== 'production') {
            return {
                success: true,
                data: {
                    isDevFallback: true,
                    resetLink,
                    otpCode,
                },
                isDevFallback: true,
                resetLink,
                otpCode,
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Error requesting password reset:', error);
        return { success: false, error: 'Failed to request password reset' };
    }
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string): Promise<boolean> {
    try {
        if (!token) return false;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token: hashOpaqueToken(token) }
        });

        if (!resetToken) return false;

        // Check if expired
        if (resetToken.expires < new Date()) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verifying token:', error);
        return false;
    }
}

/**
 * Verify if a 6-digit reset OTP is valid for a given email
 */
export async function verifyResetOtp(email: string, otpCode: string): Promise<boolean> {
    try {
        if (!email || !otpCode) return false;

        const cleanEmail = email.trim().toLowerCase();
        const hashedOtp = hashOpaqueToken(otpCode);

        const resetRecord = await prisma.passwordResetToken.findFirst({
            where: {
                email: cleanEmail,
                otpCode: hashedOtp,
                expires: { gt: new Date() }
            }
        });

        return !!resetRecord;
    } catch (error) {
        console.error('Error verifying reset OTP:', error);
        return false;
    }
}

/**
 * Reset the password using either a 1-click token OR an email + 6-digit OTP code
 */
export async function resetPassword(formData: FormData): Promise<ActionResult<void>> {
    try {
        const raw = {
            token: formData.get('token') ? String(formData.get('token')) : undefined,
            email: formData.get('email') ? String(formData.get('email')).trim().toLowerCase() : undefined,
            otpCode: formData.get('otpCode') ? String(formData.get('otpCode')).trim() : undefined,
            password: formData.get('password'),
        };

        const parsed = PasswordResetConfirmSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Missing required fields' };
        }

        const { token, email, otpCode, password } = parsed.data;

        if (!token && (!email || !otpCode)) {
            return { success: false, error: 'Provide either a reset link token or your email and 6-digit OTP code.' };
        }

        // Rate limit: 5 reset attempts per identifier per 15 minutes
        const rateLimitKey = token ? `pwd-token:${hashOpaqueToken(token)}` : `pwd-otp:${email}`;
        const { limited, retryAfterMs } = await checkDistributedRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return { success: false, error: `Too many attempts. Please try again in ${retryMinutes} minute(s).` };
        }

        // Atomic: verify, update password, increment tokenVersion (revokes mobile JWTs), and delete token
        await prisma.$transaction(async (tx) => {
            let resetToken = null;

            if (token) {
                resetToken = await tx.passwordResetToken.findUnique({
                    where: { token: hashOpaqueToken(token) }
                });
            } else if (email && otpCode) {
                resetToken = await tx.passwordResetToken.findFirst({
                    where: {
                        email,
                        otpCode: hashOpaqueToken(otpCode),
                        expires: { gt: new Date() }
                    }
                });
            }

            if (!resetToken || resetToken.expires < new Date()) {
                throw new Error('Invalid or expired reset code/token');
            }

            const user = await tx.user.findUnique({
                where: { email: resetToken.email }
            });

            if (!user) {
                throw new Error('User account not found');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password, increment tokenVersion, and delete all tokens for this user
            await tx.user.update({
                where: { email: user.email },
                data: {
                    password: hashedPassword,
                    tokenVersion: { increment: 1 },
                }
            });

            await tx.passwordResetToken.deleteMany({
                where: { email: user.email }
            });
        });

        return { success: true };
    } catch (error: unknown) {
        console.error('Error resetting password:', error);
        const message = error instanceof Error ? error.message : 'Failed to reset password';
        return { success: false, error: message };
    }
}
