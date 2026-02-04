/**
 * Environment configuration and validation for production deployment
 */

interface EnvConfig {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  // Optional but recommended for production
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  ADMIN_EMAIL?: string;
  REPLIT_DOMAINS?: string;
}

const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'] as const;

const optionalEnvVars = [
  'RESEND_API_KEY',
  'FROM_EMAIL', 
  'ADMIN_EMAIL',
  'REPLIT_DOMAINS',
  'NODE_ENV',
  'PORT',
] as const;

export function validateEnvironment(): EnvConfig {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }

  // Check optional but recommended variables
  if (!process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY not set - email functionality will be mocked');
  }
  if (!process.env.FROM_EMAIL) {
    warnings.push('FROM_EMAIL not set - using default noreply@hopeconnect.org');
  }
  if (!process.env.ADMIN_EMAIL) {
    warnings.push('ADMIN_EMAIL not set - contact form emails will go to admin@hopeconnect.org');
  }

  // Validate SESSION_SECRET strength
  const sessionSecret = process.env.SESSION_SECRET!;
  if (sessionSecret.length < 32) {
    warnings.push('SESSION_SECRET is shorter than 32 characters - consider using a stronger secret');
  }

  // Log warnings
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  console.log('✅ Environment configuration validated');

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
  };
}

export const config = validateEnvironment();
