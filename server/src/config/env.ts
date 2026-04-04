/**
 * Validates that all required environment variables are set.
 * Call once after dotenv.config() — fails fast so misconfig is caught on boot,
 * not at runtime when a user hits a payment endpoint.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

const OPTIONAL_VARS = [
  { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloudinary (image uploads)' },
  { key: 'REDIS_URL', label: 'Redis (caching / sessions)' },
] as const;

export const validateEnv = () => {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n[KalaSetu] ❌ Missing required environment variables:\n` +
        missing.map((k) => `  - ${k}`).join('\n') +
        `\n\nCopy server/env.example → server/.env and fill in the values.\n`,
    );
    process.exit(1);
  }

  for (const { key, label } of OPTIONAL_VARS) {
    if (!process.env[key]?.trim()) {
      console.warn(`[KalaSetu] ⚠  Optional env var ${key} not set (${label})`);
    }
  }

  console.log('[KalaSetu] ✅ Environment validated');
};
