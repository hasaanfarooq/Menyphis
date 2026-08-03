// #5 FIX: Rate limiting utility using rate-limiter-flexible (in-memory store)
// For production with multiple instances, replace with Redis-backed RateLimiterRedis
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Login: max 5 attempts per IP per 15 minutes
const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // 15 minutes in seconds
});

// Register: max 3 accounts per IP per hour
const registerLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60, // 1 hour in seconds
});

/**
 * Gets the client IP from a Next.js Request object
 */
function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Applies login rate limiting. Returns a 429 Response if rate limit is exceeded,
 * or null if the request is allowed through.
 */
export async function applyLoginRateLimit(request) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') return null;

  const ip = getIP(request);
  try {
    await loginLimiter.consume(ip);
    return null; // allowed
  } catch {
    return new Response(
      JSON.stringify({ error: 'Too many login attempts. Please wait 15 minutes before trying again.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '900' } }
    );
  }
}

/**
 * Applies register rate limiting. Returns a 429 Response if rate limit is exceeded,
 * or null if the request is allowed through.
 */
export async function applyRegisterRateLimit(request) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') return null;

  const ip = getIP(request);
  try {
    await registerLimiter.consume(ip);
    return null; // allowed
  } catch {
    return new Response(
      JSON.stringify({ error: 'Too many registration attempts. Please wait before trying again.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' } }
    );
  }
}
