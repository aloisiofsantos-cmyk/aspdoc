import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => r.data.data),
  });

  const { register, handleSubmit, reset } = useForm<any>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (formData: Record<string, string>) => settingsApi.update(formData),
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar'),
  });

  if (isLoading) return <InlineLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-500 text-sm mt-1">Configure as informações da organização e do sistema</p>
      </div>

      <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-gray-400" />
            Informações da Organização
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nome da Organização" {...register('org_name')} />
            </div>
            <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('org_cnpj')} />
            <Input label="URL do Logo" placeholder="https://..." {...register('org_logo_url')} />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Protocolo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prefixo do Protocolo"
              placeholder="PROC"
              hint="Ex: PROC → PROC-2024-000001"
              {...register('protocol_prefix')}
            />
            <Input
              label="Dias de alerta de vencimento"
              type="number"
              min="1"
              max="30"
              {...register('sla_alert_days')}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Funcionalidades</h2>
          <div className="space-y-3">
            {[
              { key: 'email_notifications', label: 'Notificações por email', hint: 'Enviar emails quando processos são criados ou encaminhados' },
              { key: 'allow_govbr_login', label: 'Login via Gov.br', hint: 'Permitir que usuários se autentiquem com Gov.br' },
              { key: 'signature_required', label: 'Assinatura obrigatória', hint: 'Exigir assinatura digital antes de concluir processos' },
            ].map(item => (
              <div key={item.key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={item.key}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register(item.key)}
                />
                <div>
                  <label htmlFor={item.key} className="text-sm font-medium text-gray-900 cursor-pointer">
                    {item.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saveMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
