const { validatePassword, POLICY } = require('../../../src/utils/passwordPolicy');

describe('passwordPolicy.validatePassword', () => {
  test('rejects empty / non-string input', () => {
    expect(validatePassword(undefined)).toEqual({ valid: false, errors: ['Password wajib diisi'] });
    expect(validatePassword('')).toEqual({ valid: false, errors: ['Password wajib diisi'] });
    expect(validatePassword(null)).toEqual({ valid: false, errors: ['Password wajib diisi'] });
    expect(validatePassword(12345678)).toEqual({ valid: false, errors: ['Password wajib diisi'] });
  });

  test('rejects too-short passwords', () => {
    const r = validatePassword('Ab1');
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual(expect.arrayContaining([expect.stringMatching(/minimal 8/)]));
  });

  test('rejects too-long passwords', () => {
    const long = 'A1' + 'a'.repeat(POLICY.maxLength); // > maxLength
    const r = validatePassword(long);
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual(expect.arrayContaining([expect.stringMatching(/maksimal/)]));
  });

  test('requires lowercase, uppercase, and digit', () => {
    expect(validatePassword('ABCDEFGH').valid).toBe(false);
    expect(validatePassword('abcdefgh').valid).toBe(false);
    expect(validatePassword('ABCDEFG1').valid).toBe(false);
  });

  test('rejects common passwords', () => {
    const r = validatePassword('Password1');
    // "password1" is in COMMON_PASSWORDS list
    expect(r.errors).toEqual(expect.arrayContaining([expect.stringMatching(/terlalu umum/)]));
  });

  test('accepts strong password', () => {
    const r = validatePassword('StrongP@ss1');
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test('reports multiple errors at once', () => {
    const r = validatePassword('abc');
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(1);
  });
});
