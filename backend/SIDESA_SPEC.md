# SIDESA – Village Population Information System
Authoritative Backend Specification
Version 2.0 (Production Strict Mode)

This document supersedes previous informal specifications.

This is NOT a learning project.
This is NOT a demo.
This is a production-grade administrative system.

All implementation must follow this document strictly.
Any deviation is considered a violation.

---

# 1. CORE PHILOSOPHY

SIDESA is a secure, role-based, audit-safe administrative backend.

The system must be:

- Strictly layered
- Domain-driven
- Concurrency-safe
- Audit-consistent
- Privilege-secured
- Transactionally correct
- Production-deployable

Security and data integrity take priority over convenience.

---

# 2. TECHNOLOGY STACK (NON-NEGOTIABLE)

Backend:
- Node.js
- Express
- TypeScript (strict: true)
- Prisma ORM
- PostgreSQL
- JWT (1 hour expiry)
- Bcrypt

Deployment:
- Render (backend)
- Supabase PostgreSQL (database)

No alternative stacks.
No raw SQL outside Prisma.
No ORM replacement.
No micro-framework improvisation.

---

# 3. CLEAN ARCHITECTURE (STRICT)

Layer separation is mandatory.

Routes:
- Define endpoints only.
- No business logic.
- No Prisma access.
- No data mutation.

Controllers:
- Parse request.
- Call service.
- Return response.
- No business logic.
- No validation logic.
- No Prisma access.

Services:
- Contain ALL business logic.
- The ONLY layer allowed to access Prisma.
- Must enforce domain rules.
- Must enforce role rules.
- Must handle transactions.

Middlewares:
- Authentication
- Role authorization
- Input validation

Violation of layering is a critical error.

---

# 4. DATABASE MODELS (FIXED – NO ADDITIONS)

Models allowed:

- User
- KartuKeluarga
- Penduduk
- Surat
- AuditLog

No extra models.
No soft delete columns.
No status flags beyond defined ones.
No hidden helper tables.

---

# 5. DOMAIN RULES (HARD ENFORCEMENT)

These rules MUST be enforced inside service layer.

### NIK
- Exactly 16 digits
- Numeric only
- Immutable once created

### no_kk
- Exactly 16 digits
- Numeric only

### Email
- Valid format
- Unique

### Surat
- Only PENDING can be approved/rejected
- RT cannot approve their own surat
- Approved surat cannot be modified
- NomorSurat must be unique
- NomorSurat must follow format XXX/SIDESA/MM/YYYY
- Counter resets monthly

### AuditLog
Every:
- CREATE
- UPDATE
- DELETE
Must create AuditLog entry within same transaction.

---

# 6. ROLE SYSTEM (DUAL-LAYER ENFORCEMENT)

Role rules must be enforced BOTH in:
- Middleware
- Service layer

## ADMIN
- Full CRUD all entities
- Approve/reject surat
- Create users
- Assign roles

## RT
- Create penduduk
- Create surat
- Cannot delete data permanently
- Cannot approve own surat
- Cannot create ADMIN users

## KEPALA_DESA
- Approve/reject surat
- View reports
- Cannot modify penduduk
- Cannot modify KK
- Cannot create users

Service layer must never trust route-only enforcement.

---

# 7. NOMOR SURAT (CRITICAL CONCURRENCY LOGIC)

Format:
XXX/SIDESA/MM/YYYY

Rules:
- 3-digit zero padded
- Reset monthly
- Query only current month/year
- Must be generated inside transaction
- Must be concurrency-safe

Acceptable implementation:
- Use Prisma transaction
- Re-query inside transaction
- Retry on unique constraint failure
OR
- Use SERIALIZABLE isolation

Generating nomorSurat outside transaction is prohibited.

---

# 8. SECURITY REQUIREMENTS

- Password hashed with bcrypt (min salt 10)
- JWT expiry exactly 1 hour
- JWT secret from environment variable
- No stack trace in production
- Centralized error handler
- No privilege escalation via register
- Only ADMIN can create ADMIN user

Register endpoint must not allow arbitrary role assignment.

---

# 9. TRANSACTION POLICY

All CUD operations must:

- Run inside Prisma $transaction
- Include AuditLog creation
- Be atomic

No partial success allowed.

---

# 10. VALIDATION POLICY

Validation must exist in:

- Middleware (input shape & format)
- Service layer (domain enforcement)

Service layer must not rely solely on middleware.

---

# 11. DEPLOYMENT READINESS

Must include:

- .env.example
- Prisma migration instructions
- Seed script for initial ADMIN
- Graceful shutdown
- Production build script

---

# 12. FORBIDDEN PRACTICES

- Business logic inside controllers
- Prisma usage outside services
- Generating IDs manually
- Catching and swallowing database errors silently
- Using try/catch to hide constraint violations
- Allowing client-controlled privilege escalation

---

# 13. VALIDATOR CHECKLIST

Before approval, verify:

- No layer violation
- All domain rules enforced in service
- Role rules enforced in service
- NomorSurat concurrency-safe
- AuditLog atomic
- No privilege escalation
- No missing constraints

If any item fails → system rejected.

---

END OF SPECIFICATION
