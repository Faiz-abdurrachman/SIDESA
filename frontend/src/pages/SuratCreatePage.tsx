import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../services/api';
import type { ApiResponse, ApiError, Penduduk, Surat } from '../types';

export function SuratCreatePage() {
  const navigate = useNavigate();
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [jenis, setJenis] = useState<'DOMISILI' | 'TIDAK_MAMPU'>('DOMISILI');
  const [pendudukId, setPendudukId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPenduduk = async () => {
      try {
        const res = await api.get<ApiResponse<Penduduk[]>>('/penduduk');
        if (res.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
        setPendudukList(res.data.data);
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchPenduduk();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<Surat>>('/surat', { jenis, pendudukId });
      if (res.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      navigate('/surat');
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError((err.response.data as ApiError).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Memuat data...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat Surat Baru</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as 'DOMISILI' | 'TIDAK_MAMPU')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="DOMISILI">Surat Domisili</option>
              <option value="TIDAK_MAMPU">Surat Tidak Mampu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penduduk</label>
            <select
              value={pendudukId}
              onChange={(e) => setPendudukId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Pilih Penduduk --</option>
              {pendudukList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nik} - {p.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/surat')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {submitting ? 'Membuat...' : 'Buat Surat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
