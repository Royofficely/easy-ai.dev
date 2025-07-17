const rateLimit = require('express-rate-limit');

// General rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (more restrictive)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API rate limiter (simplified for now)
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // default limit
  message: {
    error: 'API rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  apiRateLimiter
};