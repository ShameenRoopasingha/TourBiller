import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).refine(data => !!data.NEXTAUTH_SECRET || !!data.AUTH_SECRET, {
  message: 'Either NEXTAUTH_SECRET or AUTH_SECRET must be defined',
  path: ['AUTH_SECRET'],
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid or missing environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration in production.');
    }
  }
}
