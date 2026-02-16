import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ApiResponse, ApiError, Penduduk, KartuKeluarga } from '../types';

const EMPTY_FORM: {
  nik: string;
  nama: string;
  tanggalLahir: string;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  pekerjaan: string;
  kkId: string;
} = {
  nik: '',
  nama: '',
  tanggalLahir: '',
  jenisKelamin: 'LAKI_LAKI',
  pekerjaan: '',
  kkId: '',
};

export function PendudukPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Penduduk[]>([]);
  const [kkList, setKkList] = useState<KartuKeluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canModify = user?.role === 'ADMIN' || user?.role === 'RT';
  const canDelete = user?.role === 'ADMIN';

  const fetchData = async () => {
    try {
      const [pendudukRes, kkRes] = await Promise.all([
        api.get<ApiResponse<Penduduk[]>>('/penduduk'),
        api.get<ApiResponse<KartuKeluarga[]>>('/kk'),
      ]);
      if (pendudukRes.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      if (kkRes.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      setList(pendudukRes.data.data);
      setKkList(kkRes.data.data);
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

  const openEdit = (p: Penduduk) => {
    setForm({
      nik: p.nik,
      nama: p.nama,
      tanggalLahir: p.tanggalLahir.split('T')[0],
      jenisKelamin: p.jenisKelamin,
      pekerjaan: p.pekerjaan,
      kkId: p.kkId,
    });
    setEditingId(p.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put<ApiResponse<Penduduk>>(`/penduduk/${editingId}`, form);
        if (res.data.status !== 'success') {
          throw new Error('Unexpected response format');
        }
      } else {
        const res = await api.post<ApiResponse<Penduduk>>('/penduduk', form);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data penduduk ini?')) return;
    try {
      const res = await api.delete<ApiResponse<Penduduk>>(`/penduduk/${id}`);
      if (res.data.status !== 'success') {
        throw new Error('Unexpected response format');
      }
      await fetchData();
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        alert((err.response.data as ApiError).message);
      }
    }
  };

  if (loading) return <p className="text-gray-500">Memuat data...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Penduduk</h1>
        {canModify && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Tambah Penduduk
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">NIK</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Kelamin</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Pekerjaan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">No KK</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Tidak ada data penduduk.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.nik}</td>
                <td className="px-4 py-3">{p.nama}</td>
                <td className="px-4 py-3">{p.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</td>
                <td className="px-4 py-3">{p.pekerjaan}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'AKTIF'
                        ? 'bg-green-100 text-green-700'
                        : p.status === 'PINDAH'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.kartuKeluarga?.noKk ?? '-'}</td>
                <td className="px-4 py-3 space-x-2">
                  {canModify && (
                    <button
                      onClick={() => openEdit(p)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Penduduk' : 'Tambah Penduduk'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                <input
                  type="text"
                  value={form.nik}
                  onChange={(e) => setForm({ ...form, nik: e.target.value })}
                  maxLength={16}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select
                  value={form.jenisKelamin}
                  onChange={(e) =>
                    setForm({ ...form, jenisKelamin: e.target.value as 'LAKI_LAKI' | 'PEREMPUAN' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan</label>
                <input
                  type="text"
                  value={form.pekerjaan}
                  onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kartu Keluarga</label>
                <select
                  value={form.kkId}
                  onChange={(e) => setForm({ ...form, kkId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">-- Pilih KK --</option>
                  {kkList.map((kk) => (
                    <option key={kk.id} value={kk.id}>
                      {kk.noKk} - {kk.alamat}
                    </option>
                  ))}
                </select>
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
