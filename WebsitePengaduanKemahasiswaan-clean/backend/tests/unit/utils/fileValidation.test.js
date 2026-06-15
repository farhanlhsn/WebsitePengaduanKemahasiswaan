const {
  validateFileDescriptor,
  sanitizeOriginalName,
  REPORT_CHAT_MIMES,
  KTM_MIMES,
} = require('../../../src/utils/fileValidation');

describe('fileValidation', () => {
  it('sanitizes dangerous original filenames', () => {
    expect(sanitizeOriginalName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeOriginalName('report<script>.pdf')).not.toContain('<');
  });

  it('accepts valid report MIME and extension pairs', () => {
    const result = validateFileDescriptor(
      { mimetype: 'application/pdf', originalname: 'doc.pdf' },
      REPORT_CHAT_MIMES
    );
    expect(result.ok).toBe(true);
  });

  it('rejects mismatched extension for MIME', () => {
    const result = validateFileDescriptor(
      { mimetype: 'application/pdf', originalname: 'doc.exe' },
      REPORT_CHAT_MIMES
    );
    expect(result.ok).toBe(false);
  });

  it('restricts KTM to image types only', () => {
    const result = validateFileDescriptor(
      { mimetype: 'application/pdf', originalname: 'ktm.pdf' },
      KTM_MIMES
    );
    expect(result.ok).toBe(false);
  });
});
