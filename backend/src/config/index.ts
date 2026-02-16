import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: 3600,
  nodeEnv: process.env.NODE_ENV || 'development',
};
