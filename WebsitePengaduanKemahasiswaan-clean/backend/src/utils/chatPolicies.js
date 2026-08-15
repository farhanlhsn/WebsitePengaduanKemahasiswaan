const prisma = require('./prisma');
const { canAccessReport } = require('./accessPolicy');
const { isSuperAdmin } = require('./rbac');

async function canDeleteChatMessage(actor, message) {
  const actorId = actor?.userId ?? actor?.id;
  if (!actorId || !message) {
    return { allowed: false, code: 'ACCESS_DENIED' };
  }

  if (isSuperAdmin(actor)) {
    return { allowed: true };
  }

  if (message.senderId === actorId) {
    return { allowed: true };
  }

  if (actor.role === 'ADMIN') {
    const access = await canAccessReport(actor, message.reportId);
    return access.allowed
      ? { allowed: true }
      : { allowed: false, code: 'ACCESS_DENIED' };
  }

  return { allowed: false, code: 'ACCESS_DENIED' };
}

async function addUserIfEligible(recipients, userId, reportId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true },
  });
  if (!user) return;

  const access = await canAccessReport(
    { userId: user.id, role: user.role },
    reportId
  );
  if (access.allowed) recipients.add(user.id);
}

async function getEligibleChatListRecipients(reportId) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, deletedAt: null },
    select: { id: true, userId: true, categoryId: true, assignedToId: true },
  });
  if (!report) return new Set();

  const recipients = new Set();

  if (report.userId) {
    await addUserIfEligible(recipients, report.userId, report.id);
  }

  if (report.assignedToId) {
    await addUserIfEligible(recipients, report.assignedToId, report.id);
  }

  if (report.categoryId) {
    const assignments = await prisma.adminCategoryAssignment.findMany({
      where: { categoryId: report.categoryId },
      select: { adminId: true },
    });
    for (const { adminId } of assignments) {
      await addUserIfEligible(recipients, adminId, report.id);
    }
  }

  const superadmins = await prisma.user.findMany({
    where: { role: 'SUPERADMIN', deletedAt: null },
    select: { id: true },
  });
  for (const sa of superadmins) {
    recipients.add(sa.id);
  }

  return recipients;
}

module.exports = {
  canDeleteChatMessage,
  getEligibleChatListRecipients,
};
