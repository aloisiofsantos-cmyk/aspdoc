import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, FileText, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../store/auth';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [govBrLoading, setGovBrLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Credenciais inválidas');
    }
  };

  const handleGovBr = async () => {
    try {
      setGovBrLoading(true);
      const { data } = await authApi.govBrInit();
      window.location.href = data.data.authUrl;
    } catch {
      toast.error('Erro ao conectar com Gov.br');
      setGovBrLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AgilDoc</h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestão Documental</p>
          </div>

          {/* Gov.br button */}
          <button
            onClick={handleGovBr}
            disabled={govBrLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-[#1351b4] text-[#1351b4] font-semibold hover:bg-[#1351b4] hover:text-white transition-all mb-6 disabled:opacity-60"
          >
            <div className="w-7 h-7 bg-[#1351b4] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">gov</span>
            </div>
            {govBrLoading ? 'Redirecionando...' : 'Entrar com Gov.br'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">ou acesse com email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.gov.br"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1">
                <a href="#" className="text-xs text-primary-600 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>

          {/* Public access */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/consulta-publica"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Consultar protocolo sem login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} AgilDoc — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
