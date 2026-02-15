# SIDESA - Village Population Information System
Authoritative Technical Specification
Version 1.0

---

## 1. PROJECT OVERVIEW

SIDESA is a web-based Village Population Information System.

This system must be:
- Production-ready
- Modular
- Strictly typed (TypeScript strict mode)
- Clean architecture
- Scalable
- Deployment-ready (Render)

No shortcuts.
No monolithic messy file.
No business logic inside routes.

---

## 2. TECH STACK (FIXED)

Backend:
- Node.js
- Express
- TypeScript (strict)
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt

Frontend:
- React
- TypeScript
- Vite
- Axios
- React Router
- Chart.js

Deployment:
- Backend → Render
- Frontend → Vercel
- Database → Supabase PostgreSQL

---

## 3. ARCHITECTURE PRINCIPLES

### Clean Architecture Rules

- Routes only define endpoints.
- Controllers handle request/response.
- Services contain business logic.
- Prisma only accessed inside services.
- No raw SQL outside Prisma.
- No business logic inside controllers.
- No direct database access inside routes.

---

## 4. ROLE SYSTEM

Roles:
- ADMIN
- RT
- KEPALA_DESA

Permissions:

ADMIN:
- Full CRUD all entities
- Approve/reject surat

RT:
- Create surat
- Create penduduk
- Cannot delete data permanently

KEPALA_DESA:
- Approve or reject surat
- View all reports
- Cannot modify penduduk

Must enforce via middleware.

---

## 5. DATABASE SCHEMA (STRICT)

### User
- id: UUID (primary)
- name: string
- email: string (unique)
- password: string (hashed)
- role: enum (ADMIN, RT, KEPALA_DESA)
- createdAt: DateTime

### KartuKeluarga
- id: UUID
- no_kk: string (unique)
- alamat: string
- rt: string
- rw: string
- createdAt: DateTime

### Penduduk
- id: UUID
- nik: string (unique, 16 chars validation)
- nama: string
- tanggalLahir: DateTime
- jenisKelamin: enum (LAKI_LAKI, PEREMPUAN)
- pekerjaan: string
- status: enum (AKTIF, PINDAH, MENINGGAL)
- kkId: relation
- createdAt: DateTime

### Surat
- id: UUID
- nomorSurat: string (auto-generated)
- jenis: enum (DOMISILI, TIDAK_MAMPU)
- status: enum (PENDING, APPROVED, REJECTED)
- pendudukId: relation
- createdBy: relation (User)
- createdAt: DateTime

### AuditLog
- id: UUID
- userId: UUID
- action: string
- tableName: string
- recordId: UUID
- createdAt: DateTime

---

## 6. NOMOR SURAT FORMAT

Format:
XXX/SIDESA/MM/YYYY

Example:
001/SIDESA/02/2026

Must auto-increment monthly reset.

---

## 7. SECURITY REQUIREMENTS

- Password hashed with bcrypt
- JWT expires in 1 hour
- Role-based middleware
- Input validation using middleware
- Error handling centralized
- No stack trace exposed in production

---

## 8. FOLDER STRUCTURE (MANDATORY)

src/
 ├── controllers/
 ├── services/
 ├── routes/
 ├── middlewares/
 ├── utils/
 ├── prisma/
 ├── config/
 ├── app.ts
 └── server.ts

---

## 9. API ENDPOINT STRUCTURE

Auth:
POST /api/auth/register
POST /api/auth/login

Penduduk:
GET /api/penduduk
GET /api/penduduk/:id
POST /api/penduduk
PUT /api/penduduk/:id
DELETE /api/penduduk/:id

Kartu Keluarga:
GET /api/kk
POST /api/kk
PUT /api/kk/:id

Surat:
GET /api/surat
POST /api/surat
PUT /api/surat/:id/approve
PUT /api/surat/:id/reject

---

## 10. VALIDATION RULES

- NIK must be 16 digits
- no_kk must be 16 digits
- Email must be valid format
- Cannot delete approved surat
- Cannot approve own surat (if role RT)

---

## 11. AUDIT LOG RULE

Every:
- Create
- Update
- Delete
Must generate AuditLog record.

---

## 12. DEPLOYMENT REQUIREMENTS

Must:
- Use environment variables
- Use PORT from process.env
- Be ready for Render
- Provide example .env

---

END OF SPECIFICATION
This document is authoritative.
Do not invent features outside this specification.
