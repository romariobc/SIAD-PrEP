import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// In-Memory Database Store (for sandbox & development without external Postgres)
class InMemoryStore {
  users: Map<string, any> = new Map();
  patients: Map<string, any> = new Map();
  professionals: Map<string, any> = new Map();
  appointments: Map<string, any> = new Map();
  medications: Map<string, any> = new Map();
  dispenses: Map<string, any> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    const adminId = '11111111-1111-1111-1111-111111111111';
    const profUserId = '22222222-2222-2222-2222-222222222222';
    const patUserId = '33333333-3333-3333-3333-333333333333';

    // Password: Admin@123456
    const sampleHash = bcrypt.hashSync('Admin@123456', 10);

    this.users.set(adminId, {
      id: adminId,
      email: 'admin@siadprep.gov.br',
      passwordHash: sampleHash,
      name: 'Administrador SIAD-PrEP',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    this.users.set(profUserId, {
      id: profUserId,
      email: 'dr.marcelo@siadprep.gov.br',
      passwordHash: sampleHash,
      name: 'Dr. Marcelo Silva',
      role: 'PROFESSIONAL',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    const profId = '44444444-4444-4444-4444-444444444444';
    this.professionals.set(profId, {
      id: profId,
      userId: profUserId,
      crm: '123456/SP',
      specialty: 'Infectologia',
      phone: '(11) 98765-4321',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    this.users.set(patUserId, {
      id: patUserId,
      email: 'joao.paciente@email.com',
      passwordHash: sampleHash,
      name: 'João Victor Santos',
      role: 'PATIENT',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    const patId = '55555555-5555-5555-5555-555555555555';
    this.patients.set(patId, {
      id: patId,
      userId: patUserId,
      cpf: '123.456.789-00',
      dateOfBirth: new Date('1995-05-15T00:00:00Z'),
      phone: '(11) 91234-5678',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      consentGiven: true,
      consentDate: new Date('2026-01-02T10:00:00Z'),
      createdAt: new Date('2026-01-02T10:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
      deletedAt: null,
    });
  }

  user = {
    findUnique: async ({ where }: any) => {
      for (const u of this.users.values()) {
        if (where.id && u.id === where.id) return { ...u };
        if (where.email && u.email === where.email) return { ...u };
      }
      return null;
    },
    findFirst: async ({ where }: any) => {
      for (const u of this.users.values()) {
        if (where?.id && u.id === where.id) return { ...u };
        if (where?.email && u.email === where.email) return { ...u };
      }
      return null;
    },
    findMany: async () => Array.from(this.users.values()).map(u => ({ ...u })),
    create: async ({ data, select }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const user = {
        id,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || 'PATIENT',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      };
      this.users.set(id, user);
      if (select) {
        const result: any = {};
        for (const k of Object.keys(select)) {
          if (select[k]) result[k] = (user as any)[k];
        }
        return result;
      }
      return { ...user };
    },
  };

  patient = {
    findMany: async (args?: any) => {
      let list = Array.from(this.patients.values()).filter(p => !p.deletedAt);
      if (args?.where?.deletedAt === null) {
        list = list.filter(p => p.deletedAt === null);
      }
      return list.map(p => {
        const res = { ...p };
        if (args?.include?.user) {
          const u = this.users.get(p.userId);
          res.user = u ? { name: u.name, email: u.email } : { name: '', email: '' };
        }
        return res;
      });
    },
    findFirst: async ({ where }: any) => {
      for (const p of this.patients.values()) {
        if (where?.id && p.id === where.id) {
          if (where.deletedAt === null && p.deletedAt) continue;
          return { ...p };
        }
      }
      return null;
    },
    findUnique: async ({ where }: any) => {
      for (const p of this.patients.values()) {
        if (where.id && p.id === where.id) return { ...p };
        if (where.cpf && p.cpf === where.cpf) return { ...p };
        if (where.userId && p.userId === where.userId) return { ...p };
      }
      return null;
    },
    create: async ({ data }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const patient = {
        id,
        userId: data.userId,
        cpf: data.cpf,
        dateOfBirth: data.dateOfBirth instanceof Date ? data.dateOfBirth : new Date(data.dateOfBirth),
        phone: data.phone ?? null,
        address: data.address ?? null,
        consentGiven: Boolean(data.consentGiven),
        consentDate: data.consentDate ?? (data.consentGiven ? now : null),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      this.patients.set(id, patient);
      return { ...patient };
    },
    update: async ({ where, data }: any) => {
      const p = this.patients.get(where.id);
      if (!p) throw new Error('Patient not found');
      const updated = {
        ...p,
        ...data,
        updatedAt: new Date(),
      };
      this.patients.set(where.id, updated);
      return { ...updated };
    },
  };

  professional = {
    findMany: async (args?: any) => {
      return Array.from(this.professionals.values()).map(p => {
        const res = { ...p };
        if (args?.include?.user) {
          const u = this.users.get(p.userId);
          res.user = u ? { name: u.name, email: u.email } : { name: '', email: '' };
        }
        return res;
      });
    },
    findUnique: async ({ where }: any) => {
      for (const p of this.professionals.values()) {
        if (where.id && p.id === where.id) return { ...p };
        if (where.crm && p.crm === where.crm) return { ...p };
        if (where.userId && p.userId === where.userId) return { ...p };
      }
      return null;
    },
    create: async ({ data }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const prof = {
        id,
        userId: data.userId,
        crm: data.crm,
        specialty: data.specialty,
        phone: data.phone ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.professionals.set(id, prof);
      return { ...prof };
    },
    update: async ({ where, data }: any) => {
      const p = this.professionals.get(where.id);
      if (!p) throw new Error('Professional not found');
      const updated = {
        ...p,
        ...data,
        updatedAt: new Date(),
      };
      this.professionals.set(where.id, updated);
      return { ...updated };
    },
  };

  appointment = {
    findMany: async (args?: any) => {
      let list = Array.from(this.appointments.values());
      if (args?.where?.patient?.userId) {
        const pat = Array.from(this.patients.values()).find(p => p.userId === args.where.patient.userId);
        list = pat ? list.filter(a => a.patientId === pat.id) : [];
      } else if (args?.where?.professional?.userId) {
        const prof = Array.from(this.professionals.values()).find(p => p.userId === args.where.professional.userId);
        list = prof ? list.filter(a => a.professionalId === prof.id) : [];
      }

      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      return list.map(a => {
        const res = { ...a };
        if (args?.include?.patient) {
          const pat = this.patients.get(a.patientId);
          const u = pat ? this.users.get(pat.userId) : null;
          res.patient = { ...pat, user: u ? { name: u.name } : { name: '' } };
        }
        if (args?.include?.professional) {
          const prof = this.professionals.get(a.professionalId);
          const u = prof ? this.users.get(prof.userId) : null;
          res.professional = { ...prof, user: u ? { name: u.name } : { name: '' } };
        }
        return res;
      });
    },
    findUnique: async ({ where }: any) => {
      const a = this.appointments.get(where.id);
      return a ? { ...a } : null;
    },
    create: async ({ data }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const apt = {
        id,
        patientId: data.patientId,
        professionalId: data.professionalId,
        scheduledAt: data.scheduledAt instanceof Date ? data.scheduledAt : new Date(data.scheduledAt),
        type: data.type,
        notes: data.notes ?? null,
        status: data.status || 'SCHEDULED',
        createdAt: now,
        updatedAt: now,
      };
      this.appointments.set(id, apt);
      return { ...apt };
    },
    update: async ({ where, data }: any) => {
      const a = this.appointments.get(where.id);
      if (!a) throw new Error('Appointment not found');
      const updated = {
        ...a,
        ...data,
        updatedAt: new Date(),
      };
      this.appointments.set(where.id, updated);
      return { ...updated };
    },
  };

  medication = {
    findMany: async (args?: any) => {
      return Array.from(this.medications.values()).map(m => {
        const res = { ...m };
        if (args?.include?.patient) {
          const pat = this.patients.get(m.patientId);
          const u = pat ? this.users.get(pat.userId) : null;
          res.patient = { ...pat, user: u ? { name: u.name } : { name: '' } };
        }
        return res;
      });
    },
    findUnique: async ({ where }: any) => {
      const m = this.medications.get(where.id);
      return m ? { ...m } : null;
    },
    create: async ({ data }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const med = {
        id,
        patientId: data.patientId,
        regimen: data.regimen,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
        prescribedBy: data.prescribedBy,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      };
      this.medications.set(id, med);
      return { ...med };
    },
  };

  dispense = {
    create: async ({ data }: any) => {
      const id = data.id || crypto.randomUUID();
      const now = new Date();
      const disp = {
        id,
        medicationId: data.medicationId,
        quantity: data.quantity,
        dispensedAt: data.dispensedAt instanceof Date ? data.dispensedAt : new Date(data.dispensedAt || now),
      };
      this.dispenses.set(id, disp);
      return { ...disp };
    },
  };
}

const inMemoryStore = new InMemoryStore();

// Attempt real Prisma client if DATABASE_URL is configured and reachable, otherwise fallback to in-memory store
let realPrisma: PrismaClient | null = null;
let useFallback = false;

try {
  realPrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  });
} catch {
  useFallback = true;
}

// Wrapper that dispatches to real Prisma or In-Memory fallback on database errors
function createModelProxy(modelName: 'user' | 'patient' | 'professional' | 'appointment' | 'medication' | 'dispense') {
  return new Proxy(inMemoryStore[modelName], {
    get(target: any, prop: string) {
      return async (...args: any[]) => {
        if (!useFallback && realPrisma && (realPrisma as any)[modelName]?.[prop]) {
          try {
            return await (realPrisma as any)[modelName][prop](...args);
          } catch (err: any) {
            // If connection fails, switch to in-memory fallback
            console.warn(`[SIAD-PrEP] Database query failed on ${modelName}.${prop}. Falling back to in-memory store.`);
            useFallback = true;
          }
        }
        if (typeof target[prop] === 'function') {
          return target[prop](...args);
        }
        return undefined;
      };
    },
  });
}

export const prisma: any = {
  user: createModelProxy('user'),
  patient: createModelProxy('patient'),
  professional: createModelProxy('professional'),
  appointment: createModelProxy('appointment'),
  medication: createModelProxy('medication'),
  dispense: createModelProxy('dispense'),
  $connect: async () => {},
  $disconnect: async () => {},
};
