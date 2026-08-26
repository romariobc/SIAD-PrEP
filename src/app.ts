import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { errorMiddleware } from './middlewares/error.middleware';
import { authRoutes } from './routes/auth.routes';
import { patientRoutes } from './routes/patient.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { medicationRoutes } from './routes/medication.routes';
import { professionalRoutes } from './routes/professional.routes';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json());

  // Root documentation/status endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'SIAD-PrEP API',
      description: 'Sistema Informatizado de Apoio à Decisão - Profilaxia Pré-Exposição ao HIV',
      version: '0.1.0',
      status: 'online',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        patients: '/api/patients',
        appointments: '/api/appointments',
        medications: '/api/medications',
        professionals: '/api/professionals',
      },
    });
  });

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
