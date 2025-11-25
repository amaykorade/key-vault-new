import { z } from 'zod';

const EnvSchema = z.object({
	PORT: z.string().default('4000'),
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	DATABASE_URL: z.string().url(),
	JWT_ACCESS_SECRET: z.string().min(16),
	JWT_REFRESH_SECRET: z.string().min(16),
	JWT_ACCESS_TTL: z.string().default('15m'),
	JWT_REFRESH_TTL: z.string().default('7d'),
	ENCRYPTION_KEY: z.string().min(32),
	CORS_ORIGIN: z.string().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GOOGLE_CALLBACK_URL: z.string().url().optional(),
	// Email configuration
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z.string().optional(),
	SMTP_SECURE: z.string().optional(),
	SMTP_USER: z.string().optional(),
	SMTP_PASS: z.string().optional(),
	FROM_EMAIL: z.string().email().optional(),
	FROM_NAME: z.string().optional(),
	FRONTEND_URL: z.string().url().optional(),
	// Razorpay configuration
	RAZORPAY_KEY_ID: z.string().optional(),
	RAZORPAY_KEY_SECRET: z.string().optional(),
	RAZORPAY_WEBHOOK_SECRET: z.string().optional()
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(): AppEnv {
	const parsed = EnvSchema.safeParse(process.env);
	if (!parsed.success) {
		console.error('[env] Invalid configuration', parsed.error.flatten().fieldErrors);
		throw new Error('Invalid environment configuration');
	}
	return parsed.data;
}
