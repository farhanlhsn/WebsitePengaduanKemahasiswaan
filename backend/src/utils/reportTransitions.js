/**
 * Single source of truth for report status transitions (state machine).
 * Dipakai oleh endpoint status tunggal (reportControllers) dan bulk
 * operations (bulkOperationsServices) agar aturannya tidak menyimpang.
 */

const VALID_TRANSITIONS = Object.freeze({
  PENDING: ['IN_REVIEW', 'REJECTED', 'CANCELED'],
  IN_REVIEW: ['IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED', 'CANCELED'],
  RESOLVED: ['IN_REVIEW'], // Allow reopen
  REJECTED: ['IN_REVIEW'], // Allow reopen
  CANCELED: ['PENDING'], // Allow resubmit
});

/**
 * @param {string} fromStatus status saat ini
 * @param {string} toStatus status tujuan
 * @returns {boolean} true jika transisi diizinkan
 */
function canTransition(fromStatus, toStatus) {
  return (VALID_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

module.exports = { VALID_TRANSITIONS, canTransition };
