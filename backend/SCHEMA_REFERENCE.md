# SIDESA Prisma Schema Reference

Exact snapshot of `prisma/schema.prisma`.
5 models, 5 enums, all relations documented.

---

## Enums

### Role

```
ADMIN | RT | KEPALA_DESA
```

### JenisKelamin

```
LAKI_LAKI | PEREMPUAN
```

### StatusPenduduk

```
AKTIF | PINDAH | MENINGGAL
```

### JenisSurat

```
DOMISILI | TIDAK_MAMPU
```

### StatusSurat

```
PENDING | APPROVED | REJECTED
```

---

## Models

### User

| Field     | Type     | Constraints                  | DB Column    |
|-----------|----------|------------------------------|--------------|
| id        | String   | PK, UUID, auto-generated     | id           |
| name      | String   | Required                     | name         |
| email     | String   | Unique                       | email        |
| password  | String   | Required (bcrypt hash)       | password     |
| role      | Role     | Enum                         | role         |
| createdAt | DateTime | Default: now()               | created_at   |

**Relations:**
- `suratCreated`: One-to-many with Surat (as creator)
- `auditLogs`: One-to-many with AuditLog

**Table name:** `users`

---

### KartuKeluarga

| Field     | Type     | Constraints                  | DB Column    |
|-----------|----------|------------------------------|--------------|
| id        | String   | PK, UUID, auto-generated     | id           |
| noKk      | String   | Unique                       | no_kk        |
| alamat    | String   | Required                     | alamat       |
| rt        | String   | Required                     | rt           |
| rw        | String   | Required                     | rw           |
| createdAt | DateTime | Default: now()               | created_at   |

**Relations:**
- `penduduk`: One-to-many with Penduduk

**Table name:** `kartu_keluarga`

---

### Penduduk

| Field        | Type           | Constraints                  | DB Column      |
|--------------|----------------|------------------------------|----------------|
| id           | String         | PK, UUID, auto-generated     | id             |
| nik          | String         | Unique                       | nik            |
| nama         | String         | Required                     | nama           |
| tanggalLahir | DateTime       | Required                     | tanggal_lahir  |
| jenisKelamin | JenisKelamin   | Enum                         | jenis_kelamin  |
| pekerjaan    | String         | Required                     | pekerjaan      |
| status       | StatusPenduduk | Default: AKTIF               | status         |
| kkId         | String         | FK to KartuKeluarga          | kk_id          |
| createdAt    | DateTime       | Default: now()               | created_at     |

**Relations:**
- `kartuKeluarga`: Many-to-one with KartuKeluarga (via kkId -> id)
- `surat`: One-to-many with Surat

**Table name:** `penduduk`

---

### Surat

| Field       | Type        | Constraints                  | DB Column      |
|-------------|-------------|------------------------------|----------------|
| id          | String      | PK, UUID, auto-generated     | id             |
| nomorSurat  | String      | Unique                       | nomor_surat    |
| jenis       | JenisSurat  | Enum                         | jenis          |
| status      | StatusSurat | Default: PENDING             | status         |
| pendudukId  | String      | FK to Penduduk               | penduduk_id    |
| createdById | String      | FK to User                   | created_by_id  |
| createdAt   | DateTime    | Default: now()               | created_at     |

**Relations:**
- `penduduk`: Many-to-one with Penduduk (via pendudukId -> id)
- `createdBy`: Many-to-one with User (via createdById -> id)

**Table name:** `surat`

**Domain rules:**
- `nomorSurat` is auto-generated (format: XXX/SIDESA/MM/YYYY).
- `status` transitions: PENDING -> APPROVED or PENDING -> REJECTED. No other transitions.
- No DELETE endpoint exists for this model.

---

### AuditLog

| Field     | Type     | Constraints                  | DB Column    |
|-----------|----------|------------------------------|--------------|
| id        | String   | PK, UUID, auto-generated     | id           |
| userId    | String   | FK to User                   | user_id      |
| action    | String   | Required                     | action       |
| tableName | String   | Required                     | table_name   |
| recordId  | String   | Required                     | record_id    |
| createdAt | DateTime | Default: now()               | created_at   |

**Relations:**
- `user`: Many-to-one with User (via userId -> id)

**Table name:** `audit_log`

**Action values used:** CREATE, UPDATE, DELETE, APPROVE, REJECT

---

## Unique Constraints Summary

| Model          | Field      | DB Column    |
|----------------|------------|--------------|
| User           | email      | email        |
| KartuKeluarga  | noKk       | no_kk        |
| Penduduk       | nik        | nik          |
| Surat          | nomorSurat | nomor_surat  |

---

## Foreign Key Summary

| Source Model | Source Field | Target Model   | Target Field |
|--------------|-------------|----------------|--------------|
| Penduduk     | kkId        | KartuKeluarga  | id           |
| Surat        | pendudukId  | Penduduk       | id           |
| Surat        | createdById | User           | id           |
| AuditLog     | userId      | User           | id           |

---

## Folder Structure

```
backend/
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── .env.example
├── SIDESA_SPEC.md
├── SIDESA_MASTER_CONTEXT.md
├── PROJECT_STATUS.md
├── SCHEMA_REFERENCE.md
└── src/
    ├── server.ts
    ├── app.ts
    ├── config/
    │   └── index.ts
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── penduduk.controller.ts
    │   ├── kk.controller.ts
    │   └── surat.controller.ts
    ├── services/
    │   ├── auth.service.ts
    │   ├── penduduk.service.ts
    │   ├── kk.service.ts
    │   ├── surat.service.ts
    │   └── auditLog.service.ts
    ├── routes/
    │   ├── index.ts
    │   ├── auth.routes.ts
    │   ├── penduduk.routes.ts
    │   ├── kk.routes.ts
    │   └── surat.routes.ts
    ├── middlewares/
    │   ├── auth.ts
    │   ├── role.ts
    │   ├── validate.ts
    │   └── errorHandler.ts
    ├── prisma/
    │   ├── client.ts
    │   └── seed.ts
    ├── utils/
    │   └── AppError.ts
    └── types/
        └── express.d.ts
```

---

END OF SCHEMA REFERENCE
