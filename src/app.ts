import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { errorMiddleware } from './middlewares/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { patientRoutes } from './routes/patient.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { medicationRoutes } from './routes/medication.routes';
import { professionalRoutes } from './routes/professional.routes';
import { swaggerSpec } from './docs/swagger';
import { env } from './config/env';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

export function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medications', medicationRoutes);
  app.use('/api/professionals', professionalRoutes);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
