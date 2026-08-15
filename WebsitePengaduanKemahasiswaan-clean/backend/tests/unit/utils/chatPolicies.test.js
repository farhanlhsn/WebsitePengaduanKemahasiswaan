jest.mock('../../../src/utils/prisma', () => ({
  user: { findFirst: jest.fn(), findMany: jest.fn() },
  report: { findFirst: jest.fn() },
  adminCategoryAssignment: { findMany: jest.fn() },
}));

jest.mock('../../../src/utils/accessPolicy', () => ({
  canAccessReport: jest.fn(),
}));

const prisma = require('../../../src/utils/prisma');
const { canAccessReport } = require('../../../src/utils/accessPolicy');
const { canDeleteChatMessage } = require('../../../src/utils/chatPolicies');

describe('canDeleteChatMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows message owner (student)', async () => {
    const result = await canDeleteChatMessage(
      { userId: 1, role: 'MAHASISWA' },
      { senderId: 1, reportId: 10 }
    );
    expect(result.allowed).toBe(true);
  });

  it('denies student deleting others message', async () => {
    const result = await canDeleteChatMessage(
      { userId: 1, role: 'MAHASISWA' },
      { senderId: 2, reportId: 10 }
    );
    expect(result.allowed).toBe(false);
  });

  it('allows SUPERADMIN to delete any message', async () => {
    const result = await canDeleteChatMessage(
      { userId: 99, role: 'SUPERADMIN' },
      { senderId: 2, reportId: 10 }
    );
    expect(result.allowed).toBe(true);
  });

  it('allows ADMIN with category access', async () => {
    canAccessReport.mockResolvedValue({ allowed: true });
    const result = await canDeleteChatMessage(
      { userId: 5, role: 'ADMIN' },
      { senderId: 2, reportId: 10 }
    );
    expect(result.allowed).toBe(true);
  });

  it('denies ADMIN without category access', async () => {
    canAccessReport.mockResolvedValue({ allowed: false });
    const result = await canDeleteChatMessage(
      { userId: 5, role: 'ADMIN' },
      { senderId: 2, reportId: 10 }
    );
    expect(result.allowed).toBe(false);
  });
});
