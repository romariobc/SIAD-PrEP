import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const rounds = 10;

  // ── Users ────────────────────────────────────────────────────────────────
  const [adminUser, profUser, patUser1, patUser2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@siad-prep.gov.br' },
      update: {},
      create: {
        email: 'admin@siad-prep.gov.br',
        passwordHash: await bcrypt.hash('Admin@1234', rounds),
        name: 'Administrador SIAD',
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dra.silva@siad-prep.gov.br' },
      update: {},
      create: {
        email: 'dra.silva@siad-prep.gov.br',
        passwordHash: await bcrypt.hash('Prof@1234', rounds),
        name: 'Dra. Ana Silva',
        role: 'PROFESSIONAL',
      },
    }),
    prisma.user.upsert({
      where: { email: 'joao.paciente@email.com' },
      update: {},
      create: {
        email: 'joao.paciente@email.com',
        passwordHash: await bcrypt.hash('Paciente@1234', rounds),
        name: 'João Oliveira',
        role: 'PATIENT',
      },
    }),
    prisma.user.upsert({
      where: { email: 'maria.paciente@email.com' },
      update: {},
      create: {
        email: 'maria.paciente@email.com',
        passwordHash: await bcrypt.hash('Paciente@1234', rounds),
        name: 'Maria Santos',
        role: 'PATIENT',
      },
    }),
  ]);

  console.log(`  ✓ ${[adminUser, profUser, patUser1, patUser2].length} users`);

  // ── Professional ──────────────────────────────────────────────────────────
  const professional = await prisma.professional.upsert({
    where: { crm: 'CRM-SP-123456' },
    update: {},
    create: {
      userId: profUser.id,
      crm: 'CRM-SP-123456',
      specialty: 'Infectologia',
      phone: '11988887777',
    },
  });

  console.log(`  ✓ 1 professional`);

  // ── Patients ──────────────────────────────────────────────────────────────
  const [patient1, patient2] = await Promise.all([
    prisma.patient.upsert({
      where: { cpf: '11122233344' },
      update: {},
      create: {
        userId: patUser1.id,
        cpf: '11122233344',
        dateOfBirth: new Date('1992-03-10'),
        phone: '11977776666',
        address: 'Rua das Acácias, 45 – São Paulo, SP',
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
    prisma.patient.upsert({
      where: { cpf: '55566677788' },
      update: {},
      create: {
        userId: patUser2.id,
        cpf: '55566677788',
        dateOfBirth: new Date('1988-07-22'),
        phone: '21966665555',
        address: 'Av. Atlântica, 200 – Rio de Janeiro, RJ',
        consentGiven: true,
        consentDate: new Date(),
      },
    }),
  ]);

  console.log(`  ✓ 2 patients`);

  // ── Appointments ──────────────────────────────────────────────────────────
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patient1.id,
        professionalId: professional.id,
        scheduledAt: inDays(3),
        type: 'INITIAL',
        status: 'SCHEDULED',
        notes: 'Primeira consulta PrEP — avaliação inicial',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patient2.id,
        professionalId: professional.id,
        scheduledAt: inDays(7),
        type: 'FOLLOWUP',
        status: 'SCHEDULED',
        notes: 'Retorno trimestral',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patient1.id,
        professionalId: professional.id,
        scheduledAt: inDays(-30),
        type: 'LAB_RESULT',
        status: 'COMPLETED',
        notes: 'Resultado de exame anti-HIV e função renal — dentro do esperado',
      },
    }),
  ]);

  console.log(`  ✓ 3 appointments`);

  // ── Medications ───────────────────────────────────────────────────────────
  const medication = await prisma.medication.create({
    data: {
      patientId: patient1.id,
      regimen: 'TENOFOVIR_EMTRICITABINA',
      startDate: inDays(-60),
      prescribedBy: professional.id,
      isActive: true,
    },
  });

  await prisma.dispense.createMany({
    data: [
      { medicationId: medication.id, quantity: 30, dispensedAt: inDays(-60) },
      { medicationId: medication.id, quantity: 30, dispensedAt: inDays(-30) },
    ],
  });

  console.log(`  ✓ 1 medication + 2 dispenses`);

  console.log('\nSeed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
