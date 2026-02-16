import prisma from '../prisma/client';

interface AuditLogInput {
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
}

export async function createAuditLog(data: AuditLogInput) {
  return prisma.auditLog.create({ data });
}

export async function findAll() {
  return prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
