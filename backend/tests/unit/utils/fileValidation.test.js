const {
  validateFileDescriptor,
  sanitizeOriginalName,
  createValidateUploadedMiddleware,
  REPORT_CHAT_MIMES,
  KTM_MIMES,
} = require('../../../src/utils/fileValidation');

jest.mock('../../../src/utils/fileDisk', () => ({
  deleteFileFromDisk: jest.fn().mockResolvedValue(undefined),
}));

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

describe('createValidateUploadedMiddleware required option (audit B3)', () => {
  function run(middleware, req) {
    return new Promise((resolve) => {
      middleware(req, {}, (err) => resolve(err));
    });
  }

  it('required=true rejects empty file list', async () => {
    const mw = createValidateUploadedMiddleware(KTM_MIMES, { required: true });
    const err = await run(mw, { files: [] });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/No file uploaded/);
  });

  it('required=false (default) allows empty file list', async () => {
    const mw = createValidateUploadedMiddleware(KTM_MIMES);
    const err = await run(mw, { files: [] });
    expect(err).toBeUndefined();
  });

  it('required=true passes when a valid file is present', async () => {
    const mw = createValidateUploadedMiddleware(KTM_MIMES, { required: true });
    const file = {
      mimetype: 'image/png',
      originalname: 'ktm.png',
      path: null, // skip disk check
    };
    const err = await run(mw, { files: [file] });
    expect(err).toBeUndefined();
  });
});
