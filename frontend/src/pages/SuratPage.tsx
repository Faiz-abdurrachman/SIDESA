import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse, ApiError, Surat } from '../types';

export function SuratPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'RT';
  const canApprove = user?.role === 'ADMIN' || user?.role === 'KEPALA_DESA';

  const fetchData = async () => {
    try {
      const res = await api.get<ApiResponse<Surat[]>>('/surat');
      if (res.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      setList(res.data.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Setujui surat ini?')) return;
    setActionLoading(id);
    try {
      const res = await api.put<ApiResponse<Surat>>(`/surat/${id}/approve`);
      if (res.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      await fetchData();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        alert((err.response.data as ApiError).message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Tolak surat ini?')) return;
    setActionLoading(id);
    try {
      const res = await api.put<ApiResponse<Surat>>(`/surat/${id}/reject`);
      if (res.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      await fetchData();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        alert((err.response.data as ApiError).message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: Surat['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) return <p className="text-gray-500">Memuat data...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Surat</h1>
        {canCreate && (
          <Link
            to="/surat/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Buat Surat
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor Surat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Penduduk</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
              {canApprove && <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={canApprove ? 6 : 5} className="text-center py-8 text-gray-400">
                  Tidak ada data surat.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{s.nomorSurat}</td>
                <td className="px-4 py-3">
                  {s.jenis === 'DOMISILI' ? 'Domisili' : 'Tidak Mampu'}
                </td>
                <td className="px-4 py-3">{statusBadge(s.status)}</td>
                <td className="px-4 py-3">{s.penduduk?.nama ?? '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString('id-ID')}
                </td>
                {canApprove && (
                  <td className="px-4 py-3 space-x-2">
                    {s.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(s.id)}
                          disabled={actionLoading === s.id}
                          className="text-green-600 hover:underline text-xs disabled:text-gray-400"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleReject(s.id)}
                          disabled={actionLoading === s.id}
                          className="text-red-600 hover:underline text-xs disabled:text-gray-400"
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
