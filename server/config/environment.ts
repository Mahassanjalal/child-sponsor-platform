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
  BASE_URL?: string;
}

const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'] as const;

const optionalEnvVars = [
  'RESEND_API_KEY',
  'FROM_EMAIL', 
  'ADMIN_EMAIL',
  'BASE_URL',
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
    warnings.push('FROM_EMAIL not set - using default sender');
  }
  if (!process.env.BASE_URL) {
    warnings.push('BASE_URL not set - using localhost for email links');
  }

  // Log warnings in development
  if (process.env.NODE_ENV !== 'production' && warnings.length > 0) {
    console.log('\n⚠️  Optional environment variables not set:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    BASE_URL: process.env.BASE_URL,
  };
}

export function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:5000';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}
