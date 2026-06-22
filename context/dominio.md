# Domínio — SIAD-PrEP

Sistema Integrado de Agendamento e Distribuição de Profilaxia Pré-Exposição ao HIV.

## O que é PrEP

PrEP (Profilaxia Pré-Exposição) é o uso de medicamentos antirretrovirais por pessoas
HIV-negativas para reduzir o risco de infecção pelo HIV. No Brasil, é distribuída
gratuitamente pelo SUS via UDM (Unidades Dispensadoras de Medicamentos).

## Entidades centrais

| Entidade | Papel |
|---|---|
| `Patient` | Pessoa em acompanhamento PrEP; dados sensíveis LGPD |
| `Professional` | Profissional de saúde (médico, farmacêutico, enfermeiro) |
| `Appointment` | Consulta ou retorno agendado |
| `Medication` | Registro de dispensação de ARV |

## Papéis (roles)

- `PATIENT` — acesso ao próprio prontuário e agendamentos
- `PROFESSIONAL` — gestão de pacientes e agendamentos sob sua responsabilidade
- `ADMIN` — acesso completo ao sistema

## Regras de negócio críticas

- Paciente só pode ser acessado pelo profissional responsável ou ADMIN
- Dispensação de medicamento exige consulta anterior registrada
- Consentimento LGPD (`consentGiven`) deve ser `true` para qualquer operação sobre dados do paciente
- Soft delete obrigatório em todas as entidades com dado pessoal

## Contexto regulatório

- **LGPD** (Lei 13.709/2018) — dados de saúde são dados sensíveis; exigem consentimento explícito
- **Portaria MS 69/2018** — protocolo clínico PrEP no SUS
- **RDC ANVISA** — rastreabilidade de dispensação de medicamentos controlados
