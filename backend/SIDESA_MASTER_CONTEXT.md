# SIDESA Master Context

Authoritative System Architecture Contract
Version 1.1 -- Finalized

---

## 1. Project Philosophy

SIDESA is a production-grade Village Population Information System built as an academic final project. It prioritizes correctness, security, and architectural discipline over velocity. Every layer exists for a reason. Every guard exists for a reason. No shortcuts are permitted.

The system is designed to be portable across AI assistants. Any future AI operating on this codebase must treat this document as the binding architectural contract.

---

## 2. Locked Stack Declaration

### Backend (Locked)

| Component        | Technology            | Version Lock     |
|------------------|-----------------------|------------------|
| Runtime          | Node.js               | LTS              |
| Framework        | Express               | 5.x              |
| Language         | TypeScript            | 5.x (strict)     |
| ORM              | Prisma                | 6.x              |
| Database         | PostgreSQL            | 15+              |
| Authentication   | JSON Web Tokens       | 9.x              |
| Password Hashing | bcrypt                | 6.x              |
| Package Manager  | pnpm                  | 10.x             |

### Frontend (Planned)

| Component    | Technology      |
|--------------|-----------------|
| Framework    | React (Vite)    |
| Language     | TypeScript      |
| HTTP Client  | Axios           |
| Routing      | React Router    |
| Styling      | Tailwind CSS v3 |

### Deployment Targets

| Component | Target   |
|-----------|----------|
| Backend   | Render   |
| Frontend  | Vercel   |
| Database  | Supabase |

---

## 3. Clean Architecture Rules

These rules are absolute and must not be violated.

1. Routes only define endpoints and attach middleware. No logic.
2. Controllers handle request parsing and response formatting. No business logic.
3. Services contain all business logic. Services are the only layer that accesses Prisma.
4. Prisma is only accessed inside services. No raw SQL outside Prisma.
5. No business logic inside controllers.
6. No direct database access inside routes or controllers.
7. Middleware handles authentication, authorization, validation, and error handling.
8. Domain validation exists in both middleware (first pass) and services (defensive enforcement).

---

## 4. Layer Responsibilities

### Routes (`src/routes/`)

- Define HTTP method and path.
- Attach authentication middleware.
- Attach authorization middleware with allowed roles.
- Attach validation middleware.
- Delegate to controller functions.
- Must not contain any logic beyond middleware chaining.

### Controllers (`src/controllers/`)

- Extract data from `req.body`, `req.params`, `req.user`.
- Call the appropriate service function.
- Format and send the HTTP response.
- Must not access Prisma.
- Must not contain business rules.

### Services (`src/services/`)

- Contain all business logic.
- Perform domain validation defensively (do not rely on middleware alone).
- Enforce role-based rules at the service level.
- Execute Prisma queries inside `$transaction` blocks for CUD operations.
- Write AuditLog entries inside the same transaction as the main operation.
- Throw `AppError` with appropriate HTTP status codes on failure.

### Middlewares (`src/middlewares/`)

- `auth.ts`: JWT verification. Extracts user ID and role. Attaches to `req.user`.
- `role.ts`: Factory function `authorize(...roles)`. Rejects if caller role is not in allowed list.
- `validate.ts`: Input shape and format validation. Rejects malformed requests before they reach controllers.
- `errorHandler.ts`: Centralized error handler. Returns structured JSON. Suppresses stack traces in production.

### Utils (`src/utils/`)

- `AppError.ts`: Custom error class with `statusCode` property.

### Config (`src/config/`)

- Loads environment variables via dotenv.
- Exports typed configuration object.

### Prisma (`src/prisma/`)

- `client.ts`: Singleton PrismaClient instance. All services import from here.
- `seed.ts`: Seeds the initial ADMIN user via upsert. Imports the singleton client.

---

## 5. Role System Specification

### Roles

| Role         | Description                          |
|--------------|--------------------------------------|
| ADMIN        | Full system access                   |
| RT           | Field-level data entry operator      |
| KEPALA_DESA  | Approval authority                   |

### Permission Matrix

| Action                        | ADMIN | RT  | KEPALA_DESA |
|-------------------------------|-------|-----|-------------|
| Register (public)             | N/A   | Auto-assigned | N/A |
| Create user with role         | Yes   | No  | No          |
| CRUD Penduduk                 | Full  | Create, Read, Update | Read only |
| Delete Penduduk               | Yes   | No  | No          |
| CRUD KartuKeluarga            | Full  | Read only | Read only |
| Create Surat                  | Yes   | Yes | No          |
| Approve/Reject Surat          | Yes   | No  | Yes         |
| View Reports                  | Yes   | Yes | Yes         |

### Authorization Enforcement (Dual-Layer)

Authorization is enforced at two independent layers:

1. **Middleware layer** (`role.ts`): Route-level `authorize()` rejects requests from unauthorized roles before the controller executes.
2. **Service layer**: Each service method independently verifies the caller's role and throws `AppError(403)` if violated.

Both layers must agree. Removing either layer is a security regression.

### Registration Security

- Public registration (`POST /api/auth/register`) always assigns `Role.RT`. The client cannot specify a role.
- If a `role` field is present in the public registration body, the request is rejected with 400.
- Privileged user creation (`POST /api/auth/users`) requires ADMIN authentication and authorization.

---

## 6. Domain Constraints

### NIK (Nomor Induk Kependudukan)

- Must match `/^\d{16}$/`.
- Validated in middleware (`validatePenduduk`, `validatePendudukUpdate`).
- Validated defensively in service (`penduduk.service.ts` `validateNik()`).
- Must be unique (enforced by Prisma schema `@unique`).

