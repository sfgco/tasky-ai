import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Runtime port for the NestJS API server.
  port: parseInt(process.env.PORT || '3000', 10),
  // Bind address used when running the backend in Docker or locally.
  host: process.env.HOST || '0.0.0.0',
  // Environment name used across the app and logging setup.
  environment: process.env.NODE_ENV || 'development',
  cors: {
    // Allow all origins when CORS_ORIGIN is '*' to keep local development simple.
    origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN || true,
    // Standard HTTP methods exposed by the API.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Headers the browser is allowed to send for authenticated API requests.
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  swagger: {
    // Public metadata shown in the generated Swagger UI.
    title: 'tasky API',
    description: 'A comprehensive project management API similar to Jira, Asana, and Monday.com',
    version: '1.0.0',
    // Route used to access Swagger/OpenAPI documentation.
    path: 'api/docs',
  },
}));
