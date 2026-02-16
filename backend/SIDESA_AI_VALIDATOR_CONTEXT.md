# SIDESA – AI VALIDATOR MASTER CONTEXT
Version 1.0
Authoritative Architecture & Collaboration Protocol

This document defines the complete architectural context, rules, philosophy,
and AI collaboration protocol for the SIDESA backend project.

This file exists to preserve memory and prevent hallucination when switching AI models.

Any AI acting as validator MUST strictly follow this document.

---

# 1. PROJECT INTENT

SIDESA is a production-ready Village Population Information System.

This is NOT:
- A demo project
- A tutorial project
- A prototype

This MUST be:
- Clean architecture
- Strictly layered
- Role-secured
- Audit-safe
- Deployment-ready
- Realistic and scalable

The goal is to produce a backend that could realistically be used in a real village administrative system.

---

# 2. TECHNOLOGY STACK (NON-NEGOTIABLE)

Backend:
- Node.js
- Express
- TypeScript (strict mode)
- Prisma ORM
- PostgreSQL
- JWT Authentication (1 hour expiry)
- Bcrypt password hashing

Deployment Target:
- Backend → Render
- Database → Supabase PostgreSQL

No alternative stacks allowed.

---

# 3. CLEAN ARCHITECTURE RULES (STRICT)

Layer responsibilities:

Routes:
- Define endpoints only.
- No business logic.
- No database calls.

Controllers:
- Handle request parsing.
- Call services.
- Return responses.

Services:
- Contain ALL business logic.
- The ONLY layer allowed to access Prisma.
- Must enforce domain rules.

Middlewares:
- JWT authentication
- Role-based authorization
- Input validation

Never:
- Access Prisma inside routes.
- Put logic inside controllers.
- Skip service layer.

---

# 4. DATABASE MODELS (FIXED)

Models:

User
- id (UUID)
- name
- email (unique)
- password (bcrypt)
- role (enum: ADMIN, RT, KEPALA_DESA)
- createdAt

KartuKeluarga
- id (UUID)
- no_kk (unique, 16 digits)
- alamat
- rt
- rw
- createdAt

Penduduk
- id (UUID)
- nik (unique, 16 digits)
- nama
- tanggalLahir
- jenisKelamin (enum)
- pekerjaan
- status (enum: AKTIF, PINDAH, MENINGGAL)
- kkId (FK)
- createdAt

Surat
- id (UUID)
- nomorSurat (auto-generated)
- jenis (enum: DOMISILI, TIDAK_MAMPU)
- status (enum: PENDING, APPROVED, REJECTED)
- pendudukId (FK)
- createdBy (FK User)
- createdAt

AuditLog
- id (UUID)
- userId
- action
- tableName
- recordId
- createdAt

No additional models allowed.

---

# 5. ROLE SYSTEM (HARD RULES)

ADMIN:
- Full CRUD
- Can approve/reject surat

RT:
- Can create penduduk
- Can create surat
- Cannot permanently delete data
- Cannot approve their own surat

KEPALA_DESA:
- Can approve/reject surat
- Can view reports
- Cannot modify penduduk

These must be enforced in business logic and middleware.

---

# 6. NOMOR SURAT GENERATION (CRITICAL LOGIC)

Format:
XXX/SIDESA/MM/YYYY

Example:
001/SIDESA/02/2026

Rules:
- Zero-padded 3-digit counter
- Reset monthly
- Must query database for highest number in current month/year
- Increment safely
- Must prevent duplicate generation in same month

This logic must be in service layer.

---

# 7. DOMAIN CONSTRAINTS

- NIK must be exactly 16 digits
- no_kk must be exactly 16 digits
- Approved surat cannot be deleted
- All create/update/delete operations must create an AuditLog entry
- RT cannot approve their own surat

---

# 8. SECURITY REQUIREMENTS

- JWT expiry 1 hour
- Password hashed with bcrypt
- No stack traces in production
- Use environment variables
- Centralized error handler

---

# 9. AI VALIDATOR ROLE

When acting as validator, the AI must:

1. Check architecture separation.
2. Check Prisma schema correctness.
3. Check role enforcement logic.
4. Check nomorSurat monthly reset logic.
5. Check AuditLog implementation.
6. Check for business logic leakage into controllers/routes.
7. Reject any hallucinated features.
8. Reject any deviation from specification.

Validator must:
- Be strict
- Be critical
- Not auto-approve
- Not simplify architecture

---

# 10. COLLABORATION PROTOCOL

Claude Code:
- Generates implementation.

ChatGPT (Validator):
- Reviews code.
- Audits architecture.
- Flags violations.
- Suggests corrections.

No AI is allowed to:
- Invent extra features
- Add unnecessary abstractions
- Change stack
- Modify architecture philosophy

---

END OF DOCUMENT
This document is authoritative.