### No KK (Nomor Kartu Keluarga)

- Must match `/^\d{16}$/`.
- Validated in middleware (`validateKK`, `validateKKUpdate`).
- Validated defensively in service (`kk.service.ts` `validateNoKk()`).
- Must be unique (enforced by Prisma schema `@unique`).

### Email

- Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- Validated in middleware (`validateRegister`, `validateLogin`, `validateCreateUser`).
- Validated defensively in service (`auth.service.ts` `validateEmail()`).
- Must be unique (enforced by Prisma schema `@unique`).

### Surat Status Transitions

- Only surat with status `PENDING` can be approved or rejected.
- Approved surat cannot be deleted.
- There is no delete endpoint for surat.

---

## 7. NomorSurat Generation Logic

### Format

```
XXX/SIDESA/MM/YYYY
```

- `XXX`: Zero-padded 3-digit sequential number.
- `SIDESA`: Literal string.
- `MM`: 2-digit month (01-12).
- `YYYY`: 4-digit year.

### Example

```
001/SIDESA/02/2026
002/SIDESA/02/2026
001/SIDESA/03/2026  <- resets on new month
```

### Monthly Reset

The sequential counter resets to `001` at the start of each calendar month.

### Implementation Location

The nomorSurat generation logic resides exclusively inside `surat.service.ts` within the `create()` method. It executes inside a Prisma `$transaction` block.

### Algorithm

1. Compute current month and year.
2. Build suffix string: `/SIDESA/MM/YYYY`.
3. Query `tx.surat.findFirst()` for the last surat matching the suffix, ordered descending.
4. Parse the numeric prefix from the result using `parseInt()` with `isNaN` guard.
5. Increment by 1 (or start at 1 if no match).
6. Zero-pad to 3 digits.
7. Concatenate: `XXX` + suffix.
8. The `nomorSurat` column has a `@unique` constraint as a concurrency safety net.

### Concurrency Guarantee

- The query and insert occur inside the same Prisma interactive transaction.
- The `@unique` constraint on `nomor_surat` prevents duplicate insertion if a race condition occurs.
- On unique constraint violation, the transaction fails and must be retried by the caller.

---

## 8. AuditLog Contract

Every Create, Update, and Delete operation must generate an AuditLog record within the same `$transaction` as the main operation.

### AuditLog Fields

| Field     | Content                                    |
|-----------|--------------------------------------------|
| userId    | The authenticated user who performed the action |
| action    | CREATE, UPDATE, DELETE, APPROVE, REJECT    |
| tableName | The target table name (snake_case)         |
| recordId  | The UUID of the affected record            |
| createdAt | Automatically set by Prisma                |

### Atomicity

If the AuditLog insert fails, the entire transaction rolls back. The main operation and the audit log are atomic.

---

## 9. Security Posture

| Measure                              | Implementation                              |
|--------------------------------------|---------------------------------------------|
| Password storage                     | bcrypt with 10 salt rounds                  |
| Token type                           | JWT (HS256)                                 |
| Token expiry                         | 3600 seconds (1 hour)                       |
| Token delivery                       | `Authorization: Bearer <token>` header      |
| Role enforcement                     | Dual-layer (middleware + service)           |
| Public registration privilege        | Hardcoded to RT, role field rejected        |
| Privileged user creation             | ADMIN-only endpoint                         |
| Input validation                     | Dual-layer (middleware + service)           |
| Error exposure                       | Stack traces suppressed in production       |
| Centralized error handling           | `errorHandler.ts` middleware                |
| Graceful shutdown                    | SIGTERM handler disconnects Prisma          |

---

## 10. What Future AI Must NOT Modify

1. Do not change the Prisma schema models, enums, or relations.
2. Do not change the folder structure.
3. Do not collapse layers (e.g., merging services into controllers).
4. Do not remove dual-layer authorization enforcement.
5. Do not move nomorSurat generation outside the transaction.
6. Do not allow public registration to accept a role field.
7. Do not remove AuditLog writes from CUD operations.
8. Do not expose stack traces in production error responses.
9. Do not change the JWT expiry from 3600 seconds.
10. Do not replace Prisma with raw SQL or another ORM.
11. Do not upgrade to Prisma v7 without explicit instruction.
12. Do not introduce new architectural abstractions (repositories, DTOs, etc.) unless explicitly requested.

---

## 11. Refactor History Summary

| Phase   | Changes Applied                                                                 |
|---------|---------------------------------------------------------------------------------|
| v1.0    | Initial implementation: full clean architecture, all 5 models, all endpoints.   |
| v1.1    | Security refactor: public register locked to RT, ADMIN-only user creation endpoint added, nomorSurat moved inside transaction, service-level role enforcement added, domain validation duplicated in services, Prisma downgraded from v7 to v6, prisma.config.ts removed, seed updated to use singleton client. |

---

## 12. Deployment Configuration

### Environment Variables

| Variable     | Required | Description                     |
|--------------|----------|---------------------------------|
| DATABASE_URL | Yes      | PostgreSQL connection string    |
| JWT_SECRET   | Yes      | Secret key for JWT signing      |
| PORT         | No       | Server port (default: 5000)     |
| NODE_ENV     | No       | Environment (default: development) |

### Build Commands

```bash
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm build
```

### Start Command

```bash
pnpm start
```

### Seed Command

```bash
npx prisma db seed
```

---

END OF MASTER CONTEXT

This document is authoritative. It reflects the verified state of the system.
Do not invent features outside this document.
