import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4004,
  mongoUri:
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST || 'mongodb://localhost:27020/movieverse_test'
      : required('MONGO_URI', 'mongodb://localhost:27020/movieverse'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5176',
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@movieverse.dev',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  },
};
