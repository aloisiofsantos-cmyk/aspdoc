import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { processApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import { formatDateTime, MOVEMENT_LABELS } from '../utils';
import toast from 'react-hot-toast';

export function PublicQueryPage() {
  const navigate = useNavigate();
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;

    try {
      setLoading(true);
      setResult(null);
      const { data } = await processApi.publicStatus(number.trim().toUpperCase());
      setResult(data.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Protocolo não encontrado. Verifique o número informado.');
      } else {
        toast.error('Erro ao consultar protocolo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AgilDoc</h1>
          <p className="text-white/70 mt-2">Consulta Pública de Protocolo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Consultar Protocolo</h2>
          <p className="text-gray-500 text-sm mb-6">
            Informe o número do protocolo para acompanhar o andamento do seu processo.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              placeholder="Ex: PROC-2024-000001"
              value={number}
              onChange={e => setNumber(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
            />
            <Button type="submit" loading={loading} leftIcon={<Search className="h-4 w-4" />}>
              Consultar
            </Button>
          </form>

          {result && (
            <div className="mt-6 space-y-4 animate-slide-up">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">
                    {result.number}
                  </span>
                  <StatusBadge status={result.status} />
                </div>
                <h3 className="font-semibold text-gray-900">{result.title}</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div><span className="text-gray-400">Tipo:</span> {result.type?.name}</div>
                  <div><span className="text-gray-400">Setor:</span> {result.department?.name}</div>
                  <div><span className="text-gray-400">Aberto:</span> {formatDateTime(result.createdAt)}</div>
                  <div><span className="text-gray-400">Atualizado:</span> {formatDateTime(result.updatedAt)}</div>
                </div>
              </div>

              {result.movements?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Histórico de Tramitação</h4>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-3">
                      {result.movements.map((mov: any, i: number) => (
                        <div key={i} className="flex gap-3 relative">
                          <div className="w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center flex-shrink-0 relative z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          </div>
                          <div className="flex-1 pb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {MOVEMENT_LABELS[mov.type as keyof typeof MOVEMENT_LABELS] || mov.type}
                            </p>
                            {mov.fromDept && (
                              <p className="text-xs text-gray-500">De: {mov.fromDept?.name}</p>
                            )}
                            {mov.observation && (
                              <p className="text-xs text-gray-600 italic">"{mov.observation}"</p>
                            )}
                            <p className="text-xs text-gray-400">{formatDateTime(mov.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
