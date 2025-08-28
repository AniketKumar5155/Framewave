const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis'); 
const { client: redisClient } = require('../config/redisClient');
const { ipKeyGenerator } = require('express-rate-limit');

const keyGenerator = (req) => {
  const ip = ipKeyGenerator(req);
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ip}_${userAgent}`;
};

const globalRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator,
  message: 'Too many requests. Please try again later.',
});

const signupRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator,
  message: 'Too many signup attempts. Please try again later.',
});

const otpRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator,
  message: 'Too many OTP requests. Please try again later.',
});


const loginRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator,
  message: 'Too many login attempts. Please try again later.',
});


module.exports = {
  globalRateLimiter,
  signupRateLimiter,
  otpRateLimiter,
  loginRateLimiter
};
