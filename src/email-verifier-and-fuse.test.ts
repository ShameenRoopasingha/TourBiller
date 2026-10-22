import { isValidEmailSyntax, isDisposableDomain, checkDomainMxRecords, verifyEmailAddress } from './lib/email-verifier';
import Fuse from 'fuse.js';

describe('Open-Source Email Verifier', () => {
    it('should validate standard email syntax correctly', () => {
        expect(isValidEmailSyntax('driver@vigil.app')).toBe(true);
        expect(isValidEmailSyntax('user.test+filter@gmail.com')).toBe(true);
        expect(isValidEmailSyntax('invalid-email')).toBe(false);
        expect(isValidEmailSyntax('@nodomain.com')).toBe(false);
        expect(isValidEmailSyntax('spaces in@email.com')).toBe(false);
        expect(isValidEmailSyntax('')).toBe(false);
    });

    it('should identify disposable / burner email domains', () => {
        expect(isDisposableDomain('mailinator.com')).toBe(true);
        expect(isDisposableDomain('tempmail.com')).toBe(true);
        expect(isDisposableDomain('10minutemail.com')).toBe(true);
        expect(isDisposableDomain('sharklasers.com')).toBe(true);
        expect(isDisposableDomain('gmail.com')).toBe(false);
        expect(isDisposableDomain('outlook.com')).toBe(false);
    });

    it('should pass test/mock domains for checkDomainMxRecords', async () => {
        expect(await checkDomainMxRecords('company.test')).toBe(true);
        expect(await checkDomainMxRecords('localhost')).toBe(true);
    });

    it('should block disposable email addresses during full verification', async () => {
        const result = await verifyEmailAddress('fakeuser@mailinator.com');
        expect(result.valid).toBe(false);
        expect(result.isDisposable).toBe(true);
        expect(result.error).toContain('Temporary / disposable');
    });

    it('should block non-existent domains with no MX servers', async () => {
        const result = await verifyEmailAddress('user@fake-nonexistent-domain-test-999xyz.org');
        expect(result.valid).toBe(false);
        expect(result.hasMxRecords).toBe(false);
        expect(result.error).toContain('does not exist or does not have active mail exchange');
    });

    it('should provide suggestions for common typos', async () => {
        const result = await verifyEmailAddress('test@gmil.com');
        expect(result.suggestion).toBe('test@gmail.com');
    });
});

describe('Fuse.js Fuzzy Searching', () => {
    const landmarks = [
        { name: 'Sigiriya Rock Fortress', shortName: 'Sigiriya Lion Rock', aliases: ['sigiriya', 'lion rock'] },
        { name: 'Bandaranaike International Airport', shortName: 'BIA Airport', aliases: ['bia', 'airport'] },
        { name: 'Temple of the Sacred Tooth Relic', shortName: 'Temple of the Tooth', aliases: ['dalada maligawa', 'kandy temple'] },
        { name: 'Nine Arches Bridge', shortName: 'Nine Arches Bridge, Ella', aliases: ['nine arch', 'ella bridge'] },
    ];

    const fuse = new Fuse(landmarks, {
        keys: [
            { name: 'name', weight: 0.4 },
            { name: 'shortName', weight: 0.3 },
            { name: 'aliases', weight: 0.25 },
        ],
        threshold: 0.35,
    });

    it('should find exact and typo-matched landmarks', () => {
        const match1 = fuse.search('sigiriya');
        expect(match1.length).toBeGreaterThan(0);
        expect(match1[0].item.shortName).toBe('Sigiriya Lion Rock');

        // Typo tolerance: 'sigirya' (missing 'i')
        const match2 = fuse.search('sigirya');
        expect(match2.length).toBeGreaterThan(0);
        expect(match2[0].item.shortName).toBe('Sigiriya Lion Rock');

        // Search alias 'dalada'
        const match3 = fuse.search('dalada');
        expect(match3.length).toBeGreaterThan(0);
        expect(match3[0].item.shortName).toBe('Temple of the Tooth');

        // Search alias 'ella bridge'
        const match4 = fuse.search('ella bridge');
        expect(match4.length).toBeGreaterThan(0);
        expect(match4[0].item.shortName).toBe('Nine Arches Bridge, Ella');
    });

    it('should search vehicles with typo tolerance', () => {
        const vehicles = [
            { vehicleNo: 'CBO-0087', model: 'BYD Sealion 6 Superior', category: 'SUV' },
            { vehicleNo: 'NC-8724', model: 'Toyota KDH 200 Super GL Luxury', category: 'VAN' },
            { vehicleNo: 'ND-2969', model: 'Toyota Coaster Bus With A/C', category: 'BUS' },
        ];

        const vehicleFuse = new Fuse(vehicles, {
            keys: ['vehicleNo', 'model', 'category'],
            threshold: 0.35,
        });

        // Search 'sealion'
        const r1 = vehicleFuse.search('sealion');
        expect(r1[0].item.vehicleNo).toBe('CBO-0087');

        // Search typo 'sealon'
        const r2 = vehicleFuse.search('sealon');
        expect(r2[0].item.vehicleNo).toBe('CBO-0087');

        // Search 'kdh'
        const r3 = vehicleFuse.search('kdh');
        expect(r3[0].item.vehicleNo).toBe('NC-8724');

        // Search 'coaster'
        const r4 = vehicleFuse.search('coaster');
        expect(r4[0].item.vehicleNo).toBe('ND-2969');
    });
});

import { generateVerificationEmailHtml, generatePasswordResetEmailHtml } from './lib/open-source-mailer';
import { PasswordResetConfirmSchema } from './lib/validations';

describe('6-Digit OTP Email Dispatch & Validation', () => {
    it('should generate email verification HTML with 6-digit OTP and direct link', () => {
        const html = generateVerificationEmailHtml({
            name: 'Shameen',
            otpCode: '582914',
            verifyLink: 'https://vigil.app/verify-email?token=xyz123',
        });

        expect(html).toContain('582914');
        expect(html).toContain('https://vigil.app/verify-email?token=xyz123');
        expect(html).toContain('Your 6-Digit Verification Code');
    });

    it('should generate password reset HTML with 6-digit OTP and direct link', () => {
        const html = generatePasswordResetEmailHtml({
            name: 'Shameen',
            resetLink: 'https://vigil.app/reset-password?token=abc456',
            otpCode: '839201',
        });

        expect(html).toContain('839201');
        expect(html).toContain('https://vigil.app/reset-password?token=abc456');
        expect(html).toContain('Your 6-Digit Password Reset OTP Code');
    });

    it('should validate password reset with 6-digit OTP code', () => {
        const result = PasswordResetConfirmSchema.safeParse({
            email: 'shameenroopasingha@gmail.com',
            otpCode: '839201',
            password: 'NewSecurePassword123',
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.otpCode).toBe('839201');
            expect(result.data.email).toBe('shameenroopasingha@gmail.com');
        }
    });

    it('should validate password reset with 1-click token', () => {
        const result = PasswordResetConfirmSchema.safeParse({
            token: 'a81e8ffcee36b445ef23026ca0a361bbe78266fb8add7682b923b82b5483def7',
            password: 'NewSecurePassword123',
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.token).toBe('a81e8ffcee36b445ef23026ca0a361bbe78266fb8add7682b923b82b5483def7');
        }
    });

    it('should reject password reset when neither token nor email+otp are provided', () => {
        const result = PasswordResetConfirmSchema.safeParse({
            password: 'NewSecurePassword123',
        });

        expect(result.success).toBe(false);
    });
});
