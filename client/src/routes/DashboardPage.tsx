import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';
import { listProfessionals } from '@/features/professionals/api';

const roleLabels: Record<string, string> = {
  PATIENT: 'Paciente',
  PROFESSIONAL: 'Profissional',
  ADMIN: 'Administrador',
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['professionals'],
    queryFn: listProfessionals,
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SIAD-PrEP</h1>
          <p className="text-sm text-muted-foreground">
            Logado como {user ? roleLabels[user.role] : '—'}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sair
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais (via GET /api/professionals)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {isError && (
            <p className="text-sm text-destructive">
              Erro ao buscar profissionais: {error instanceof Error ? error.message : 'desconhecido'}
            </p>
          )}
          {data && data.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado ainda.</p>
          )}
          {data && data.length > 0 && (
            <ul className="flex flex-col divide-y">
              {data.map((professional) => (
                <li key={professional.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{professional.user.name}</p>
                    <p className="text-sm text-muted-foreground">{professional.specialty}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">CRM {professional.crm}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
