const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';
const skip = () => isTest;

// Auth endpoints: login / signup — protect against brute-force and account enumeration.
// 10 attempts per 15 minutes is generous for a legitimate user but stops any real attack.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});

// General read API — map loads, game lists, player profiles.
// 200 per 15 min ≈ 13/min; a normal mobile session won't come close.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Write operations — game creation, join requests, ratings.
// 60 per 15 min is still very generous for any real user action.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

module.exports = { authLimiter, generalLimiter, writeLimiter };
