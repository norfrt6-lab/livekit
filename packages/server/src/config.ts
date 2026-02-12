import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  },
  livekit: {
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
    wsUrl: process.env.LIVEKIT_WS_URL || '',
  },
};

export function validateConfig(): void {
  const { livekit } = config;

  if (!livekit.apiKey) {
    throw new Error('LIVEKIT_API_KEY is required');
  }
  if (!livekit.apiSecret) {
    throw new Error('LIVEKIT_API_SECRET is required');
  }
  if (!livekit.wsUrl) {
    throw new Error('LIVEKIT_WS_URL is required');
  }
}
