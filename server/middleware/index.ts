/**
 * Middleware exports
 */
export { 
  setupAuth, 
  requireAuth, 
  requireAdmin, 
  hashPassword, 
  comparePasswords 
} from './auth';

export { 
  createRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  contactRateLimiter,
  generalRateLimiter
} from './rate-limit';
