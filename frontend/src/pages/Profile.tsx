import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Save } from 'lucide-react';
import { userApi, authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../store/auth';
import { ROLE_LABELS, formatDateTime } from '../utils';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'info' | 'password'>('info');

  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, formState: { errors: pwErrors } } = useForm<any>();

  const updateMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Perfil atualizado!');
      refreshUser();
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      resetPassword();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao alterar senha'),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      {/* User summary */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-700">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                {user ? ROLE_LABELS[user.role] : ''}
              </span>
              {user?.lastLogin && (
                <span className="text-xs text-gray-400">
                  Último acesso: {formatDateTime(user.lastLogin)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'info', label: 'Informações', icon: User },
          { key: 'password', label: 'Senha', icon: Lock },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
          <form onSubmit={handleProfile(d => updateMutation.mutate(d))} className="space-y-4">
            <Input label="Nome Completo" {...regProfile('name', { required: true })} />
            <Input label="Email" value={user?.email} disabled hint="O email não pode ser alterado" />
            <Input label="CPF" value={user?.cpf} disabled />
            <Input label="Telefone" placeholder="(00) 00000-0000" {...regProfile('phone')} />
            <div className="flex justify-end">
              <Button type="submit" loading={updateMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Alterar Senha</h2>
          <form onSubmit={handlePassword(d => passwordMutation.mutate(d))} className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              error={pwErrors.currentPassword?.message as string}
              {...regPassword('currentPassword', { required: 'Senha atual é obrigatória' })}
            />
            <Input
              label="Nova Senha"
              type="password"
              hint="Mínimo 8 caracteres, com maiúscula, minúscula e número"
              error={pwErrors.newPassword?.message as string}
              {...regPassword('newPassword', {
                required: 'Nova senha é obrigatória',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Deve conter maiúscula, minúscula e número',
                },
              })}
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              error={pwErrors.confirmPassword?.message as string}
              {...regPassword('confirmPassword', {
                required: 'Confirmação é obrigatória',
                validate: (val: string, { newPassword }: any) =>
                  val === newPassword || 'As senhas não coincidem',
              })}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={passwordMutation.isPending} leftIcon={<Lock className="h-4 w-4" />}>
                Alterar Senha
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
