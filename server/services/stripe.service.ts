/**
 * Stripe service for payment processing
 */
import Stripe from 'stripe';

function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    throw new Error(
      'Stripe credentials not found. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.'
    );
  }

  return { secretKey, publishableKey };
}

/**
 * Get a new Stripe client instance (uncached)
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

/**
 * Get the Stripe publishable key
 */
export async function getStripePublishableKey(): Promise<string> {
  const { publishableKey } = getCredentials();
  return publishableKey;
}

/**
 * Get the Stripe secret key
 */
export async function getStripeSecretKey(): Promise<string> {
  const { secretKey } = getCredentials();
  return secretKey;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
}
