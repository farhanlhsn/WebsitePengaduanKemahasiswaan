/**
 * Unit tests for offline email chat notifications inside chatControllers.sendMessage.
 */

// Mock dependencies
const mockPrisma = {
  report: {
    findUnique: jest.fn()
  },
  adminCategoryAssignment: {
    findMany: jest.fn()
  }
};

jest.mock('../../../src/utils/prisma', () => mockPrisma);

const mockEmailService = {
  notifyNewMessage: jest.fn()
};
jest.mock('../../../src/services/emailService', () => mockEmailService);

const mockChatServices = {
  sendMessage: jest.fn()
};
jest.mock('../../../src/services/chatServices', () => mockChatServices);

jest.mock('../../../src/utils/chatNotify', () => ({
  notifyChatListRefresh: jest.fn().mockResolvedValue(undefined),
}));

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
jest.mock('../../../src/utils/logger', () => ({
  getLogger: () => mockLogger
}));

const chatControllers = require('../../../src/controllers/chatControllers');

describe('ChatControllers - sendMessage Offline Email Notification', () => {
  let req, res, mockEmit, mockTo;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmit = jest.fn().mockReturnThis();
    mockTo = jest.fn().mockReturnValue({ emit: mockEmit });

    req = {
      params: { reportId: '10' },
      body: { content: 'Hello there!', attachmentTokens: [], replyToId: null },
      user: { userId: 5, role: 'MAHASISWA', name: 'Student Sender' },
      reportAccess: { id: 10, userId: 5, categoryId: 1 },
      app: {
        get: jest.fn().mockReturnValue({
          to: mockTo,
          emit: mockEmit,
          sockets: {
            adapter: {
              rooms: {
                get: jest.fn()
              }
            },
            sockets: {
              get: jest.fn()
            }
          }
        })
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should call notifyNewMessage when recipient admin is offline', async () => {
    // 1. Mock chatServices.sendMessage to succeed
    const createdMessage = {
      id: 100,
      content: 'Hello there!',
      senderId: 5,
      report: {
        id: 10,
        userId: 5,
        isAnonymous: false
      }
    };
    mockChatServices.sendMessage.mockResolvedValue(createdMessage);

    // 2. Mock prisma.report.findUnique to return report with assigned admin
    mockPrisma.report.findUnique.mockResolvedValue({
      title: 'Report Title ABC',
      registrationNumber: 'REG12345',
      userId: 5,
      assignedToId: 42,
      categoryId: 1,
      isAnonymous: false,
      user: { id: 5, name: 'Student Sender', email: 'student@example.com' },
      assignedTo: { id: 42, name: 'Admin Receiver', email: 'admin@example.com' }
    });

    // 3. Mock socket IO room to be empty (recipient is offline)
    const ioMock = req.app.get('io');
    ioMock.sockets.adapter.rooms.get.mockReturnValue(new Set(['socket_of_sender']));
    ioMock.sockets.sockets.get.mockImplementation((sid) => {
      if (sid === 'socket_of_sender') {
        return { data: { user: { userId: 5 } } };
      }
      return null;
    });

    // Run sendMessage
    await chatControllers.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'Message sent successfully'
      })
    );

    // Wait briefly for background execution to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Email service should be called to notify the offline admin
    expect(mockEmailService.notifyNewMessage).toHaveBeenCalledWith(
      'admin@example.com',
      'Admin Receiver',
      'Report Title ABC',
      'REG12345',
      'Student Sender',
      expect.objectContaining({ isAnonymous: false, senderRole: 'MAHASISWA' })
    );
  });

  it('should NOT call notifyNewMessage when recipient is active in room', async () => {
    // 1. Mock chatServices.sendMessage to succeed
    const createdMessage = {
      id: 100,
      content: 'Hello there!',
      senderId: 5,
      report: {
        id: 10,
        userId: 5,
        isAnonymous: false
      }
    };
    mockChatServices.sendMessage.mockResolvedValue(createdMessage);

    // 2. Mock prisma.report.findUnique to return report with assigned admin
    mockPrisma.report.findUnique.mockResolvedValue({
      title: 'Report Title ABC',
      registrationNumber: 'REG12345',
      userId: 5,
      assignedToId: 42,
      categoryId: 1,
      isAnonymous: false,
      user: { id: 5, name: 'Student Sender', email: 'student@example.com' },
      assignedTo: { id: 42, name: 'Admin Receiver', email: 'admin@example.com' }
    });

    // 3. Mock socket IO room to have BOTH sender and receiver (recipient is online/active)
    const ioMock = req.app.get('io');
    ioMock.sockets.adapter.rooms.get.mockReturnValue(new Set(['socket_sender', 'socket_receiver']));
    ioMock.sockets.sockets.get.mockImplementation((sid) => {
      if (sid === 'socket_sender') {
        return { data: { user: { userId: 5 } } };
      }
      if (sid === 'socket_receiver') {
        return { data: { user: { userId: 42 } } };
      }
      return null;
    });

    // Run sendMessage
    await chatControllers.sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    // Wait briefly for background execution to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Email service should NOT be called
    expect(mockEmailService.notifyNewMessage).not.toHaveBeenCalled();
  });
});
