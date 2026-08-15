/**
 * Anonymity helpers.
 *
 * Policy:
 *   - When a report has `isAnonymous: true`, the reporter's identity must be
 *     hidden from EVERYONE except the reporter themselves.
 *     This includes admins.
 *   - The masked identity is exposed as a fixed sentinel object so the frontend
 *     can render "Anonim" without leaking any real PII (id, name, nim, email).
 *   - Messages authored by the reporter on an anonymous report are also masked
 *     to "Anonim" for non-owner viewers (admins included).
 *
 * The viewer's own messages are never masked back to themselves — the reporter
 * always sees their own posts, and admins always see their own posts.
 */

const ANON_USER = Object.freeze({
  id: null,
  name: 'Anonim',
  nim: null,
  email: null,
  role: null,
});

/**
 * Pseudonim stabil untuk identitas pelapor anonim di event socket
 * (typing / join / leave / read). Dipakai menggantikan userId asli agar
 * admin di room tidak bisa melakukan deanonymisasi.
 */
const ANON_REPORTER_IDENTITY = 'reporter';

/**
 * Identitas yang boleh dipublikasikan lewat event socket untuk `user`
 * di konteks laporan `report`.
 *
 * - Laporan anonim + user adalah pelapor  -> pseudonim 'reporter'.
 * - Selain itu                            -> userId asli.
 *
 * @param {?{isAnonymous?:boolean, userId?:number}} report
 * @param {{userId:number}} user
 * @returns {number|string}
 */
function socketIdentity(report, user) {
  if (
    report?.isAnonymous &&
    user?.userId != null &&
    Number(report.userId) === Number(user.userId)
  ) {
    return ANON_REPORTER_IDENTITY;
  }
  return user?.userId ?? null;
}

/**
 * Should this report's reporter identity be hidden from `viewer`?
 * Returns false only for the reporter themselves.
 */
function shouldMaskReporter(report, viewer) {
  if (!report?.isAnonymous) return false;
  if (!viewer) return true;
  // Reporter sees their own identity
  return report.userId !== viewer.userId;
}

/**
 * Apply anonymity masking to a single report (with optional embedded messages).
 * Mutates the object in-place AND returns it for chaining convenience.
 *
 * @param {object} report - The report payload from Prisma. Must include `isAnonymous` and `userId`.
 * @param {{ userId: number, role?: string }} viewer - The user reading the response.
 */
function anonymizeReport(report, viewer) {
  if (!report) return report;
  if (!shouldMaskReporter(report, viewer)) return report;

  const reporterId = report.userId;

  // Mask top-level reporter info
  report.user = { ...ANON_USER };
  report.userId = null;

  // Mask reporter's messages (sender name shown as "Anonim")
  if (Array.isArray(report.messages)) {
    for (const msg of report.messages) {
      if (msg.senderId === reporterId) {
        if (msg.sender) {
          msg.sender = { ...msg.sender, name: 'Anonim' };
          // Remove identifying detail if present
          if ('id' in msg.sender) msg.sender.id = null;
        }
        msg.senderId = null;
      }
    }
  }

  return report;
}

/**
 * Apply anonymizeReport to every item in a list.
 */
function anonymizeReportList(reports, viewer) {
  if (!Array.isArray(reports)) return reports;
  for (const r of reports) anonymizeReport(r, viewer);
  return reports;
}

/**
 * Apply masking to a single chat message attached to a report.
 * Used when iterating chat messages directly (not via getReportById).
 *
 * @param {object} message - Prisma message row, optionally with `sender`.
 * @param {object} report - Parent report (must include isAnonymous and userId).
 * @param {{ userId: number }} viewer
 */
function anonymizeChatMessage(message, report, viewer) {
  if (!message || !report) return message;
  if (!shouldMaskReporter(report, viewer)) return message;
  if (message.senderId !== report.userId) return message;

  if (message.sender) {
    message.sender = { ...message.sender, name: 'Anonim' };
    if ('id' in message.sender) message.sender.id = null;
  }
  message.senderId = null;
  return message;
}

module.exports = {
  ANON_USER,
  ANON_REPORTER_IDENTITY,
  shouldMaskReporter,
  socketIdentity,
  anonymizeReport,
  anonymizeReportList,
  anonymizeChatMessage,
};
