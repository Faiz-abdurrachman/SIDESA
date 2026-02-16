import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse, Penduduk, KartuKeluarga, Surat } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [totalPenduduk, setTotalPenduduk] = useState(0);
  const [totalKK, setTotalKK] = useState(0);
  const [totalSurat, setTotalSurat] = useState(0);
  const [suratPending, setSuratPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendudukRes, kkRes, suratRes] = await Promise.all([
          api.get<ApiResponse<Penduduk[]>>('/penduduk'),
          api.get<ApiResponse<KartuKeluarga[]>>('/kk'),
          api.get<ApiResponse<Surat[]>>('/surat'),
        ]);
        if (pendudukRes.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
        if (kkRes.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
        if (suratRes.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
        setTotalPenduduk(pendudukRes.data.data.length);
        setTotalKK(kkRes.data.data.length);
        setTotalSurat(suratRes.data.data.length);
        setSuratPending(suratRes.data.data.filter((s) => s.status === 'PENDING').length);
      } catch {
        // Errors handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Memuat data...</p>;
  }

  const cards = [
    { label: 'Total Penduduk', value: totalPenduduk, color: 'bg-blue-500' },
    { label: 'Total Kartu Keluarga', value: totalKK, color: 'bg-green-500' },
    { label: 'Total Surat', value: totalSurat, color: 'bg-purple-500' },
    { label: 'Surat Pending', value: suratPending, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Selamat datang, {user?.name} ({user?.role})
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-5">
            <div className={`w-10 h-10 rounded-lg ${card.color} mb-3`} />
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
