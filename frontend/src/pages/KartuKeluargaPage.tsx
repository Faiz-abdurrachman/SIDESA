import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse, ApiError, KartuKeluarga } from '../types';

const EMPTY_FORM = { noKk: '', alamat: '', rt: '', rw: '' };

export function KartuKeluargaPage() {
  const { user } = useAuth();
  const [list, setList] = useState<KartuKeluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canModify = user?.role === 'ADMIN';

  const fetchData = async () => {
    try {
      const res = await api.get<ApiResponse<KartuKeluarga[]>>('/kk');
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

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (kk: KartuKeluarga) => {
    setForm({ noKk: kk.noKk, alamat: kk.alamat, rt: kk.rt, rw: kk.rw });
    setEditingId(kk.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put<ApiResponse<KartuKeluarga>>(`/kk/${editingId}`, form);
        if (res.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
      } else {
        const res = await api.post<ApiResponse<KartuKeluarga>>('/kk', form);
        if (res.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
      }
      setShowModal(false);
      await fetchData();
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Kartu Keluarga</h1>
        {canModify && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Tambah KK
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">No KK</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Alamat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">RT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">RW</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Anggota</th>
              {canModify && <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={canModify ? 6 : 5} className="text-center py-8 text-gray-400">
                  Tidak ada data kartu keluarga.
                </td>
              </tr>
            )}
            {list.map((kk) => (
              <tr key={kk.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{kk.noKk}</td>
                <td className="px-4 py-3">{kk.alamat}</td>
                <td className="px-4 py-3">{kk.rt}</td>
                <td className="px-4 py-3">{kk.rw}</td>
                <td className="px-4 py-3">{kk.penduduk?.length ?? 0}</td>
                {canModify && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(kk)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Kartu Keluarga' : 'Tambah Kartu Keluarga'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No KK</label>
                <input
                  type="text"
                  value={form.noKk}
                  onChange={(e) => setForm({ ...form, noKk: e.target.value })}
                  maxLength={16}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <input
                  type="text"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                  <input
                    type="text"
                    value={form.rt}
                    onChange={(e) => setForm({ ...form, rt: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RW</label>
                  <input
                    type="text"
                    value={form.rw}
                    onChange={(e) => setForm({ ...form, rw: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
