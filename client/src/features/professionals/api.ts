import { apiRequest } from '@/api/client';

export interface Professional {
  id: string;
  userId: string;
  crm: string;
  specialty: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
}

export function listProfessionals() {
  return apiRequest<Professional[]>('/api/professionals');
}
