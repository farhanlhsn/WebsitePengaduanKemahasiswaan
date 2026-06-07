describe('emailValidator (with whitelist)', () => {
  let isAllowedDomain;
  let getAllowedDomains;

  beforeEach(() => {
    jest.resetModules();
    process.env.ALLOWED_EMAIL_DOMAINS = 'mahasiswa.bunghatta.ac.id,bunghatta.ac.id';
    ({ isAllowedDomain, getAllowedDomains } = require('../../../src/utils/emailValidator'));
  });

  afterEach(() => {
    delete process.env.ALLOWED_EMAIL_DOMAINS;
  });

  test('returns false for non-string / falsy email', () => {
    expect(isAllowedDomain(undefined)).toBe(false);
    expect(isAllowedDomain('')).toBe(false);
    expect(isAllowedDomain(null)).toBe(false);
    expect(isAllowedDomain(123)).toBe(false);
  });

  test('rejects email without @', () => {
    expect(isAllowedDomain('not-an-email')).toBe(false);
  });

  test('accepts whitelisted domains (case-insensitive)', () => {
    expect(isAllowedDomain('a@mahasiswa.bunghatta.ac.id')).toBe(true);
    expect(isAllowedDomain('a@MAHASISWA.BUNGHATTA.AC.ID')).toBe(true);
    expect(isAllowedDomain('a@bunghatta.ac.id')).toBe(true);
  });

  test('rejects non-whitelisted domains', () => {
    expect(isAllowedDomain('a@gmail.com')).toBe(false);
    expect(isAllowedDomain('a@yahoo.com')).toBe(false);
  });

  test('exposes whitelist via getAllowedDomains', () => {
    expect(getAllowedDomains()).toEqual(['mahasiswa.bunghatta.ac.id', 'bunghatta.ac.id']);
  });
});

describe('emailValidator (no whitelist configured)', () => {
  let isAllowedDomain;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ALLOWED_EMAIL_DOMAINS;
    ({ isAllowedDomain } = require('../../../src/utils/emailValidator'));
  });

  test('allows all when whitelist is empty (dev mode)', () => {
    expect(isAllowedDomain('a@gmail.com')).toBe(true);
    expect(isAllowedDomain('a@bunghatta.ac.id')).toBe(true);
  });
});
