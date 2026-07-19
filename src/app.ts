import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { patientRoutes } from './routes/patient.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { medicationRoutes } from './routes/medication.routes';
import { professionalRoutes } from './routes/professional.routes';

export function createApp() {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medications', medicationRoutes);
  app.use('/api/professionals', professionalRoutes);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
