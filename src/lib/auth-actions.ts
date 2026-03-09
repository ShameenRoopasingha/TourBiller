'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { type ActionResult } from '@/lib/validations';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Request a password reset link (forgot password)
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult<void>> {
    try {
        const email = formData.get('email') as string;
        
        if (!email) {
            return { success: false, error: 'Email is required' };
        }

        // Rate limit: 5 password reset requests per email per 15 minutes
        const { limited, retryAfterMs } = rateLimit(`pwd-reset:${email}`, 5, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return { success: false, error: `Too many reset attempts. Please try again in ${retryMinutes} minute(s).` };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        
        // We always return success even if user not found to prevent email enumeration
        if (!user) {
            return { success: true };
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token expires in 1 hour
        const expires = new Date(Date.now() + 3600000);

        // Delete any existing tokens for this email
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        });

        // Save new token
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        // In a real app, send an email here using SendGrid/Resend/Nodemailer
        // Since we are mocking the email service, we log it to server console for development
        console.log('====================================');
        console.log(`MOCK EMAIL SENT TO: ${email}`);
        console.log(`SUBJECT: Reset your password for Tour Biller`);
        console.log(`BODY: Click the link below to reset your password.`);
        console.log(`LINK: ${resetLink}`);
        console.log('====================================');

        // Never return the reset link to the client — it should only be in server logs
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
            where: { token }
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
 * Reset the password using a valid token
 */
export async function resetPassword(formData: FormData): Promise<ActionResult<void>> {
    try {
        const token = formData.get('token') as string;
        const password = formData.get('password') as string;

        if (!token || !password) {
            return { success: false, error: 'Missing required fields' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Rate limit: 5 reset attempts per token per 15 minutes
        const { limited, retryAfterMs } = rateLimit(`pwd-token:${token}`, 5, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return { success: false, error: `Too many attempts. Please try again in ${retryMinutes} minute(s).` };
        }

        // Atomic: verify, update password, and delete token in one transaction
        // This prevents race conditions where the same token could be used twice
        await prisma.$transaction(async (tx) => {
            const resetToken = await tx.passwordResetToken.findUnique({
                where: { token }
            });

            if (!resetToken || resetToken.expires < new Date()) {
                throw new Error('Invalid or expired reset token');
            }

            const user = await tx.user.findUnique({
                where: { email: resetToken.email }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password and delete all tokens for this user
            await tx.user.update({
                where: { email: user.email },
                data: { password: hashedPassword }
            });

            await tx.passwordResetToken.deleteMany({
                where: { email: user.email }
            });
        });

        return { success: true };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}
