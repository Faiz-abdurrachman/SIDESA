export interface ApiResponse<T> {
  status: "success";
  data: T;
}

export interface ApiError {
  status: "error";
  message: string;
}

export type Role = "ADMIN" | "RT" | "KEPALA_DESA";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginData {
  token: string;
  user: User;
}

export interface KartuKeluarga {
  id: string;
  noKk: string;
  alamat: string;
  rt: string;
  rw: string;
  createdAt: string;
  penduduk?: Penduduk[];
}

export interface Penduduk {
  id: string;
  nik: string;
  nama: string;
  tanggalLahir: string;
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
  pekerjaan: string;
  status: "AKTIF" | "PINDAH" | "MENINGGAL";
  kkId: string;
  createdAt: string;
  kartuKeluarga?: KartuKeluarga;
}

export interface Surat {
  id: string;
  nomorSurat: string;
  jenis: "DOMISILI" | "TIDAK_MAMPU";
  status: "PENDING" | "APPROVED" | "REJECTED";
  pendudukId: string;
  createdById: string;
  createdAt: string;
  penduduk?: Penduduk;
}
