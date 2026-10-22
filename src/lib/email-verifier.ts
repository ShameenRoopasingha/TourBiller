/**
 * Open-Source Email Verifier for Vigil Tour Management Platform
 * 
 * 100% Open Source - Zero External Paid APIs (ZeroBounce, Hunter, etc.)
 * 
 * Features:
 * 1. RFC 5322 Compliant Syntax Validation
 * 2. Open-Source Curated Disposable / Burner Email Blocklist
 * 3. Native Node.js DNS MX Record Resolution (dns.promises.resolveMx)
 * 4. Common Domain Typo Suggestion (e.g. gmil.com -> gmail.com)
 */

import dns from 'dns';

// Curated list of popular disposable/temporary email domains
export const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.it',
  'burnermail.io',
  'crazymailing.com',
  'dispostable.com',
  'dropmail.me',
  'fakemailgenerator.com',
  'getairmail.com',
  'guerrillamail.biz',
  'guerrillamail.block',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'inboxkitten.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mohmal.com',
  'mytrashmail.com',
  'nada.ltd',
  'nada.ltd',
  'sharklasers.com',
  'spam4.me',
  'spambog.com',
  'temp-mail.org',
  'temp-mail.ru',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

// Common typos mapped to valid domains
const DOMAIN_TYPO_MAP: Record<string, string> = {
  'gmil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

export interface EmailVerificationCheckResult {
  valid: boolean;
  email: string;
  domain: string;
  error?: string;
  suggestion?: string;
  isDisposable?: boolean;
  hasMxRecords?: boolean;
}

/**
 * Validates email format according to RFC 5322 standards.
 */
export function isValidEmailSyntax(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;

  // RFC 5322 regex approximation for production web use
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Checks if a domain is a known disposable/burner email service.
 */
export function isDisposableDomain(domain: string): boolean {
  if (!domain) return false;
  const cleanDomain = domain.toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(cleanDomain);
}

/**
 * Verifies DNS MX (Mail Exchange) records for a domain.
 * Ensures the target domain actually has configured mail servers capable of receiving mail.
 */
export async function checkDomainMxRecords(domain: string, timeoutMs = 4000): Promise<boolean> {
  if (!domain) return false;
  const cleanDomain = domain.toLowerCase().trim();

  // In test / CI environments or localhost, allow mock domains
  if (cleanDomain === 'localhost' || cleanDomain.endsWith('.test') || cleanDomain.endsWith('.local') || cleanDomain.endsWith('.example')) {
    return true;
  }

  try {
    const mxPromise = dns.promises.resolveMx(cleanDomain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS MX resolution timeout')), timeoutMs)
    );

    const records = await Promise.race([mxPromise, timeoutPromise]);
    return Array.isArray(records) && records.length > 0;
  } catch (error: any) {
    // If ENOTFOUND, ENODATA, or NXDOMAIN, domain definitely has no MX records
    if (error?.code === 'ENOTFOUND' || error?.code === 'ENODATA' || error?.code === 'SERVFAIL') {
      return false;
    }
    // For network timeouts or transient DNS glitches in dev, fallback to A-record check
    try {
      const aRecords = await dns.promises.resolve4(cleanDomain);
      return Array.isArray(aRecords) && aRecords.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Comprehensive open-source email verification function.
 * Performs syntax check, disposable check, domain typo suggestion, and DNS MX resolution.
 */
export async function verifyEmailAddress(rawEmail: string): Promise<EmailVerificationCheckResult> {
  const email = (rawEmail || '').trim().toLowerCase();

  // 1. Syntax check
  if (!isValidEmailSyntax(email)) {
    return {
      valid: false,
      email,
      domain: '',
      error: 'Please enter a valid email address (e.g. name@example.com).',
    };
  }

  const parts = email.split('@');
  const domain = parts[1]?.toLowerCase().trim() || '';

  // 2. Typo suggestion
  const suggestion = DOMAIN_TYPO_MAP[domain]
    ? `${parts[0]}@${DOMAIN_TYPO_MAP[domain]}`
    : undefined;

  // 3. Disposable email check
  if (isDisposableDomain(domain)) {
    return {
      valid: false,
      email,
      domain,
      isDisposable: true,
      error: 'Temporary / disposable email addresses are not permitted. Please use a permanent email address.',
    };
  }

  // 4. Native DNS MX records resolution
  const hasMxRecords = await checkDomainMxRecords(domain);
  if (!hasMxRecords) {
    return {
      valid: false,
      email,
      domain,
      hasMxRecords: false,
      suggestion,
      error: suggestion
        ? `The domain "${domain}" has no active mail exchange (MX) servers. Did you mean "${suggestion}"?`
        : `The domain "${domain}" does not exist or does not have active mail exchange (MX) servers.`,
    };
  }

  return {
    valid: true,
    email,
    domain,
    hasMxRecords: true,
    isDisposable: false,
    suggestion,
  };
}
