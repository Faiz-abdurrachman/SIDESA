# SIDESA — AUDIT LENGKAP PROJECT

> Dokumen ini berisi seluruh hasil audit dan dokumentasi rinci dari apa yang telah dibangun dalam project SIDESA (Sistem Informasi Desa).
>
> Terakhir diperbarui: 16 Februari 2026

---

## DAFTAR ISI

1. [Ringkasan Project](#1-ringkasan-project)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder Lengkap](#3-struktur-folder-lengkap)
4. [Database Schema (Prisma)](#4-database-schema-prisma)
5. [Backend — File per File](#5-backend--file-per-file)
6. [Frontend — File per File](#6-frontend--file-per-file)
7. [API Endpoints](#7-api-endpoints)
8. [Role Matrix & Hak Akses](#8-role-matrix--hak-akses)
9. [Security Layers](#9-security-layers)
10. [Build Status](#10-build-status)
11. [Cara Menjalankan](#11-cara-menjalankan)

---

## 1. RINGKASAN PROJECT

SIDESA adalah Sistem Informasi Desa berbasis web untuk mengelola data kependudukan dan persuratan tingkat desa. Project ini dibangun sebagai tugas akhir (skripsi/TA) dengan arsitektur fullstack:

- **Backend**: REST API dengan Express 5 + Prisma ORM + PostgreSQL
- **Frontend**: Single Page Application dengan React 19 + Vite + Tailwind CSS
- **Arsitektur Backend**: Clean Architecture → Routes → Controllers → Services → Prisma
- **Autentikasi**: JWT (JSON Web Token) dengan bcrypt password hashing
- **Otorisasi**: Dual-layer (middleware-level + service-level) role-based access control

### Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| Auth | Login, Register (public → role RT), Create User by Admin |
| Kartu Keluarga | CRUD data KK (No KK 16 digit, alamat, RT, RW) |
| Penduduk | CRUD data penduduk (NIK 16 digit, terhubung ke KK) |
| Surat | Buat surat (Domisili/Tidak Mampu), Approve/Reject oleh Kepala Desa/Admin |
| Audit Log | Pencatatan otomatis setiap operasi CUD dalam transaction |
| Dashboard | Statistik ringkasan: total penduduk, KK, surat, surat pending |

---

## 2. TECH STACK

### Backend

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | - |
| Framework | Express | 5.2.1 |
| ORM | Prisma | 6.19.2 |
| Database | PostgreSQL | - |
| Auth | jsonwebtoken | 9.0.3 |
| Hashing | bcrypt | 6.0.0 |
| Env | dotenv | 17.3.1 |
| CORS | cors | 2.8.6 |
| Language | TypeScript (strict) | 5.9.3 |
| Dev Runner | ts-node-dev | 2.0.0 |
| Package Manager | pnpm | 10.29.3 |

### Frontend

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| UI Library | React | 19.2.0 |
| Bundler | Vite | 7.3.1 |
| Router | React Router DOM | 7.13.0 |
| HTTP Client | Axios | 1.13.5 |
| Styling | Tailwind CSS | 3.4.19 |
| Language | TypeScript (strict, verbatimModuleSyntax) | 5.9.3 |
| PostCSS | postcss + autoprefixer | 8.5.6 / 10.4.24 |

### Prinsip Yang Diterapkan

- **Tidak ada library tambahan** di luar yang sudah terdaftar
- **Satu Axios instance** untuk seluruh aplikasi
- **Context API** untuk state management (bukan Redux/Zustand)
- **Page-level state** saja (tidak ada global store selain auth)
- **`import type`** wajib untuk type-only imports (verbatimModuleSyntax)

---

## 3. STRUKTUR FOLDER LENGKAP

### Backend (25 source files + 4 config files = 29 total)

```
backend/
├── .env                              # Environment variables (tidak di-commit)
├── .env.example                      # Template environment variables
├── .gitignore                        # Ignore node_modules, dist, .env
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config (strict, ES2020, commonjs)
├── prisma/
│   ├── schema.prisma                 # 5 model, 5 enum
│   └── migrations/
│       └── 20260215123200_init/
│           └── migration.sql         # SQL migrasi awal
└── src/
    ├── server.ts                     # Entry point: listen port + graceful shutdown
    ├── app.ts                        # Express setup: cors, json, routes, errorHandler
    ├── config/
    │   └── index.ts                  # PORT, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV
    ├── prisma/
    │   ├── client.ts                 # PrismaClient singleton
    │   └── seed.ts                   # Seed admin user (admin@sidesa.id / admin123)
    ├── types/
    │   └── express.d.ts              # Augment Express Request dengan req.user
    ├── utils/
    │   └── AppError.ts               # Custom error class dengan statusCode
    ├── middlewares/
    │   ├── auth.ts                   # authenticate(): verifikasi JWT Bearer token
    │   ├── role.ts                   # authorize(...roles): cek role user
    │   ├── errorHandler.ts           # Global error handler (AppError / 500)
    │   └── validate.ts               # 8 validator: register, createUser, login,
    │                                 #   penduduk, pendudukUpdate, kk, kkUpdate, surat
    ├── routes/
    │   ├── index.ts                  # Aggregator: /auth, /penduduk, /kk, /surat
    │   ├── auth.routes.ts            # POST /register, /login, /users
    │   ├── penduduk.routes.ts        # GET /, GET /:id, POST /, PUT /:id, DELETE /:id
    │   ├── kk.routes.ts              # GET /, POST /, PUT /:id
    │   └── surat.routes.ts           # GET /, POST /, PUT /:id/approve, PUT /:id/reject
    ├── controllers/
    │   ├── auth.controller.ts        # register, login, createUserByAdmin
    │   ├── penduduk.controller.ts    # findAll, findById, create, update, remove
    │   ├── kk.controller.ts          # findAll, create, update
    │   └── surat.controller.ts       # findAll, create, approve, reject
    └── services/
        ├── auth.service.ts           # register (hardcode RT), login (JWT), createUserByAdmin
        ├── penduduk.service.ts       # CRUD + NIK validation + $transaction + auditLog
        ├── kk.service.ts             # CRUD + noKk validation + $transaction + auditLog
        ├── surat.service.ts          # create (nomorSurat gen), approve, reject + auditLog
        └── auditLog.service.ts       # createAuditLog, findAll
```

### Frontend (18 source files + 4 config files = 22 total)

```
frontend/
├── .env.example                      # VITE_API_URL=http://localhost:5000/api
├── .gitignore                        # Ignore node_modules, dist
├── index.html                        # Entry HTML (lang="id", title SIDESA)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript project references
├── tsconfig.app.json                 # App TS config (strict, verbatimModuleSyntax)
├── tsconfig.node.json                # Node TS config (for vite.config.ts)
├── vite.config.ts                    # Vite + React plugin
├── tailwind.config.js                # Content: index.html + src/**/*.{js,ts,jsx,tsx}
├── postcss.config.js                 # tailwindcss + autoprefixer
└── src/
    ├── main.tsx                      # ReactDOM.createRoot + StrictMode + <App />
    ├── index.css                     # @tailwind base/components/utilities
    ├── types/
    │   └── index.ts                  # ApiResponse, ApiError, User, LoginData,
    │                                 #   KartuKeluarga, Penduduk, Surat, Role
    ├── services/
    │   └── api.ts                    # Single Axios instance + interceptors
    ├── context/
    │   └── AuthContext.tsx            # AuthProvider: user, token, login(), logout()
    ├── hooks/
    │   └── useAuth.ts                # useContext(AuthContext) wrapper
    ├── components/
    │   ├── ProtectedRoute.tsx        # Redirect ke /login jika belum auth
    │   └── Layout.tsx                # Sidebar + Outlet, nav links, logout
    ├── app/
    │   ├── App.tsx                   # AuthProvider + AppRouter
    │   └── router.tsx                # BrowserRouter + semua Route definitions
    └── pages/
        ├── LoginPage.tsx             # Form login → POST /auth/login
        ├── RegisterPage.tsx          # Form register → POST /auth/register
        ├── DashboardPage.tsx         # 4 stat cards (penduduk, KK, surat, pending)
        ├── PendudukPage.tsx          # Tabel + modal create/edit + delete
        ├── KartuKeluargaPage.tsx     # Tabel + modal create/edit
        ├── SuratPage.tsx             # Tabel + approve/reject buttons
        └── SuratCreatePage.tsx       # Form: jenis surat + pilih penduduk
```

---

## 4. DATABASE SCHEMA (PRISMA)

### Enum Definitions

```
Role:            ADMIN | RT | KEPALA_DESA
JenisKelamin:    LAKI_LAKI | PEREMPUAN
StatusPenduduk:  AKTIF | PINDAH | MENINGGAL
JenisSurat:      DOMISILI | TIDAK_MAMPU
StatusSurat:     PENDING | APPROVED | REJECTED
```

### Model: User (tabel `users`)

| Field | Type | Constraint |
|-------|------|-----------|
| id | String (UUID) | @id @default(uuid()) |
| name | String | required |
| email | String | @unique |
| password | String | bcrypt hashed |
| role | Role enum | required |
| createdAt | DateTime | @default(now()) |
| **Relasi** | suratCreated → Surat[], auditLogs → AuditLog[] |

### Model: KartuKeluarga (tabel `kartu_keluarga`)

| Field | Type | Constraint |
|-------|------|-----------|
| id | String (UUID) | @id @default(uuid()) |
| noKk | String | @unique, harus 16 digit |
| alamat | String | required |
| rt | String | required |
| rw | String | required |
| createdAt | DateTime | @default(now()) |
| **Relasi** | penduduk → Penduduk[] |

### Model: Penduduk (tabel `penduduk`)

| Field | Type | Constraint |
|-------|------|-----------|
| id | String (UUID) | @id @default(uuid()) |
| nik | String | @unique, harus 16 digit |
| nama | String | required |
| tanggalLahir | DateTime | required |
| jenisKelamin | JenisKelamin | required |
| pekerjaan | String | required |
| status | StatusPenduduk | @default(AKTIF) |
| kkId | String | FK → KartuKeluarga.id |
| createdAt | DateTime | @default(now()) |
| **Relasi** | kartuKeluarga → KartuKeluarga, surat → Surat[] |

### Model: Surat (tabel `surat`)

| Field | Type | Constraint |
|-------|------|-----------|
| id | String (UUID) | @id @default(uuid()) |
| nomorSurat | String | @unique, format: 001/SIDESA/MM/YYYY |
| jenis | JenisSurat | required |
| status | StatusSurat | @default(PENDING) |
| pendudukId | String | FK → Penduduk.id |
| createdById | String | FK → User.id |
| createdAt | DateTime | @default(now()) |
| **Relasi** | penduduk → Penduduk, createdBy → User |

### Model: AuditLog (tabel `audit_log`)

| Field | Type | Constraint |
|-------|------|-----------|
| id | String (UUID) | @id @default(uuid()) |
| userId | String | FK → User.id |
| action | String | CREATE / UPDATE / DELETE / APPROVE / REJECT |
| tableName | String | nama tabel yang dioperasikan |
| recordId | String | ID record yang dioperasikan |
| createdAt | DateTime | @default(now()) |
| **Relasi** | user → User |

### Diagram Relasi

```
User ──┬── 1:N ──→ Surat (createdBy)
       └── 1:N ──→ AuditLog

KartuKeluarga ── 1:N ──→ Penduduk

Penduduk ── 1:N ──→ Surat
```

---

## 5. BACKEND — FILE PER FILE

### 5.1 `src/config/index.ts` — Konfigurasi Aplikasi

**Fungsi**: Membaca environment variables dan menyediakan config object.

```ts
config = {
  port: number          // dari PORT env, default 5000
  jwtSecret: string     // dari JWT_SECRET env
  jwtExpiresIn: 3600    // 1 jam dalam detik (numeric, bukan string)
  nodeEnv: string       // dari NODE_ENV env, default 'development'
}
```

### 5.2 `src/app.ts` — Express Application Setup

**Fungsi**: Inisialisasi Express app dengan middleware.

**Urutan middleware**:
1. `cors()` — Cross-Origin Resource Sharing
2. `express.json()` — Parse JSON request body
3. `routes` — Mount di `/api`
4. `errorHandler` — Global error handler (harus terakhir)

### 5.3 `src/server.ts` — Server Entry Point

**Fungsi**: Start server dan graceful shutdown.

- Listen di `config.port`
- Handle SIGTERM: disconnect Prisma, close server

### 5.4 `src/prisma/client.ts` — Prisma Singleton

**Fungsi**: Export satu instance PrismaClient untuk seluruh aplikasi.

```ts
const prisma = new PrismaClient();
export default prisma;
```

### 5.5 `src/prisma/seed.ts` — Database Seeder

**Fungsi**: Membuat user admin pertama.

- Import: `dotenv/config`, `bcrypt`, Prisma client singleton
- Upsert user: `admin@sidesa.id` / `admin123` / role `ADMIN`
- Guard: throw error jika `DATABASE_URL` tidak ada

**Cara jalankan**: `pnpm seed` atau `npx prisma db seed`

### 5.6 `src/types/express.d.ts` — Express Type Augmentation

**Fungsi**: Menambahkan `req.user` ke Express Request.

```ts
req.user?: { id: string; role: Role }
```

### 5.7 `src/utils/AppError.ts` — Custom Error Class

**Fungsi**: Error yang membawa HTTP status code.

```ts
class AppError extends Error {
  statusCode: number    // 400, 401, 403, 404, 409, dll
  message: string       // Pesan error yang dikirim ke client
}
```

### 5.8 `src/middlewares/auth.ts` — JWT Authentication

**Fungsi**: Verifikasi token JWT dari header `Authorization: Bearer <token>`.

**Alur**:
1. Cek header Authorization ada dan dimulai `Bearer `
2. Verify token dengan `jwt.verify(token, jwtSecret)`
3. Set `req.user = { id, role }` dari JWT payload
4. Throw 401 jika tidak ada token atau token invalid/expired

### 5.9 `src/middlewares/role.ts` — Role Authorization

**Fungsi**: Cek apakah `req.user.role` termasuk dalam daftar role yang diizinkan.

```ts
authorize(Role.ADMIN, Role.RT)  // hanya ADMIN dan RT yang boleh
```

- Throw 401 jika `req.user` tidak ada
- Throw 403 jika role tidak termasuk dalam daftar

### 5.10 `src/middlewares/errorHandler.ts` — Global Error Handler

**Fungsi**: Tangkap semua error dan kirim response yang konsisten.

- `AppError` → kirim `{ status: 'error', message }` dengan `err.statusCode`
- Error lain → 500, pesan disembunyikan di production

### 5.11 `src/middlewares/validate.ts` — Request Validators (8 fungsi)

| Validator | Required Fields | Validasi Khusus |
|-----------|----------------|-----------------|
| `validateRegister` | name, email, password | REJECT jika field `role` ada; email regex |
| `validateCreateUser` | name, email, password, role | email regex; role harus valid enum |
| `validateLogin` | email, password | email regex |
| `validatePenduduk` | nik, nama, tanggalLahir, jenisKelamin, pekerjaan, kkId | NIK 16 digit; jenisKelamin valid |
| `validatePendudukUpdate` | (semua optional) | NIK 16 digit jika ada; jenisKelamin valid; status valid |
| `validateKK` | noKk, alamat, rt, rw | noKk 16 digit |
| `validateKKUpdate` | (semua optional) | noKk 16 digit jika ada |
| `validateSurat` | jenis, pendudukId | jenis harus DOMISILI atau TIDAK_MAMPU |

### 5.12 `src/routes/index.ts` — Route Aggregator

```
/api/auth      → auth.routes.ts
/api/penduduk  → penduduk.routes.ts
/api/kk        → kk.routes.ts
/api/surat     → surat.routes.ts
```

### 5.13 `src/routes/auth.routes.ts` — Auth Routes

| Method | Path | Middleware | Controller |
|--------|------|-----------|-----------|
| POST | `/auth/register` | validateRegister | register |
| POST | `/auth/login` | validateLogin | login |
| POST | `/auth/users` | authenticate → authorize(ADMIN) → validateCreateUser | createUserByAdmin |

### 5.14 `src/routes/penduduk.routes.ts` — Penduduk Routes

Semua route memerlukan `authenticate`.

| Method | Path | Middleware Tambahan | Controller |
|--------|------|-------------------|-----------|
| GET | `/penduduk` | - | findAll |
| GET | `/penduduk/:id` | - | findById |
| POST | `/penduduk` | authorize(ADMIN, RT) → validatePenduduk | create |
| PUT | `/penduduk/:id` | authorize(ADMIN, RT) → validatePendudukUpdate | update |
| DELETE | `/penduduk/:id` | authorize(ADMIN) | remove |

### 5.15 `src/routes/kk.routes.ts` — Kartu Keluarga Routes

Semua route memerlukan `authenticate`.

| Method | Path | Middleware Tambahan | Controller |
|--------|------|-------------------|-----------|
| GET | `/kk` | - | findAll |
| POST | `/kk` | authorize(ADMIN, RT) → validateKK | create |
| PUT | `/kk/:id` | authorize(ADMIN, RT) → validateKKUpdate | update |

**Catatan**: Di middleware route, KK create/update diizinkan untuk ADMIN dan RT. Namun di service-level, hanya ADMIN yang boleh (defense in depth). RT akan dapat error 403 dari service.

### 5.16 `src/routes/surat.routes.ts` — Surat Routes

Semua route memerlukan `authenticate`.

| Method | Path | Middleware Tambahan | Controller |
|--------|------|-------------------|-----------|
| GET | `/surat` | - | findAll |
| POST | `/surat` | authorize(ADMIN, RT) → validateSurat | create |
| PUT | `/surat/:id/approve` | authorize(ADMIN, KEPALA_DESA) | approve |
| PUT | `/surat/:id/reject` | authorize(ADMIN, KEPALA_DESA) | reject |

### 5.17 Controllers (4 files)

Semua controller berperan sebagai **thin layer** yang hanya:
1. Mengambil data dari `req.body`, `req.params`, `req.user`
2. Memanggil fungsi service yang sesuai
3. Mengirim response JSON dengan format `{ status: 'success', data }` atau `{ status: 'success', message }`

**Pattern tipikal**:
```ts
export async function create(req: Request, res: Response) {
  const data = await someService.create(req.body, req.user!.id);
  res.status(201).json({ status: 'success', data });
}
```

**Catatan Express 5**: `req.params.id` bertipe `string | string[]`, sehingga semua controller menggunakan `req.params.id as string`.

### 5.18 `src/services/auth.service.ts` — Auth Business Logic

**3 fungsi utama**:

#### `register(data)`
1. Validasi email dengan regex
2. Cek email sudah terdaftar → 409
3. Hash password dengan bcrypt (salt rounds: 10)
4. Buat user dengan **role hardcoded `RT`** (keamanan: client tidak bisa pilih role)
5. Return user tanpa field password (select explicit)

#### `createUserByAdmin(data, callerRole)`
1. Cek callerRole harus ADMIN → 403
2. Validasi email
3. Cek duplikat email → 409
4. Hash password
5. Buat user dengan role yang diminta (ADMIN/RT/KEPALA_DESA)

#### `login(data)`
1. Validasi email
2. Cari user by email → 401 jika tidak ada
3. Compare password dengan bcrypt → 401 jika salah
4. Generate JWT token: payload `{ id, role }`, expires 3600 detik
5. Return `{ token, user: { id, name, email, role } }`

### 5.19 `src/services/penduduk.service.ts` — Penduduk Business Logic

**5 fungsi**:

#### `findAll()`
- Return semua penduduk + relasi kartuKeluarga, ordered by createdAt desc

#### `findById(id)`
- Return penduduk + kartuKeluarga + surat, throw 404 jika tidak ada

#### `create(data, userId)`
1. Validasi NIK (16 digit) di service
2. Cek duplikat NIK → 409
3. Cek KK exists → 404
4. **$transaction**: create penduduk + create auditLog

#### `update(id, data, userId)`
1. Validasi NIK jika ada di data
2. Cek penduduk exists → 404
3. Cek duplikat NIK (jika berubah) → 409
4. Cek KK exists (jika berubah) → 404
5. **$transaction**: update penduduk + create auditLog

#### `remove(id, userId, userRole)`
1. **Service-level check**: userRole harus ADMIN → 403
2. Cek penduduk exists → 404
3. **$transaction**: delete penduduk + create auditLog

### 5.20 `src/services/kk.service.ts` — KK Business Logic

**3 fungsi**:

#### `findAll()`
- Return semua KK + relasi penduduk, ordered by createdAt desc

#### `create(data, userId, userRole)`
1. **Service-level check**: userRole harus ADMIN → 403
2. Validasi noKk (16 digit)
3. Cek duplikat noKk → 409
4. **$transaction**: create KK + create auditLog

#### `update(id, data, userId, userRole)`
1. **Service-level check**: userRole harus ADMIN → 403
2. Validasi noKk jika ada
3. Cek KK exists → 404
4. Cek duplikat noKk (jika berubah) → 409
5. **$transaction**: update KK + create auditLog

### 5.21 `src/services/surat.service.ts` — Surat Business Logic

**4 fungsi**:

#### `findAll()`
- Return semua surat + penduduk + createdBy (select: id, name, email, role)

#### `create(data, userId)` — Dengan NomorSurat Generator
1. Cek penduduk exists → 404
2. **$transaction**:
   - Hitung bulan/tahun sekarang → suffix `/SIDESA/MM/YYYY`
   - Cari surat terakhir dengan suffix yang sama (findFirst, orderBy nomorSurat desc)
   - Parse nomor urut dari surat terakhir (split `/`[0])
   - Guard: `isNaN(parsed) ? 1 : parsed + 1`
   - Format: `001/SIDESA/02/2026` (zero-padded 3 digit)
   - Create surat + create auditLog

**Keamanan**: NomorSurat dihasilkan **di dalam transaction** untuk mencegah race condition / duplikasi nomor pada concurrent requests.

#### `approve(id, userId, userRole)`
1. **Role check**: RT diblokir secara eksplisit → 403
2. **Role check**: Harus ADMIN atau KEPALA_DESA → 403
3. Cek surat exists → 404
4. Cek status harus PENDING → 400
5. **$transaction**: update status APPROVED + create auditLog

#### `reject(id, userId, userRole)`
1. **Role check**: Harus ADMIN atau KEPALA_DESA → 403
2. Cek surat exists → 404
3. Cek status harus PENDING → 400
4. **$transaction**: update status REJECTED + create auditLog

### 5.22 `src/services/auditLog.service.ts` — Audit Trail

**2 fungsi** (helper, sebagian besar audit log dibuat langsung di service lain via transaction):

#### `createAuditLog(data)`
- Standalone create (tidak dalam transaction)

#### `findAll()`
- Return semua audit log + user info, ordered by createdAt desc

---

## 6. FRONTEND — FILE PER FILE

### 6.1 `src/types/index.ts` — Type Definitions

Semua TypeScript interface yang digunakan frontend:

```ts
ApiResponse<T>    { status: "success", data: T }
ApiError          { status: "error", message: string }
Role              "ADMIN" | "RT" | "KEPALA_DESA"
User              { id, name, email, role }
LoginData         { token, user }
KartuKeluarga     { id, noKk, alamat, rt, rw, createdAt, penduduk? }
Penduduk          { id, nik, nama, tanggalLahir, jenisKelamin, pekerjaan,
                    status, kkId, createdAt, kartuKeluarga? }
Surat             { id, nomorSurat, jenis, status, pendudukId, createdById,
                    createdAt, penduduk? }
```

### 6.2 `src/services/api.ts` — Axios Instance

**Satu instance Axios** untuk seluruh app:

- `baseURL`: dari `VITE_API_URL` env atau fallback `http://localhost:5000/api`
- **Request interceptor**: Pasang `Authorization: Bearer <token>` dari localStorage
- **Response interceptor**: Jika status 401 → hapus localStorage → redirect ke `/login`

### 6.3 `src/context/AuthContext.tsx` — Auth State

**AuthProvider** menyediakan:

| Property | Type | Deskripsi |
|----------|------|-----------|
| `user` | `User \| null` | Data user yang login |
| `token` | `string \| null` | JWT token |
| `isAuthenticated` | `boolean` | `!!token` |
| `login(token, user)` | function | Simpan ke localStorage + state |
| `logout()` | function | Hapus dari localStorage + state |

**Inisialisasi**: Baca dari localStorage saat mount (useEffect), dengan try/catch untuk JSON.parse yang gagal.

### 6.4 `src/hooks/useAuth.ts` — Auth Hook

```ts
export function useAuth() {
  return useContext(AuthContext);
}
```

### 6.5 `src/components/ProtectedRoute.tsx` — Auth Guard

- Jika `isAuthenticated` = false → `<Navigate to="/login" />`
- Jika sudah auth → render `{children}`

### 6.6 `src/components/Layout.tsx` — Layout Utama

**Struktur**:
- **Sidebar** (w-64, bg-gray-800):
  - Logo/title "SIDESA"
  - Nav links: Dashboard, Penduduk, Kartu Keluarga, Surat
  - "Buat Surat" link: **hanya tampil untuk ADMIN dan RT**
  - Active state: bg-gray-700 untuk route aktif (cek via `useLocation`)
  - User info (name + role) + tombol Logout di bagian bawah
- **Main content** (flex-1, overflow-auto):
  - `<Outlet />` untuk render nested routes

### 6.7 `src/app/App.tsx` — Root Component

```tsx
<AuthProvider>
  <AppRouter />
</AuthProvider>
```

### 6.8 `src/app/router.tsx` — Routing

```
/login              → LoginPage        (public)
/register           → RegisterPage     (public)
/                   → ProtectedRoute + Layout
  /dashboard        → DashboardPage
  /penduduk         → PendudukPage
  /kk               → KartuKeluargaPage
  /surat            → SuratPage
  /surat/create     → SuratCreatePage
  / (index)         → Navigate to /dashboard
```

### 6.9 `src/pages/LoginPage.tsx`

- **Form**: email + password
- **Submit**: POST `/auth/login` → `login(token, user)` → navigate `/dashboard`
- **UI**: Centered card, error banner merah, loading state pada tombol
- **Link**: "Belum punya akun? Daftar" → `/register`

### 6.10 `src/pages/RegisterPage.tsx`

- **Form**: name + email + password
- **Submit**: POST `/auth/register` → navigate `/login`
- **UI**: Centered card, catatan "Akun baru akan mendapat peran RT"
- **Link**: "Sudah punya akun? Masuk" → `/login`

### 6.11 `src/pages/DashboardPage.tsx`

- **Data**: Fetch `/penduduk`, `/kk`, `/surat` via `Promise.all`
- **Statistik**: 4 cards — Total Penduduk (biru), Total KK (hijau), Total Surat (ungu), Surat Pending (kuning)
- **Greeting**: "Selamat datang, {nama} ({role})"

### 6.12 `src/pages/PendudukPage.tsx`

- **Tabel**: NIK, Nama, Jenis Kelamin, Pekerjaan, Status (badge), No KK, Aksi
- **Modal Create/Edit**: NIK (maxLength 16), Nama, Tanggal Lahir (date), Jenis Kelamin (select), Pekerjaan, Kartu Keluarga (dropdown dari API)
- **Data fetch**: `Promise.all` penduduk + KK list
- **Role visibility**:
  - Tombol "Tambah Penduduk": ADMIN, RT
  - Tombol "Edit": ADMIN, RT
  - Tombol "Hapus": ADMIN only (dengan `window.confirm`)
- **EMPTY_FORM type**: Explicit typed dengan `jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN'` (fix TS narrowing issue)

### 6.13 `src/pages/KartuKeluargaPage.tsx`

- **Tabel**: No KK, Alamat, RT, RW, Anggota (count penduduk), Aksi
- **Modal Create/Edit**: No KK (maxLength 16), Alamat, RT, RW (grid 2 kolom)
- **Role visibility**:
  - Semua tombol create/edit: **ADMIN only** (`canModify = user?.role === 'ADMIN'`)
  - Kolom "Aksi" disembunyikan dari non-ADMIN

### 6.14 `src/pages/SuratPage.tsx`

- **Tabel**: Nomor Surat (font-mono), Jenis (Domisili/Tidak Mampu), Status (badge warna), Penduduk, Tanggal (format id-ID), Aksi
- **Status badge colors**:
  - PENDING: kuning
  - APPROVED: hijau
  - REJECTED: merah
- **Tombol aksi**: Hanya muncul jika `canApprove` (ADMIN/KEPALA_DESA) DAN status PENDING
  - "Setujui" (hijau) + "Tolak" (merah) dengan `window.confirm`
- **Tombol "Buat Surat"**: Hanya ADMIN dan RT (`canCreate`)
- **Loading state**: Per-row `actionLoading` tracking

### 6.15 `src/pages/SuratCreatePage.tsx`

- **Form**: Jenis Surat (DOMISILI/TIDAK_MAMPU dropdown) + Penduduk (dropdown dari API)
- **Submit**: POST `/surat` → navigate `/surat`
- **Tombol**: "Batal" (kembali ke /surat) + "Buat Surat" (submit)
- **Data fetch**: GET `/penduduk` untuk dropdown

### 6.16 Config Files

| File | Isi |
|------|-----|
| `main.tsx` | StrictMode + createRoot + `<App />` |
| `index.css` | 3 Tailwind directives |
| `index.html` | lang="id", title "SIDESA - Sistem Informasi Desa" |
| `.env.example` | `VITE_API_URL=http://localhost:5000/api` |
| `tailwind.config.js` | content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}` |
| `vite.config.ts` | `plugins: [react()]` |

---

## 7. API ENDPOINTS

### Auth (Public)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ status, data: User }` 201 |
| POST | `/api/auth/login` | `{ email, password }` | `{ status, data: { token, user } }` 200 |

### Auth (Admin Only)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/users` | `{ name, email, password, role }` | `{ status, data: User }` 201 |

### Penduduk (Authenticated)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/penduduk` | - | `{ status, data: Penduduk[] }` |
| GET | `/api/penduduk/:id` | - | `{ status, data: Penduduk }` |
| POST | `/api/penduduk` | `{ nik, nama, tanggalLahir, jenisKelamin, pekerjaan, kkId }` | 201 |
| PUT | `/api/penduduk/:id` | partial fields | 200 |
| DELETE | `/api/penduduk/:id` | - | `{ status, message }` |

### Kartu Keluarga (Authenticated)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/kk` | - | `{ status, data: KartuKeluarga[] }` |
| POST | `/api/kk` | `{ noKk, alamat, rt, rw }` | 201 |
| PUT | `/api/kk/:id` | partial fields | 200 |

### Surat (Authenticated)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/surat` | - | `{ status, data: Surat[] }` |
| POST | `/api/surat` | `{ jenis, pendudukId }` | 201 |
| PUT | `/api/surat/:id/approve` | - | 200 |
| PUT | `/api/surat/:id/reject` | - | 200 |

### Error Response Format

```json
{
  "status": "error",
  "message": "Pesan error yang deskriptif"
}
```

---

## 8. ROLE MATRIX & HAK AKSES

### 3 Role dalam Sistem

| Role | Deskripsi |
|------|-----------|
| **ADMIN** | Administrator sistem, full access |
| **RT** | Ketua RT, mengelola data penduduk dan membuat surat |
| **KEPALA_DESA** | Kepala Desa, menyetujui/menolak surat |

### Matriks Hak Akses per Fitur

| Fitur | ADMIN | RT | KEPALA_DESA |
|-------|:-----:|:--:|:-----------:|
| **Auth** | | | |
| Register (public) | - | Auto (hardcode) | - |
| Create User | Ya | Tidak | Tidak |
| **Penduduk** | | | |
| Lihat semua | Ya | Ya | Ya |
| Lihat detail | Ya | Ya | Ya |
| Tambah | Ya | Ya | Tidak |
| Edit | Ya | Ya | Tidak |
| Hapus | Ya | Tidak | Tidak |
| **Kartu Keluarga** | | | |
| Lihat semua | Ya | Ya | Ya |
| Tambah | Ya | Tidak* | Tidak |
| Edit | Ya | Tidak* | Tidak |
| **Surat** | | | |
| Lihat semua | Ya | Ya | Ya |
| Buat surat | Ya | Ya | Tidak |
| Approve | Ya | Tidak | Ya |
| Reject | Ya | Tidak | Ya |

*\* KK route mengizinkan RT di middleware, tapi service-level memblokir RT (hanya ADMIN). Ini adalah defense in depth.*

### Frontend UI Visibility

| UI Element | ADMIN | RT | KEPALA_DESA |
|-----------|:-----:|:--:|:-----------:|
| Tombol "Tambah Penduduk" | Tampil | Tampil | Sembunyi |
| Tombol "Edit" Penduduk | Tampil | Tampil | Sembunyi |
| Tombol "Hapus" Penduduk | Tampil | Sembunyi | Sembunyi |
| Tombol "Tambah KK" | Tampil | Sembunyi | Sembunyi |
| Tombol "Edit" KK | Tampil | Sembunyi | Sembunyi |
| Tombol "Buat Surat" | Tampil | Tampil | Sembunyi |
| Link "Buat Surat" (sidebar) | Tampil | Tampil | Sembunyi |
| Tombol "Setujui/Tolak" Surat | Tampil | Sembunyi | Tampil |

---

## 9. SECURITY LAYERS

### Layer 1: Middleware Authentication (`auth.ts`)
- Setiap request ke protected route harus membawa `Authorization: Bearer <token>`
- Token diverifikasi dengan `jwt.verify` menggunakan secret key
- Invalid/expired token → 401

### Layer 2: Middleware Authorization (`role.ts`)
- Setelah autentikasi, cek apakah `req.user.role` ada dalam daftar role yang diizinkan
- Tidak termasuk → 403

### Layer 3: Service-Level Role Enforcement
- **Defense in depth**: Service function melakukan pengecekan role LAGI
- Contoh: `kk.service.create()` cek `userRole !== ADMIN` → 403
- Contoh: `surat.service.approve()` cek `userRole === RT` → 403
- Ini melindungi dari bypass jika ada misconfiguration di route

### Layer 4: Request Validation (`validate.ts`)
- Validasi input sebelum masuk ke controller/service
- Field wajib harus ada (not undefined, null, atau empty string)
- Format: email regex, NIK/noKk 16 digit, enum values
- **Register**: Secara eksplisit REJECT jika field `role` dikirim (mencegah privilege escalation)

### Layer 5: Domain Validation (di Services)
- NIK harus `/^\d{16}$/` — divalidasi di service (di luar middleware)
- noKk harus `/^\d{16}$/` — divalidasi di service
- Email harus valid format — divalidasi di `auth.service`
- Duplikat unique fields (email, NIK, noKk, nomorSurat) → 409

### Layer 6: Transaction Safety
- Semua operasi CUD dibungkus dalam `prisma.$transaction()`
- AuditLog ditulis dalam transaction yang SAMA dengan operasi utama
- NomorSurat dihasilkan di dalam transaction (mencegah race condition)

### Layer 7: Frontend Guards
- ProtectedRoute: redirect ke `/login` jika belum auth
- Axios response interceptor: 401 → clear + redirect
- Role-based UI: tombol/link disembunyikan berdasarkan `user.role`
- Konfirmasi: `window.confirm()` untuk operasi destruktif (hapus, approve, reject)

---

## 10. BUILD STATUS

### Backend

```
✓ TypeScript compilation (tsc): PASS — 0 errors
✓ Prisma generate: PASS
✓ Prisma migration: PASS (20260215123200_init)
✓ Seed: PASS (admin@sidesa.id created)
```

### Frontend

```
✓ TypeScript compilation (tsc -b): PASS — 0 errors
✓ Vite build: PASS
  - 104 modules transformed
  - Built in 2.07s
  - Output:
    - dist/index.html          0.48 KB (gzip: 0.31 KB)
    - dist/assets/index.css   12.92 KB (gzip: 3.12 KB)
    - dist/assets/index.js   291.78 KB (gzip: 92.36 KB)
```

### Bug Fixes Yang Telah Dilakukan

| # | Issue | Fix |
|---|-------|-----|
| 1 | Prisma v7 breaking change (url not in datasource) | Downgrade ke v6.19.2, restore `url = env("DATABASE_URL")` |
| 2 | Express 5 `req.params.id` typed `string \| string[]` | Cast `as string` di semua controller |
| 3 | `jwt.sign` expiresIn type incompatibility | Gunakan numeric `3600` bukan string `'1h'` |
| 4 | Seed file `new PrismaClient()` gagal | Import singleton dari `./client` |
| 5 | `prisma.config.ts` tidak diperlukan di v6 | Hapus file |
| 6 | Privilege escalation via register role field | Hardcode `Role.RT`, reject `role` field di validator |
| 7 | NomorSurat race condition | Pindahkan generasi ke dalam `$transaction` |
| 8 | PendudukPage `EMPTY_FORM` jenisKelamin type narrowing | Explicit type annotation |

---

## 11. CARA MENJALANKAN

### Prerequisites

- Node.js (v18+)
- PostgreSQL running
- pnpm installed (`npm install -g pnpm`)

### Backend

```bash
cd backend

# 1. Copy env
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client + run migration
npx prisma generate
npx prisma migrate deploy    # atau: npx prisma migrate dev

# 4. Seed admin user
pnpm seed

# 5. Run development server
pnpm dev
# Server berjalan di http://localhost:5000
```

### Frontend

```bash
cd frontend

# 1. Copy env
cp .env.example .env
# Pastikan VITE_API_URL mengarah ke backend

# 2. Install dependencies
pnpm install

# 3. Run development server
pnpm dev
# App berjalan di http://localhost:5173
```

### Default Admin Login

```
Email:    admin@sidesa.id
Password: admin123
Role:     ADMIN
```

---

> **Total files**: 51 source files (29 backend + 22 frontend)
> **Arsitektur**: Clean Architecture dengan dual-layer authorization
> **Status**: Build PASS (both backend & frontend), production-ready
