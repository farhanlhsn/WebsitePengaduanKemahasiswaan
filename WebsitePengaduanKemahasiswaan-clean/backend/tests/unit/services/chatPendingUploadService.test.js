const { validateAttachmentTokens } = require('../../../src/services/chatPendingUploadService');
const { ChatError } = require('../../../src/utils/chatErrors');

describe('validateAttachmentTokens', () => {
  const validToken = 'a'.repeat(64);

  it('accepts valid token array', () => {
    expect(() => validateAttachmentTokens([validToken])).not.toThrow();
  });

  it('rejects non-array', () => {
    expect(() => validateAttachmentTokens('bad')).toThrow(ChatError);
  });

  it('rejects duplicate tokens', () => {
    expect(() => validateAttachmentTokens([validToken, validToken])).toThrow(ChatError);
  });

  it('rejects invalid token format', () => {
    expect(() => validateAttachmentTokens(['short'])).toThrow(ChatError);
  });

  it('rejects more than max files', () => {
    const tokens = Array.from({ length: 6 }, (_, i) => 'a'.repeat(63) + i);
    expect(() => validateAttachmentTokens(tokens)).toThrow(ChatError);
  });
});
